import json
import boto3
import os
import uuid

sqs = boto3.client('sqs')
QUEUE_URL = os.environ.get('QUEUE_URL', 'https://sqs.us-east-1.amazonaws.com/050451376687/PromptQueue.fifo')

def lambda_handler(event, context):
    try:
        print("Received event:", json.dumps(event))

        try:
            raw_body = event.get("body", "{}")
            body = raw_body if isinstance(raw_body, dict) else json.loads(raw_body)
        except json.JSONDecodeError:
            print("Invalid JSON body")
            return "400 Bad Request"

        # body = json.loads(event.get("body", "{}"))
        prompt = body.get("prompt")
        question_id = body.get("questionId")

        if not prompt or not question_id:
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "Missing prompt or questionId"})
            }

        message = {
            "prompt": prompt,
            "questionId": question_id,
            "socket": {
                "connectionId": event.get("requestContext").get("connectionId"),
                "domainName": event.get("requestContext").get("domainName"),
                "stage": event.get("requestContext").get("stage"),
            }
        }

        # ✅ 添加 MessageDeduplicationId 以支持 FIFO 队列
        sqs.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=json.dumps(message),
            MessageGroupId="default",
            MessageDeduplicationId=str(uuid.uuid4())  # 👈 添加唯一去重 ID
        )

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "OPTIONS,POST"
            },
            "body": json.dumps({"message": "Prompt sent to SQS"})
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Internal server error"})
        }
