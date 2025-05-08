import os
import json
import boto3
from decimal import Decimal
from dynamo_schemas import *
from dynamo_reader import *

dynamodb = boto3.resource("dynamodb")
users = dynamodb.Table(os.environ["USER_TABLE_NAME"])
assessments = dynamodb.Table(os.environ["ASSESSMENTS_TABLE_NAME"])

def getAttemptObject(results):
    attempt: Attempt = Attempt(
        execTimeTaken = 10000000,
        execMemoryTaken = 10000000,
        status = AttemptStatus.FAIL
    )

    codeOutput = ""
    avg_exec_time = avg_mem = test_cases_passed = total_test_cases = 0
    for test in results:
        codeOutput += f'Test case: {test.get("test_case")}\n'
        codeOutput += f'Expected output: {test.get("expected_output")}\n'
        codeOutput += f'Code output: {test.get("result")}\n\n'

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
    return attempt, int(test_cases_passed // total_test_cases) * 100, codeOutput

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

def send_socket_message(connection_id, data, domain_name, stage):
    print(f"Frontend data: {data}")
    endpoint = f"https://{domain_name}/{stage}"
    client = boto3.client('apigatewaymanagementapi', endpoint_url=endpoint)

    try:
        client.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps(data).encode('utf-8')
        )
    except client.exceptions.GoneException:
        print(f"Connection {connection_id} is gone.")

def handler(event, context):
    print(event)

    userID = event.get("userID")
    assessmentID = event.get("assessmentID")
    results = event.get("results")

    attempt, casesPassed, codeOutput = getAttemptObject(results)
    assessment: AssessmentRecord = get_assessment(
        assessments,
        userID,
        assessmentID
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

    frontend_data = {
        "action": event.get("action"),
        "userID": userID,
        "assessmentID": assessmentID,
        "status": attempt.status.value,
        "codeOutput": codeOutput,
        "executionTime": float(cur_question.bestExecTime),
        "executionMemory": float(cur_question.bestExecMem),
        "testCasesPassed": float(cur_question.testCasesPassed)
    }
    socket = event.get("socket")
    if socket:
        send_socket_message(
            socket.get("connectionId"),
            frontend_data,
            socket.get("domainName"),
            socket.get("stage")
        )

    return {"statusCode": 200, "body": f"Received"}


# {'action': 'executeCode', 'userID': 'u001', 'questionID': '4', 'assessmentID': 'u003', 'userSelectedLanguage': 'python', 'socket': {'connectionId': 'KQvHVdvaoAMCJQg=', 'domainName': 'sjseg5eath.execute-api.us-east-1.amazonaws.com', 'stage': 'dev'}, 'results': [{'test_case': '"Hello, world!"', 'expected_output': 'Hello, world!', 'result': 'Hello, world!', 'passed': True, 'exec_time': 0.02078448300017044, 'mem_kb': 51628}, {'test_case': '"OpenAI GPT"', 'expected_output': 'OpenAI GPT', 'result': 'OpenAI GPT', 'passed': True, 'exec_time': 0.019889235999926314, 'mem_kb': 0}]}

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
