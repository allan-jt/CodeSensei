import json
import os
import requests

ECS_API_ENDPOINT = os.environ.get('ECS_API_ENDPOINT')  # 建议通过环境变量注入，如 https://your-api.example.com/process

def lambda_handler(event, context):
    try:
        for record in event['Records']:
            body = json.loads(record['body'])

            prompt = body.get("prompt")
            question_id = body.get("questionId")

            print(f"Sent request to ECS! Questiontext: {prompt}, QuestionID: {question_id}")
            # 发给 ECS 服务
            response = requests.post(
                ECS_API_ENDPOINT,
                json={"questionid":question_id,"questiontext":prompt},
                headers={"Content-Type": "application/json"},
                timeout = 100  # 超时保护
            )

            print(f"✅ Response from ECS: {response.status_code} - {response.text}")

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
