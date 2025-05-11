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
import os
import asyncio

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
        
        # Begin assessment ----------------------------------------------------------------
        if action["type"] == "begin":
            # Use the provided userId and timestamp
            user_id = action["userId"]
            timestamp = action["timestamp"]
            number_of_questions = action.get("numberOfQuestions", 1)
            
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
            for diff_str in action.get("selectedDifficulty", []):
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
                "selectedNumberOfQuestions": number_of_questions,  # Start with 1, will increment on ongoing calls
                "status": "ongoing",
                "metrics": {},
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
                    import random
                    requested_topic = random.choice(action["selectedTopics"])
                    requested_difficulty = random.choice(action["selectedDifficulty"])
                    
                    # Call the OpenSearch Lambda to get matching question IDs
                    lambda_client = boto3.client('lambda')
                    payload = {
                        "topic": requested_topic,
                        "difficulty": requested_difficulty
                    }
                    
                    # Get the OpenSearch Lambda ARN from environment variables
                    opensearch_lambda_arn = os.environ.get("OPENSEARCH_LAMBDA_ARN")
                    
                    logger.info(f"Calling OpenSearch Lambda with payload: {payload}")
                    
                    # Invoke the OpenSearch Lambda
                    response = lambda_client.invoke(
                        FunctionName=opensearch_lambda_arn,
                        InvocationType='RequestResponse',
                        Payload=json.dumps(payload)
                    )
                    
                    # Parse the response
                    result = json.loads(response['Payload'].read().decode('utf-8'))
                    if result.get("statusCode") != 200:
                        logger.error(f"Error from OpenSearch Lambda: {result}")
                        raise Exception(f"Error from OpenSearch Lambda: {result}")
                        
                    # Get the question IDs from the response
                    body = json.loads(result.get('body', '{}'))
                    question_ids = body.get('questionIds', [])
                    
                    logger.info(f"Got {len(question_ids)} matching question IDs from OpenSearch")
                    
                    # If we have matching IDs, fetch them from DynamoDB
                    matching_questions = []
                    if question_ids:
                        for qid in question_ids:
                            question_response = question_bank_table.get_item(
                                Key={"questionId": qid}
                            )
                            question_item = question_response.get('Item')
                            if question_item:
                                matching_questions.append(question_item)
                    
                    # If we found matching questions, select one randomly
                    if len(matching_questions) > 0:
                        import random
                        question = random.choice(matching_questions)

                        question_Id = question.get("questionId", "")
                        question_topics = question.get("topics", [])
                        question_difficulty = question.get("difficulty", "")
                        
                        # Create question record
                        question_record = {
                            "questionId": question_Id,  # Include question ID
                            "topics": question_topics,  # Include topics of question
                            "currentTopic": requested_topic,  # Include selected topic
                            "difficulty": question_difficulty,  # Include difficulty
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
                        # Return specified fields expected by the client
                        return_statement = {
                            "assessmentId": f"{timestamp}",
                            "questionId": question.get("questionId", ""),
                            "questionTitle": question.get("title", ""),
                            "questionDescription": question.get("description", ""),
                            "starterCode": question.get("starterCode", ""),
                            "questionTopics": question.get("topics", []),
                            "questionDifficulty": question.get("difficulty", "")
                        }
                        return return_statement
                    else:
                        #todo: update error handling
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
                    #todo: update error handling
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
                

        # Ongoing assessment ----------------------------------------------------------------       

        elif action["type"] == "ongoing":
            user_id = action["userId"]
            timestamp = action["assessmentId"]

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
                

                MAX_ATTEMPTS = 2  # first try + one retry
                RETRY_DELAY = 1  # seconds

                # 1) Extract the set of all already‐served question IDs
                done_ids = { q.questionId for q in assessment_record.questions }
                completed_topic_difficulty_pairs = { (q.currentTopic, q.difficulty) for q in assessment_record.questions }
                selected_question_amount = assessment_record.selectedNumberOfQuestions

                for attempt in range(MAX_ATTEMPTS):

                    if attempt > 0: 
                        logger.info(f"Retrying to find a question (attempt {attempt + 1})")
                        await asyncio.sleep(RETRY_DELAY)
                    

                    # 2) Recompute previous pairing and performance
                    if not assessment_record.questions:
                        raise HTTPException(500, "No previous question to reference")
                    
                    prev_q = assessment_record.questions[-1]
                    prev_pair = (prev_q.currentTopic, prev_q.difficulty)
                    prev_perf = {
                        "bestExecTime": prev_q.bestExecTime,
                        "bestExecMem": prev_q.bestExecMem,
                        "attempts": len(prev_q.attempts),
                        "testCasesPassed": prev_q.testCasesPassed,
                        "timeStarted": prev_q.timeStarted,
                        "timeEnded": prev_q.timeEnded,
                    }

                    # 3) Build the full set of possible topic–difficulty combos
                    all_pairs = [
                        (t, d)
                        for t in assessment_record.selectedTopics
                        for d in assessment_record.selectedDifficulty
                    ]

                    # 4) Prompt Bedrock (telling it to avoid prev_pair)
                    prompt =    f"""
                                You are a recommender.
                                Requested topics: {assessment_record.selectedTopics}
                                Requested difficulties: {assessment_record.selectedDifficulty}
                                Previously served pairs: {completed_topic_difficulty_pairs}
                                User requested number of questions: {selected_question_amount}
                                All possible topic-difficulty combos: {all_pairs}
                                Previous performance: {prev_perf}

                                From the list of all possible combos, select one that has NOT yet been served.  
                                If every combo has already been previously served AND the total requested questions ({selected_question_amount})  
                                exceeds the count of unique combos, you MAY pick a combo that was already served.  
                                Use the user's previous performance to guide your choice (e.g. ease off harder combos if needed).  
                                Respond **only** in JSON format exactly as:
                                {{ "topic": "<topic>", "difficulty": "<difficulty>" }}
                                """
                    
                    #Previously served pair: {prev_pair}
                    #Previous performance:   {prev_perf}

                    #prompt = f"""
                    #        You are a recommender.
                    #        Requested topics:       {assessment_record.selectedTopics}
                    #        Requested difficulties: {assessment_record.selectedDifficulty}
                    #        Previously served pairs: {prev_pair}
                    #        User Selected Number of Questions: {selected_question_amount}
                    #        All possible combos:    {all_pairs}


                    #        Pick one **different** pair at random (i.e. not the previously served pair).
                    #        Use previous performance to inform your choices.
                    #        Respond **only** in JSON: {{ "topic": "<topic>", "difficulty": "<difficulty>" }}   
                    #        """
                    
                    payload = {
                        "anthropic_version": "bedrock-2023-05-31",
                        "max_tokens": 50,
                        "temperature": 0.7,
                        "messages": [{"role": "user", "content": prompt}]
                    }

                    bedrock_resp = bedrock.invoke_model(
                        modelId="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
                        contentType="application/json",
                        accept="application/json",
                        body=json.dumps(payload)
                    )
                    text = json.loads(bedrock_resp["body"].read())["content"][0]["text"]
                    choice = json.loads(text)
                    next_topic, next_difficulty = choice["topic"], choice["difficulty"]

                    # 5) Call OpenSearch Lambda
                    lambda_client = boto3.client('lambda')
                    os_payload = {"queryData": {"topic": next_topic, "difficulty": next_difficulty}}
                    fn_arn = os.environ["OPENSEARCH_LAMBDA_ARN"]
                    os_resp = lambda_client.invoke(
                        FunctionName = fn_arn,
                        InvocationType = "RequestResponse",
                        Payload = json.dumps(os_payload).encode("utf-8")
                    )
                    ids = json.loads(os_resp["Payload"].read())["body"]
                    ids = json.loads(ids).get("questionIds", [])

                    # 6) Filter out already‐served
                    available_ids = [qid for qid in ids if qid not in done_ids]
                    if available_ids:
                        break  # success!

                    # else: retry once more before giving up

                # 3) If nothing left, bail out
                if not available_ids:
                    return {
                        "assessmentId": timestamp,
                        "message": f"No new questions left for topic {next_topic}, difficulty {next_difficulty}"
                    }
                
                import random
                chosen_id = random.choice(available_ids)
                next_question = question_bank_table.get_item(Key={"questionId": chosen_id}).get("Item", {})

                question_record = {
                    "questionId": next_question.get("questionId", ""),
                    "topics": next_question.get("topics", []),
                    "difficulty": next_difficulty,
                    "currentTopic": next_topic,
                    "attempts": [],
                    "timeStarted": datetime.now().isoformat(),
                    "timeEnded": "",
                    "bestExecTime": 999999999,
                    "bestExecMem": 999999999,
                    "testCasesPassed": 0,
                    "status": "incomplete"
                }

                if assessment_record.questions:
                    previous_question = assessment_record.questions[-1]
                    previous_question.timeEnded = datetime.now().isoformat()
                    #previous_question.status = QuestionStatus.PASS


                assessment_record.questions.append(question_record)
                assessment_record.selectedNumberOfQuestions += 1
                #assessments_table.put_item(Item=serialize(assessment_record))

                new_questions = [ serialize(q) for q in assessment_record.questions ]

                assessments_table.update_item(
                    Key={
                        "userId":    user_id,
                        "timestamp": timestamp
                    },
                    UpdateExpression="""
                        SET questions                = :qs,
                            selectedNumberOfQuestions = :n
                    """,
                    ExpressionAttributeValues={
                        ":qs": new_questions,
                        ":n":  assessment_record.selectedNumberOfQuestions
                    }
                )

                return_statement = {
                    "assessmentId": timestamp,
                    "questionId": question_record.get("questionId", ""),
                    "questionTitle": next_question.get("title", ""),
                    "questionDescription": next_question.get("description", ""),
                    "starterCode": next_question.get("starterCode", ""),
                    "questionTopics": next_question.get("topics", []),
                    "questionDifficulty": next_question.get("difficulty", "")
                }

                return return_statement
                    
            except Exception as e:
                logger.error(f"Error retrieving assessment: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Failed to retrieve assessment: {str(e)}")
            
        # End assessment ----------------------------------------------------------------
        elif action["type"] == "end":
            user_id   = action["userId"]
            timestamp = action["assessmentId"]

            try:
                # 1) Fetch the existing record
                resp = assessments_table.get_item(Key={"userId": user_id, "timestamp": timestamp})
                if "Item" not in resp:
                    raise HTTPException(status_code=404, detail="Assessment not found")

                assessment = deserialize(AssessmentRecord, resp["Item"])

                # 2) Close out the last question
                if assessment.questions:
                    last_q = assessment.questions[-1]
                    last_q.timeEnded = datetime.now().isoformat()
                    #last_q.status = QuestionStatus.PASS

                # 3) Mark the assessment complete
                assessment.status = Status.COMPLETE

                # 4) Prepare fields to update
                new_questions = [serialize(q) for q in assessment.questions]
                new_status = assessment.status.value if hasattr(assessment.status, 'value') else assessment.status

                # 5) Partial update so metrics stays untouched
                assessments_table.update_item(
                    Key={
                        "userId":    user_id,
                        "timestamp": timestamp
                    },
                    UpdateExpression="""
                        SET questions = :qs,
                            #s        = :st
                    """,
                    ExpressionAttributeNames={
                        "#s": "status"
                    },
                    ExpressionAttributeValues={
                        ":qs": new_questions,
                        ":st": new_status
                    }
                )

                # 6) Return simple payload
                return {
                    "status":       "completed",
                    "assessmentId": timestamp
                }

            except HTTPException:
                # rethrow known HTTP errors
                raise
            except Exception as e:
                logger.error(f"Error ending assessment: {e}", exc_info=True)
                raise HTTPException(status_code=500, detail=f"Failed to end assessment: {e}")

            
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