import json


def handler(event, context):
    for record in event["Records"]:
        try:
            body = json.loads(record["body"])
            print(f"Received message: {body}")
        except Exception as e:
            print(f"Error processing message: {str(e)}")

    return {"statusCode": 200, "body": json.dumps("Messages processed successfully.")}
