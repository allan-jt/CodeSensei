import os
import json
import boto3

sqs = boto3.client("sqs")
queue_url = os.environ["QUEUE_URL"]


def handler(event, context):
    message_body = {
        "message": "Hello from the Producer Lambda!",
        "timestamp": context.timestamp if hasattr(context, "timestamp") else "N/A",
    }

    try:
        response = sqs.send_message(
            QueueUrl=queue_url, MessageBody=json.dumps(message_body)
        )
        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": "Message sent successfully!",
                    "messageId": response.get("MessageId"),
                }
            ),
        }
    except Exception as e:
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
