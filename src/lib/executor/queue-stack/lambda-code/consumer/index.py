import json
import os
import urllib.request


def handler(event, context):
    url = f"http://{os.environ['SERVICE_URL']}/execute"
    headers = {"Content-Type": "application/json"}

    for record in event["Records"]:
        try:
            body = json.loads(record["body"])
            request = urllib.request.Request(
                url, data=json.dumps(body).encode("utf-8"), headers=headers
            )
            with urllib.request.urlopen(request) as response:
                response_body = response.read().decode("utf-8")
                print(f"Response from service: {response_body}")

            print(f"Received message: {body}")
        except Exception as e:
            print(f"Error processing message: {str(e)}")

    return {"statusCode": 200, "body": json.dumps("Messages processed successfully.")}
