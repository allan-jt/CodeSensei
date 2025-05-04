from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import boto3
import logging
import json
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class AssessmentAction(BaseModel):
    userId: str
    timestamp: Optional[str] = None
    type: str  # "begin", "ongoing", or "end"
    selectedTopics: Optional[List[str]] = None
    selectedDifficulty: Optional[List[str]] = None
    selectedDuration: Optional[int] = None
    numberOfQuestions: Optional[int] = None

@app.get("/")
async def root():
    return {"status": "healthy"}

@app.get("/ping")
async def ping():
    return {"status": "alive"}

@app.post("/assessments/action")
async def process_assessment_action(action: dict):
    try:
        # Initialize DynamoDB client
        dynamodb = boto3.resource('dynamodb')
        assessments_table = dynamodb.Table('AssessmentsTable')
        question_bank_table = dynamodb.Table('QuestionBankTable')
        
        if action["type"] == "begin":
            # Use the provided userId and timestamp
            user_id = action["userId"]
            timestamp = action["timestamp"]
            
            # Create assessment record with proper schema
            assessment_record = {
                "userId": user_id,
                "timestamp": timestamp,
                "selectedTopics": action.get("selectedTopics", []),
                "selectedDifficulty": action.get("selectedDifficulty", ["Medium"]),
                "selectedDuration": action.get("selectedDuration", 60) * 60,  # Convert minutes to seconds
                "selectedNumberOfQuestions": 1,  # Set to 1 for begin action
                "status": "ongoing",  # Set status as ongoing for begin action
                "metrics": {
                    "scope": {
                        "count": 0,
                        "total": 0
                    }
                },
                "questions": []  # Initialize empty questions array
            }
            
            try:
                # Conditional write - only create if it doesn't exist
                assessments_table.put_item(
                    Item=assessment_record,
                    ConditionExpression="attribute_not_exists(userId) AND attribute_not_exists(#ts)",
                    ExpressionAttributeNames={
                        "#ts": "timestamp"
                    }
                )
                
                logger.info(f"Created new assessment for user {user_id} at {timestamp}")
                
            except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
                logger.warning(f"Assessment already exists for user {user_id} at {timestamp}")
                
                # Get the existing assessment
                existing_assessment = assessments_table.get_item(
                    Key={
                        "userId": user_id,
                        "timestamp": timestamp
                    }
                )
                
                assessment_record = existing_assessment.get("Item", assessment_record)
            
            # Query for a question based on selected topic and difficulty
            if action.get("selectedTopics") and action.get("selectedDifficulty"):
                try:
                    # Get the first topic and difficulty
                    requested_topic = action["selectedTopics"][0].lower()
                    requested_difficulty = action["selectedDifficulty"][0].lower()
                    
                    # Scan the table for all questions
                    all_questions = question_bank_table.scan()
                    
                    # Filter questions that match topic and difficulty (case-insensitive)
                    matching_questions = []
                    for q in all_questions.get("Items", []):
                        q_topics = [t.lower() for t in q.get("topics", [])]
                        q_difficulty = q.get("difficulty", "").lower()
                        
                        topic_match = any(requested_topic in topic for topic in q_topics)
                        difficulty_match = requested_difficulty == q_difficulty
                        
                        if topic_match and difficulty_match:
                            matching_questions.append(q)
                    
                    # If no exact matches, try matching just by topic
                    if not matching_questions:
                        logger.warning(f"No questions found for topic: {requested_topic}, difficulty: {requested_difficulty}")
                        
                        matching_questions = []
                        for q in all_questions.get("Items", []):
                            q_topics = [t.lower() for t in q.get("topics", [])]
                            topic_match = any(requested_topic in topic for topic in q_topics)
                            
                            if topic_match:
                                matching_questions.append(q)
                    
                    # If we found matching questions, select one randomly
                    if matching_questions:
                        import random
                        question = random.choice(matching_questions)
                        
                        # Get current time for timeStarted
                        import datetime
                        current_time = datetime.datetime.now().isoformat()
                        
                        # Create question record for the assessment
                        question_record = {
                            "questionId": question.get("questionId", ""),
                            "topic": question.get("topics", [action["selectedTopics"][0]])[0],  # Use first topic
                            "difficulty": question.get("difficulty", action["selectedDifficulty"][0]),
                            "attempts": 0,  # Initialize attempts count
                            "timeStarted": current_time,  # Set start time
                            "timeEnd": "",  # Empty until completed
                            "attempts": [],  # Initialize empty attempts array
                            "bestExecTime": 0,  # Initialize best execution time
                            "bestExecMem": 0,  # Initialize best execution memory
                            "testCasesPassed": 0,  # Initialize test cases passed
                            "status": "incomplete"  # Set initial status as incomplete
                        }
                        
                        # Update assessment record with this question
                        assessments_table.update_item(
                            Key={
                                "userId": user_id,
                                "timestamp": timestamp
                            },
                            UpdateExpression="SET questions = list_append(if_not_exists(questions, :empty_list), :question)",
                            ExpressionAttributeValues={
                                ":empty_list": [],
                                ":question": [question_record]
                            }
                        )
                        
                    else:
                        # No matches found
                        question = {}
                    
                    if not question:
                        # If still no questions, return a placeholder
                        return {
                            "assessmentId": timestamp,
                            "message": "No matching questions found. Using placeholder.",
                            "questionId": "",
                            "questionTitle": "Sample Question",
                            "questionDescription": "This is a placeholder question as no matching questions were found.",
                            "starterCode": "# Your code here",
                            "questionTopics": action["selectedTopics"],
                            "questionDifficulty": action["selectedDifficulty"][0]
                        }
                    
                    # Return question information
                    return {
                        "assessmentId": timestamp,
                        "questionId": question.get("questionId", ""),
                        "questionTitle": question.get("title", "Sample Question"),
                        "questionDescription": question.get("description", "This is a placeholder question"),
                        "starterCode": question.get("starterCode", "# Your code here"),
                        "questionTopics": question.get("topics", action["selectedTopics"]),
                        "questionDifficulty": question.get("difficulty", action["selectedDifficulty"][0]),
                        "testCases": question.get("testCases", [])
                    }
                    
                except Exception as e:
                    logger.error(f"Error querying questions: {str(e)}")
                    return {
                        "assessmentId": timestamp,
                        "message": "Assessment created, but error fetching questions: " + str(e),
                        "questionId": "",
                        "questionTitle": "Sample Question",
                        "questionDescription": "This is a placeholder question.",
                        "starterCode": "# Your code here",
                        "questionTopics": action["selectedTopics"],
                        "questionDifficulty": action["selectedDifficulty"][0]
                    }
            else:
                # If no topics or difficulties selected, return a generic response
                return {
                    "assessmentId": timestamp,
                    "message": "Assessment created successfully, but no topics or difficulty specified."
                }
                    
        elif action["type"] == "ongoing":
    # Extract user_id and timestamp from the request
            user_id = action["userId"]
            timestamp = action["timestamp"]
            
            try:
                # First, get the current assessment
                response = assessments_table.get_item(
                    Key={
                        "userId": user_id,
                        "timestamp": timestamp
                    }
                )
                
                # Check if assessment exists
                if 'Item' not in response:
                    logger.error(f"Assessment not found for user {user_id} at {timestamp}")
                    raise HTTPException(status_code=404, detail="Assessment not found")
                
                # Get the assessment data
                assessment = response['Item']
                
                # Then, increment the selectedNumberOfQuestions counter
                assessments_table.update_item(
                    Key={
                        "userId": user_id,
                        "timestamp": timestamp
                    },
                    UpdateExpression="SET selectedNumberOfQuestions = if_not_exists(selectedNumberOfQuestions, :zero) + :one",
                    ExpressionAttributeValues={
                        ":zero": 0,
                        ":one": 1
                    }
                )
                
                # Check if there are any questions in the assessment
                questions = assessment.get("questions", [])
                
                if not questions:
                    logger.warning(f"No questions found in assessment for user {user_id} at {timestamp}")
                    
                    return {
                        "assessmentId": timestamp,
                        "message": "Assessment found but no questions are available.",
                        "questions": []
                    }
                
                # Return the assessment data in the exact format requested
                return {
                    "assessmentId": timestamp,
                    "message": "Assessment retrieved successfully",
                    "questions": questions,
                    "selectedTopics": assessment.get("selectedTopics", []),
                    "selectedDifficulty": assessment.get("selectedDifficulty", []),
                    "selectedDuration": assessment.get("selectedDuration", 0),
                    "status": assessment.get("status", "ongoing")
                }
                
            except Exception as e:
                logger.error(f"Error retrieving assessment: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Failed to retrieve assessment: {str(e)}")
       
        elif action["type"] == "end":
            # Get userId and assessmentId
            user_id = action["userId"]
            timestamp = action["assessmentId"]
            
            # Update the assessment status
            assessments_table.update_item(
                Key={
                    "userId": user_id,
                    "timestamp": timestamp
                },
                UpdateExpression="SET #status = :status",
                ExpressionAttributeNames={
                    "#status": "status"
                },
                ExpressionAttributeValues={
                    ":status": "complete"
                }
            )
            
            return {
                "status": "completed",
                "assessmentId": timestamp
            }
        
        else:
            raise HTTPException(status_code=400, detail=f"Invalid action type: {action['type']}")
            
    except KeyError as ke:
        logger.error(f"Missing required field: {str(ke)}")
        raise HTTPException(status_code=400, detail=f"Missing required field: {str(ke)}")
    except Exception as e:
        logger.error(f"Error processing assessment action: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process assessment action: {str(e)}")