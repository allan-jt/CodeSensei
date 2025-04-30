import subprocess
import tempfile
import json
import sys
import os
import boto3
from flask import Flask, request

app = Flask(__name__)

lambda_name = os.environ["LAMBDA_FUNCTION_NAME"]
lambda_client = boto3.client("lambda")


@app.route("/")
def test_route():
    return "Hello, World!"


@app.route("/execute", methods=["POST"])
def execute_code():
    code = request.data.decode("utf-8")
    print(f"Received: {code}")

    lambda_client.invoke(
        FunctionName=lambda_name,
        InvocationType="RequestResponse",
        Payload=json.dumps({"code": code}).encode(),
    )
    return code, 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)
