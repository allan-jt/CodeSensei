import os
import json
import boto3

REQUIRED_FIELDS = [
    "questionId",
    "prompt",
    "action"
]

def valid_body(body):
    return all(isinstance(body.get(field), str) for field in REQUIRED_FIELDS)

def get_ecs_url():
    try:
        return f"http://{os.environ.get('ECS_URL')/chat}"
    except KeyError:
        raise ValueError(
            f"Service URL for {language} not found in environment variables."
        )

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
    
    body["socket"] = {
        "connectionId": event.get("requestContext", {}).get("connectionId", ""),
        "domainName": event.get("requestContext", {}).get("domainName", ""),
        "stage": event.get("requestContext", {}).get("stage", ""),
    }

    try:
        sqs = boto3.client("sqs")
        queue_url = os.environ["SQS_URL"]
        sqs.send_message(QueueUrl=queue_url, MessageBody=json.dumps(body))
    except Exception as e:
        print(f"Error sending message to SQS: {e}")
        return {"error": str(e)}
    
    return "200 OK"