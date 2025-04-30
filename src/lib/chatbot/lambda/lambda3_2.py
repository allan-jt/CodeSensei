import json
import boto3
import os
import requests

sqs = boto3.client('sqs')

QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/050451376687/PromptQueue.fifo'
ECS_API_ENDPOINT = os.environ.get('ECS_API_ENDPOINT')  # 建议通过环境变量注入，如 https://your-api.example.com/process

def lambda_handler(event, context):
    try:
        # 拉取消息
        response = sqs.receive_message(
            QueueUrl=QUEUE_URL,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=5,
            VisibilityTimeout=30
        )

        messages = response.get('Messages', [])
        if not messages:
            return {
                "statusCode": 200,
                "body": json.dumps({"message": "No messages available."})
            }

        for msg in messages:
            receipt_handle = msg['ReceiptHandle']
            body = json.loads(msg['Body'])

            prompt = body.get("prompt")
            question_id = body.get("questionId")

            # ✅ 发请求到 ECR/ECS 部署的服务
            payload = {
                "prompt": prompt,
                "questionId": question_id
            }

            ecs_response = requests.post(
                ECS_API_ENDPOINT,
                json=payload,
                headers={"Content-Type": "application/json"}
            )

            print(f"✅ Sent to ECS: {ecs_response.status_code}, {ecs_response.text}")

            # 删除 SQS 消息
            sqs.delete_message(
                QueueUrl=QUEUE_URL,
                ReceiptHandle=receipt_handle
            )

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Message forwarded to ECS and deleted from SQS"})
        }

    except Exception as e:
        print("❌ Error:", str(e))
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
