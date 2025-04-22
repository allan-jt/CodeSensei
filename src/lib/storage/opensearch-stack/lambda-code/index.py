import boto3
import os
import sys
import json
import urllib.parse

sys.path.append(os.path.join(os.path.dirname(__file__), "opensearch-py"))
from opensearchpy import OpenSearch, RequestsHttpConnection, AWSV4SignerAuth


def getOpenSearchClient(host, region, collection):
    service = "aoss"
    credentials = boto3.Session().get_credentials()
    auth = AWSV4SignerAuth(credentials, region, service)
    client = OpenSearch(
        hosts=[{"host": host, "port": 443}],
        http_auth=auth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
    )

    if not client.indices.exists(index=collection):
        client.indices.create(
            index=collection,
            body={
                "mappings": {
                    "properties": {
                        "questionId": {"type": "keyword"},
                        "difficulty": {"type": "keyword"},
                        "topics": {"type": "keyword"},
                    }
                }
            },
        )

    return client


def seed_opensearch(os_client, dynamo_table, collection):
    dynamo = boto3.resource("dynamodb").Table(dynamo_table)
    if not dynamo:
        raise ValueError(f"DynamoDB table {dynamo_table} not found.")

    response = dynamo.scan()
    items = response.get("Items", [])

    for item in items:
        doc = {
            "questionId": item.get("questionId"),
            "difficulty": item.get("difficulty"),
            "topics": item.get("topics", []),
        }

        os_client.index(index=collection, id=doc["questionId"], body=doc)

    print("Seeding complete.")


def handler(event, context):
    host = os.environ["OPENSEARCH_ENDPOINT"].replace("https://", "")
    region = os.environ["AWSREGION"]
    collection = os.environ["OPENSEARCH_COLLECTION"]
    table_name = os.environ["DYNAMO_TABLE_NAME"]

    opensearch = getOpenSearchClient(host, region, collection)

    if event.get("action") == "seed":
        seed_opensearch(opensearch, table_name, collection)
        return {"statusCode": 200, "body": json.dumps("Seeding complete.")}

    topic = event.get("topic")
    difficulty = event.get("difficulty")

    must_clauses = []
    if topic:
        must_clauses.append({"term": {"topics": topic}})
    if difficulty:
        must_clauses.append({"term": {"difficulty": difficulty}})

    if must_clauses:
        query = {"query": {"bool": {"must": must_clauses}}}
    else:
        query = {"query": {"match_all": {}}}

    response = opensearch.search(index=collection, body=query)
    hits = response.get("hits", {}).get("hits", [])
    question_ids = [hit["_source"]["questionId"] for hit in hits]
    return {
        "statusCode": 200,
        "body": json.dumps({"questionIds": question_ids}),
        "headers": {"Content-Type": "application/json"},
    }
