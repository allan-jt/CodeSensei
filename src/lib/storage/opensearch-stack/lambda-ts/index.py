import boto3
import os
import json
import requests
import hashlib
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from botocore.session import get_session


def handler(event, context):
    endpoint = os.environ[
        "OPENSEARCH_ENDPOINT"
    ]  # e.g. https://abc123.us-east-1.aoss.amazonaws.com
    region = os.environ["AWSREGION"]

    # Create the 'questions' index if it doesn't exist
    create_index_url = f"{endpoint}/questions"
    create_index_body = json.dumps(
        {
            "mappings": {
                "properties": {
                    "questionId": {"type": "keyword"},
                    "questionText": {"type": "text"},
                    "difficulty": {"type": "integer"},
                }
            }
        }
    )
    hashed_create_body = hashlib.sha256(create_index_body.encode("utf-8")).hexdigest()

    # Prepare request to create the index
    session = get_session()
    credentials = session.get_credentials().get_frozen_credentials()
    create_request = AWSRequest(
        method="PUT",
        url=create_index_url,
        data=create_index_body,
        headers={
            "Content-Type": "application/json",
            "X-Amz-Content-Sha256": hashed_create_body,
            "Host": endpoint.replace("https://", ""),
        },
    )

    # Sign the create index request
    SigV4Auth(credentials, "aoss", region).add_auth(create_request)

    # Debug log for creating index
    print(f"Signed create index request headers: {create_request.headers}")

    # Send the create index request
    try:
        create_response = requests.put(
            url=create_request.url,
            data=create_request.body,
            headers=dict(create_request.headers),
        )
        create_response.raise_for_status()
        print("Index created successfully.")
    except Exception as e:
        print(f"Error creating index: {e}")
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}

    # Construct the query (perform a search on 'questions')
    query = {"query": {"match_all": {}}}
    body = json.dumps(query)

    # Compute SHA256 hash of the body (required by OpenSearch Serverless)
    hashed_body = hashlib.sha256(body.encode("utf-8")).hexdigest()

    # Create the signed query request
    search_url = f"{endpoint}/questions/_search"
    search_request = AWSRequest(
        method="POST",
        url=search_url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "X-Amz-Content-Sha256": hashed_body,
            "Host": endpoint.replace("https://", ""),
        },
    )

    # Sign the search request
    SigV4Auth(credentials, "aoss", region).add_auth(search_request)

    # Debug log headers for search request
    print(f"Signed search request headers: {search_request.headers}")

    # Send search request
    try:
        response = requests.post(
            url=search_request.url,
            data=search_request.body,
            headers=dict(search_request.headers),
        )
        response.raise_for_status()
        data = response.json()
        hits = data.get("hits", {}).get("hits", [])
        question_ids = [hit["_source"]["questionId"] for hit in hits]
        return {"statusCode": 200, "body": json.dumps(question_ids)}
    except Exception as e:
        print(f"Error querying OpenSearch: {e}")
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}


# import boto3
# import os
# import json
# import requests
# import hashlib
# from botocore.auth import SigV4Auth
# from botocore.awsrequest import AWSRequest
# from botocore.session import get_session

# def handler(event, context):
#     endpoint = os.environ["OPENSEARCH_ENDPOINT"]  # e.g. https://abc123.us-east-1.aoss.amazonaws.com
#     region = os.environ["AWSREGION"]

#     # Construct the query
#     query = {
#         "query": {
#             "match_all": {}
#         }
#     }
#     body = json.dumps(query)

#     # Compute SHA256 hash of the body (required by OpenSearch Serverless)
#     hashed_body = hashlib.sha256(body.encode('utf-8')).hexdigest()

#     # Create the signed request
#     session = get_session()
#     credentials = session.get_credentials().get_frozen_credentials()
#     request = AWSRequest(
#         method="POST",
#         url=f"{endpoint}/questions/_search",
#         data=body,
#         headers={
#             "Content-Type": "application/json",
#             "X-Amz-Content-Sha256": hashed_body,
#             "Host": endpoint.replace("https://", "")
#         }
#     )

#     # Sign the request
#     SigV4Auth(credentials, "aoss", region).add_auth(request)

#     # Debug log headers
#     print(f"Signed request headers: {request.headers}")

#     # Send request
#     try:
#         response = requests.post(
#             url=request.url,
#             data=request.body,
#             headers=dict(request.headers)
#         )
#         response.raise_for_status()
#         data = response.json()
#         hits = data.get("hits", {}).get("hits", [])
#         question_ids = [hit["_source"]["questionId"] for hit in hits]
#         return {"statusCode": 200, "body": json.dumps(question_ids)}
#     except Exception as e:
#         print(f"Error querying OpenSearch: {e}")
#         return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
