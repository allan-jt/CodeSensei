import subprocess
import tempfile
import json
import sys
import os
import boto3
from flask import Flask, request
from execution import *

app = Flask(__name__)

lambda_name = os.environ["LAMBDA_FUNCTION_NAME"]
lambda_client = boto3.client("lambda")


@app.route("/")
def test_route():
    return "Hello, World!"


@app.route("/execute", methods=["POST"])
def execute_code():
    try:
        payload = json.loads(request.data.decode("utf-8"))
        code = payload.get("userCode", "")
        question_id = payload.get("questionID", "")
        print(f"Received: {code} and {question_id}")

        question = get_question_by_id(question_id)
        results = run_code_against_tests(code, question.testCases, question.testAnswers)

        lambda_client.invoke(
            FunctionName=lambda_name,
            InvocationType="RequestResponse",
            Payload=json.dumps({"results": results}).encode(),
        )
        return "Executed", 200
    except Exception as e:
        print(f"Error: {e}")
        return "Internal Server Error", 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)
