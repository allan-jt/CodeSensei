import json
import boto3
import os

# 初始化 DynamoDB 客户端
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DDB_TABLE'])  # 设置为你的 DynamoDB 表名

def lambda_handler(event, context):
    try:
        print("Event received:", json.dumps(event))

        question_id = event.get("questionId")
        response = event.get("response")

        if not question_id or not response:
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "Missing questionId or response"})
            }

        # 写入 DynamoDB
        table.put_item(Item={
            "questionId": question_id,
            "response": response,
            "timestamp": context.aws_request_id  # 可选：作为唯一标识或追踪
        })

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Response stored in DynamoDB."})
        }

    except Exception as e:
        print("Error writing to DynamoDB:", str(e))
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Internal server error"})
        }
