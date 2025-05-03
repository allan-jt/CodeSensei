import json
import os
import urllib.request


def get_url(language):
    try:
        service_url = os.environ.get(f"{language.upper()}_SERVICE_URL")
        return f"http://{service_url}/execute"
    except KeyError:
        raise ValueError(
            f"Service URL for {language} not found in environment variables."
        )


def handler(event, context):
    headers = {"Content-Type": "application/json"}

    for record in event["Records"]:
        try:
            body = json.loads(record["body"])
            print(f"Received message: {body}")
            url = get_url(body["userSelectedLanguage"])

            request = urllib.request.Request(
                url, method="POST", data=json.dumps(body).encode("utf-8"), headers=headers
            )
            with urllib.request.urlopen(request) as response:
                response_body = response.read().decode("utf-8")
                print(f"Response from service: {response_body}")
        except Exception as e:
            print(f"Error processing message: {str(e)}")

    return "200 OK"
