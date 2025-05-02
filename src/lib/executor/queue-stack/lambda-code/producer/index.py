import os
import json
import boto3

REQUIRED_FIELDS = [
    "userID",
    "questionID",
    "assessmentID",
    "userCode",
    "userSelectedLanguage",
]


def valid_body(body):
    return all(isinstance(body.get(field), str) for field in REQUIRED_FIELDS)


def handler(event, context):
    print("Received event:", json.dumps(event))

    try:
        raw_body = event.get("body", "{}")
        body = raw_body if isinstance(raw_body, dict) else json.loads(raw_body)
    except json.JSONDecodeError:
        print("Invalid JSON body")
        return "400 Bad Request"

    if not valid_body(body):
        print(f"Invalid body: {body}")
        return "400 Bad Request"

    try:
        sqs = boto3.client("sqs")
        queue_url = os.environ["QUEUE_URL"]
        sqs.send_message(QueueUrl=queue_url, MessageBody=json.dumps(body))
    except Exception as e:
        print(f"Error sending message to SQS: {e}")
        return "500 Internal Server Error"

    print("Message sent to SQS successfully")
    return "200 OK"


# Overview
# This service handles assessing whether the user submitted code correctly answer the question.

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
