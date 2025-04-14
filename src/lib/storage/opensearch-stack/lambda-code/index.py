import json
import os
import requests
from requests_aws4auth import AWS4Auth
import boto3


def handler(event, context):
    # Get OpenSearch endpoint and region from environment variables
    endpoint = os.environ["OPENSEARCH_ENDPOINT"]
    collectionName = os.environ["OPENSEARCH_COLLECTION"]
    region = os.environ["AWSREGION"]

    # Construct the OpenSearch URL for querying
    url = f"{endpoint}/{collectionName}/_search"

    # Parse query parameters from the event (e.g., difficulty or topic)
    difficulty = event.get("difficulty", None)
    topic = event.get("topic", None)

    # Build the query based on difficulty and/or topic
    query = {"query": {"bool": {"must": []}}}

    if difficulty:
        query["query"]["bool"]["must"].append({"term": {"difficulty": difficulty}})

    if topic:
        query["query"]["bool"]["must"].append({"term": {"topic": topic}})

    # Get AWS credentials for signing the request
    session = boto3.Session()
    credentials = session.get_credentials()
    awsauth = AWS4Auth(
        credentials.access_key,
        credentials.secret_key,
        region,
        "aoss",
        session_token=credentials.token,
    )

    headers = {"Content-Type": "application/json"}

    # Make a request to OpenSearch
    response = requests.post(url, json=query, headers=headers, auth=awsauth)

    if response.status_code == 200:
        # If the query is successful, return the question IDs
        hits = response.json().get("hits", {}).get("hits", [])
        question_ids = [hit["_source"]["questionId"] for hit in hits]
        return {"statusCode": 200, "body": json.dumps(question_ids)}
    else:
        # If there's an error, return the error message
        return {
            "statusCode": response.status_code,
            "body": json.dumps({"error": response.text}),
        }
