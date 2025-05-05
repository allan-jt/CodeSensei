from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import boto3
import logging
import json
from datetime import datetime
from dynamo_schemas import *
from dynamo_reader import serialize, deserialize
from decimal import Decimal

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


app = FastAPI()
bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")

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
        matching_questions = []
        question = {}
        
        if action["type"] == "begin":
            # Use the provided userId and timestamp
            user_id = action["userId"]
            timestamp = action["timestamp"]
            
            # Convert string topics to Topic enum - Handle multiple topics correctly
            selected_topics = []
            for topic_str in action.get("selectedTopics", []):
                found_match = False
                for topic_enum in Topic:
                    # Exact match (case insensitive)
                    if topic_enum.value.lower() == topic_str.lower():
                        selected_topics.append(topic_enum)
                        found_match = True
                        break
                    # Handle plural forms (e.g., "Arrays" matches "Array")
                    elif topic_str.lower().rstrip('s') == topic_enum.value.lower():
                        selected_topics.append(topic_enum)
                        found_match = True
                        break
                
                if not found_match:
                    logger.warning(f"Topic '{topic_str}' not found in enum")
            
            # Convert string difficulties to Difficulty enum
            selected_difficulties = []
            for diff_str in action.get("selectedDifficulty", ["medium"]):
                found_match = False
                for diff_enum in Difficulty:
                    if diff_enum.value.lower() == diff_str.lower():
                        selected_difficulties.append(diff_enum)
                        found_match = True
                        break
                
                if not found_match:
                    logger.warning(f"Difficulty '{diff_str}' not found in enum")
            
            # Create assessment record - make sure all fields are included
            assessment_record = {
                "userId": user_id,
                "timestamp": timestamp,
                "selectedTopics": [topic.value for topic in selected_topics],  # Convert enums to values
                "selectedDifficulty": [diff.value for diff in selected_difficulties],  # Convert enums to values
                "selectedDuration": action.get("selectedDuration", 60) * 60,  # Convert to seconds
                "selectedNumberOfQuestions": 1,  # Start with 1, will increment on ongoing calls
                "status": "ongoing",
                "metrics": {
                    "scope": {
                        "count": 0,
                        "total": 0
                    }
                },
                "questions": []
            }
            
            try:
                # Save to DynamoDB
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
            
            # Initialize variables for question finding
            matching_questions = []
            question = {}
            
            # Query for a question based on selected topic and difficulty
            if action.get("selectedTopics") and action.get("selectedDifficulty"):
                try:
                    # Get the first topic and difficulty for querying
                    requested_topic = action["selectedTopics"][0].lower()
                    requested_difficulty = action["selectedDifficulty"][0].lower()
                    
                    # Scan the table for all questions
                    response = question_bank_table.scan()
                    all_questions = response.get("Items", [])
                    
                    # Filter questions that match topic and difficulty
                    for q in all_questions:
                        q_topics = [t.lower() for t in q.get("topics", [])]
                        q_difficulty = q.get("difficulty", "").lower()
                        
                        # Check if the requested topic matches any question topic
                        topic_match = any(
                            requested_topic in topic or 
                            requested_topic.rstrip('s') in topic or
                            topic in requested_topic
                            for topic in q_topics
                        )
                        difficulty_match = requested_difficulty == q_difficulty
                        
                        if topic_match and difficulty_match:
                            matching_questions.append(q)
                    
                    # If no exact matches, try matching just by topic
                    if len(matching_questions) == 0:
                        logger.warning(f"No questions found for topic: {requested_topic}, difficulty: {requested_difficulty}")
                        
                        for q in all_questions:
                            q_topics = [t.lower() for t in q.get("topics", [])]
                            topic_match = any(
                                requested_topic in topic or 
                                requested_topic.rstrip('s') in topic or
                                topic in requested_topic
                                for topic in q_topics
                            )
                            
                            if topic_match:
                                matching_questions.append(q)
                    
                    # If we found matching questions, select one randomly
                    if len(matching_questions) > 0:
                        import random
                        question = random.choice(matching_questions)
                        
                        # Create question record
                        question_record = {
                            "questionId": question.get("questionId", ""),
                            "topic": str(question.get("topics", [action["selectedTopics"][0]])[0]),  # Include topic of question
                            "difficulty":str(question.get("difficulty", action["selectedDifficulty"][0])),  # Include difficulty
                            "attempts": [],
                            "timeStarted": datetime.now().isoformat(),
                            "timeEnded": "",
                            "bestExecTime": 999999999,
                            "bestExecMem": 999999999,
                            "testCasesPassed": 0,
                            "status": "incomplete"
                        }
                        
                        # Update assessment record with question
                        assessment_record["questions"].append(question_record)
                        
                        # Save the updated assessment
                        assessments_table.put_item(Item=assessment_record)
                    
                    # Return response based on whether question was found
                    if question:
                        # Return the entire assessment record
                        assessment_record["assessmentId"] = f"{user_id}#{timestamp}"
                        return assessment_record
                    else:
                        # No questions found, return placeholder
                        return {
                            "assessmentId": f"{user_id}#{timestamp}",
                            "message": "No matching questions found. Using placeholder.",
                            "questionId": "",
                            "questionTitle": "Sample Question",
                            "questionDescription": "This is a placeholder question as no matching questions were found.",
                            "starterCode": "# Your code here",
                            "questionTopics": action["selectedTopics"],
                            "questionDifficulty": action["selectedDifficulty"][0]
                        }
                    
                except Exception as e:
                    logger.error(f"Error querying questions: {str(e)}")
                    return {
                        "assessmentId": f"{user_id}#{timestamp}",
                        "message": f"Assessment created, but error fetching questions: {str(e)}",
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
                    "assessmentId": f"{user_id}#{timestamp}",
                    "message": "Assessment created successfully, but no topics or difficulty specified."
                }
                    
        elif action["type"] == "ongoing":
            user_id = action["userId"]
            timestamp = action["timestamp"]
            assessment_id = f"{user_id}#{timestamp}"

            try:
                # Fetch assessment
                response = assessments_table.get_item(
                    Key={"userId": user_id, "timestamp": timestamp}
                )

                if 'Item' not in response:
                    logger.error(f"Assessment not found for user {user_id} at {timestamp}")
                    raise HTTPException(status_code=404, detail="Assessment not found")

                assessment_record = deserialize(AssessmentRecord, response["Item"])
                logger.info(f"Deserialized assessment:\n{serialize(assessment_record)}")
                if assessment_record is None:
                    logger.error("Deserialization returned None")
                    raise HTTPException(status_code=500, detail="Failed to deserialize")

                # 1. Determine served topic-difficulty pairs
                served_pairs = {
                    (q.topic.lower(), q.difficulty.lower())
                    for q in assessment_record.questions
                }

                # 2. Determine all requested combinations (use strings directly)
                all_pairs = {
                    (t.lower(), d.lower())
                    for t in assessment_record.selectedTopics
                    for d in assessment_record.selectedDifficulty
                }
                remaining_pairs = list(all_pairs - served_pairs)

                if not remaining_pairs:
                    return {
                        "assessmentId": assessment_id,
                        "selectedTopics": assessment_record.selectedTopics,
                        "selectedDifficulty": assessment_record.selectedDifficulty,
                        "selectedNumberOfQuestions": assessment_record.selectedNumberOfQuestions,
                        "questions": [serialize(q) for q in assessment_record.questions],
                        "nextRecommendation": None,
                        "message": "All topic-difficulty pairs served."
                    }

                # 3. Ask Bedrock which to serve next
                prompt = f"""
        You are a recommender.
        Selected topics: {assessment_record.selectedTopics}
        Selected difficulties: {assessment_record.selectedDifficulty}
        Already served: {list(served_pairs)}
        Pick ONE unserved (topic, difficulty) pair from the rest.
        Respond as JSON: {{ "topic": "<>", "difficulty": "<>" }}
        """
                payload_to_bedrock = {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 50,
                    "temperature": 0.7,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ]
                }

                logger.info(f"🧠 Calling Bedrock with payload:\n{json.dumps(payload_to_bedrock, indent=2)}")

                bedrock_response = bedrock.invoke_model(
    modelId="us.anthropic.claude-3-5-sonnet-20241022-v2:0",  # Use inference profile ID
    contentType="application/json",
    accept="application/json",
    body=json.dumps(payload_to_bedrock)
)
                

                # Parse model output
                # Parse model output
                raw_body = bedrock_response["body"].read()
                completion = json.loads(raw_body)

                # Extract the actual text from the Claude v3 style response
                text = completion["content"][0]["text"]

                # Now parse the JSON inside that text
                model_response = json.loads(text)
                next_topic = model_response["topic"]
                next_difficulty = model_response["difficulty"]

                return {
                    "assessmentId": assessment_id,
                    "selectedTopics": assessment_record.selectedTopics,
                    "selectedDifficulty": assessment_record.selectedDifficulty,
                    "selectedNumberOfQuestions": assessment_record.selectedNumberOfQuestions,
                    "questions": [serialize(q) for q in assessment_record.questions],
                    "nextRecommendation": {
                        "topic": next_topic,
                        "difficulty": next_difficulty
                    }
                }

            except Exception as e:
                logger.error(f"Error retrieving assessment: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Failed to retrieve assessment: {str(e)}")

        elif action["type"] == "end":
            # Get userId and assessmentId
            user_id = action["userId"]
            timestamp = action["assessmentId"]
            
            try:
                # Get the assessment first
                response = assessments_table.get_item(
                    Key={
                        "userId": user_id,
                        "timestamp": timestamp
                    }
                )
                
                if 'Item' not in response:
                    raise HTTPException(status_code=404, detail="Assessment not found")
                
                # Deserialize the assessment
                assessment = deserialize(AssessmentRecord, response['Item'])
                
                # Update the status
                assessment.status = AssessmentStatus.COMPLETE
                
                # Serialize and save back to DynamoDB
                assessments_table.put_item(Item=serialize(assessment))
                
                return {
                    "status": "completed",
                    "assessmentId": timestamp
                }
                
            except Exception as e:
                logger.error(f"Error ending assessment: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Failed to end assessment: {str(e)}")
        
        else:
            raise HTTPException(status_code=400, detail=f"Invalid action type: {action['type']}")
            
    except KeyError as ke:
        logger.error(f"Missing required field: {str(ke)}")
        raise HTTPException(status_code=400, detail=f"Missing required field: {str(ke)}")
    except Exception as e:
        logger.error(f"Error processing assessment action: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process assessment action: {str(e)}")
    
def sanitize_floats_to_decimal(obj):
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: sanitize_floats_to_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_floats_to_decimal(v) for v in obj]
    else:
        return obj