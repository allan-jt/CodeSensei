import os
import json
import boto3

sqs_client = boto3.client("sqs")

def send_message(payload):
    SQS_QUEUE_URL = os.environ.get("SQS_QUEUE_URL")

    response = sqs_client.send_message(
        QueueUrl=SQS_QUEUE_URL,
        MessageBody=json.dumps(payload)
    )

    return { "messageId": response.get("MessageId") }

if __name__ == "__main__":
    payload = {
        "user_id": "u001",
        "timestamp": "2025-05-01T00:00:00Z",
        "scopes": ["array#all", "all#easy", "all#all"],
        "time_spent": 300,
        "execution_time": 1.5,
        "execution_memory": 128
    }
    send_message(payload)