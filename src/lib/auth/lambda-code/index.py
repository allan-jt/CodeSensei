import boto3
import os
from datetime import datetime

dynamodb = boto3.client('dynamodb')
table_name = os.environ["DYNAMO_TABLE_NAME"]

def handler(event, context):
    print("Received event:", event)

    user_attributes = event.get("request", {}).get("userAttributes", {})
    email = user_attributes.get("email")

    try:
        dynamodb.put_item(
            TableName=table_name,
            Item={
                'userId': {'S': email},
                'createdAt': {'S': datetime.utcnow().isoformat()}
            }
        )
        print(f"Inserted user {email} into table {table_name}")
    except Exception as e:
        print("Error inserting into DynamoDB:", e)

    return event