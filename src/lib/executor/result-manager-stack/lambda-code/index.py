import os
import json
import boto3
from decimal import Decimal
from dynamo_schemas import *
from dynamo_reader import *

def getAttemptObject(results):
    attempt: Attempt = Attempt(
        execTimeTaken = 10000000,
        execMemoryTaken = 10000000,
        status = AttemptStatus.FAIL
    )

    avg_exec_time = avg_mem = test_cases_passed = total_test_cases = 0
    for test in results:
        total_test_cases += 1
        passed = test.get("passed")
        test_cases_passed += passed

        if passed:
            avg_exec_time += test.get("exec_time")
            avg_mem += test.get("mem_kb")

    if test_cases_passed == total_test_cases:
        attempt.status = AttemptStatus.SUCCESS
    if test_cases_passed:
        attempt.execTimeTaken = avg_exec_time / test_cases_passed
        attempt.execMemoryTaken = avg_mem / test_cases_passed
    
    attempt.execTimeTaken = Decimal(str(attempt.execTimeTaken))
    attempt.execMemoryTaken = Decimal(str(attempt.execMemoryTaken))
    return attempt, int(test_cases_passed // total_test_cases) * 100

def get_assessment(table, user_id, timestamp):
    if not table or not user_id or not timestamp:
        return None
    response = table.get_item(
        Key={
            "userId": user_id,
            "timestamp": timestamp
        }
    )

    item = response.get("Item")
    if not item:
        return None

    return deserialize(AssessmentRecord, item)

def handler(event, context):
    print(event)

    dynamodb = boto3.resource("dynamodb")
    users = dynamodb.Table(os.environ["USER_TABLE_NAME"])
    assessments = dynamodb.Table(os.environ["ASSESSMENTS_TABLE_NAME"])

    attempt, casesPassed = getAttemptObject(event.get("results"))
    assessment: AssessmentRecord = get_assessment(
        assessments,
        event.get("userID"),
        event.get("assessmentID") 
    )
    if assessment is None:
        print("Error: assessment is None")
        return {"statusCode": 500, "body": f"Error"}

    cur_question: QuestionsDone = assessment.questions[-1]
    cur_question.attempts.append(attempt)
    cur_question.bestExecMem = min(cur_question.bestExecMem, attempt.execMemoryTaken)
    cur_question.bestExecTime = min(cur_question.bestExecTime, attempt.execTimeTaken)
    cur_question.testCasesPassed = max(cur_question.testCasesPassed, casesPassed)
    if attempt.status == AttemptStatus.SUCCESS:
        cur_question.status = QuestionStatus.PASS

    assessments.put_item(Item=serialize(assessment))

    return {"statusCode": 200, "body": f"Received"}


# {
# userID,
# timestamp,
# results

# }

# input
# {
# userID (string);
# questionID (string);

# assessmentID (timestamp);

# userCode (string);
# userSelectedLanguage (string/enum);
# }

# OUTPUT
# {
# assessmentID;

# questionID;

# status (enum = pass/fail);

# codeOutput (string);

# executionTime (seconds);

# executionMemory (kb);
# }
