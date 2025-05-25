import sys
import os
import boto3
from flask import Flask, request

app = Flask(__name__)

@app.route("/")
def test_route():
    return "Hello, World!"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)