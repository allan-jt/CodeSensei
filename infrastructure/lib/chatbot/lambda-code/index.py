import os
import json
import boto3
import urllib.request

def get_ecs_url():
    try:
        return f"http://{os.environ.get('ECS_URL')}"
    except KeyError:
        raise ValueError(
            f"Service URL for {language} not found in environment variables."
        )

def handler(event, context):
    try:
        url = get_ecs_url()
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            return response.read().decode("utf-8")
    except Exception as e:
        return {"error": str(e)}