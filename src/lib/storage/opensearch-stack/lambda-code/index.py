import boto3
import os
import json
import requests
import hashlib
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from botocore.session import get_session


def sign_request(method, url, body, region, service="aoss"):
    session = get_session()
    credentials = session.get_credentials().get_frozen_credentials()
    hashed_body = hashlib.sha256(body.encode("utf-8")).hexdigest()
    request = AWSRequest(
        method=method,
        url=url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "X-Amz-Content-Sha256": hashed_body,
            "Host": url.replace("https://", "").split("/")[0],
        },
    )
    SigV4Auth(credentials, service, region).add_auth(request)
    return request


def create_index_if_not_exists(endpoint, region):
    index_url = f"{endpoint}/questions"
    check_response = requests.get(index_url)
    if check_response.status_code == 200:
        print("Index already exists.")
        return

    print("Creating index...")
    mappings = {
        "mappings": {
            "properties": {
                "questionId": {"type": "keyword"},
                "difficulty": {"type": "keyword"},
                "topics": {"type": "keyword"},
            }
        }
    }
    body = json.dumps(mappings)
    signed = sign_request("PUT", index_url, body, region)
    response = requests.put(
        url=signed.url, data=signed.body, headers=dict(signed.headers)
    )
    response.raise_for_status()
    print("Index created.")


def seed_opensearch(endpoint, region):
    create_index_if_not_exists(endpoint, region)

    dynamodb = boto3.resource("dynamodb")
    table_name = os.environ["DYNAMO_TABLE_NAME"]
    table = dynamodb.Table(table_name)

    all_records = []
    scan_kwargs = {}
    while True:
        response = table.scan(**scan_kwargs)
        all_records.extend(response["Items"])
        if "LastEvaluatedKey" not in response:
            break
        scan_kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]

    bulk_body = ""
    for record in all_records:
        question_id = record.get("questionId")
        difficulty = record.get("difficulty")
        topics = record.get("topics", [])
        if not question_id or not difficulty:
            continue

        metadata = {"index": {"_index": "questions", "_id": question_id}}
        doc = {
            "questionId": question_id,
            "difficulty": difficulty,
            "topics": topics,
        }
        bulk_body += json.dumps(metadata) + "\n" + json.dumps(doc) + "\n"

    if not bulk_body:
        print("No valid records to index.")
        return

    bulk_url = f"{endpoint}/_bulk"
    signed = sign_request("POST", bulk_url, bulk_body, region)
    response = requests.post(
        url=signed.url, data=signed.body, headers=dict(signed.headers)
    )
    response.raise_for_status()
    print("Bulk insert completed.")


def query_opensearch(endpoint, region, topic=None, difficulty=None):
    must_clauses = []

    if topic:
        must_clauses.append({"term": {"topics": topic}})
    if difficulty:
        must_clauses.append({"term": {"difficulty": difficulty}})

    if must_clauses:
        query = {"query": {"bool": {"must": must_clauses}}}
    else:
        query = {"query": {"match_all": {}}}

    body = json.dumps(query)
    search_url = f"{endpoint}/questions/_search"
    signed = sign_request("POST", search_url, body, region)

    response = requests.post(
        url=signed.url, data=signed.body, headers=dict(signed.headers)
    )
    response.raise_for_status()

    data = response.json()
    hits = data.get("hits", {}).get("hits", [])
    return [hit["_source"]["questionId"] for hit in hits]


def handler(event, context):
    endpoint = os.environ["OPENSEARCH_ENDPOINT"]
    region = os.environ["AWSREGION"]

    if event.get("action") == "seed":
        seed_opensearch(endpoint, region)
        return {"statusCode": 200, "body": json.dumps("Seeding complete.")}
    elif event.get("action") == "query":
        topic = event.get("topic")
        difficulty = event.get("difficulty")
        try:
            question_ids = query_opensearch(endpoint, region, topic, difficulty)
            return {"statusCode": 200, "body": json.dumps(question_ids)}
        except Exception as e:
            return {"statusCode": 500, "body": json.dumps({"error": str(e)})}

    return {
        "statusCode": 400,
        "body": json.dumps("Invalid action. Must be 'seed' or 'query'."),
    }
