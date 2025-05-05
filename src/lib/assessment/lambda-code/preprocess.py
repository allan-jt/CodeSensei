# assesments/lambda-code/preprocess.py

import os
import json
import logging
import urllib.request
import urllib.error
import urllib.parse

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    1) Read SERVICE_URL from the environment
    2) URL-encode the incoming event JSON as a 'payload' query param
    3) Perform a GET to SERVICE_URL/health?payload=...
    4) Return the ECS service’s JSON response unmodified
    """
    logger.info("Received event: %s", json.dumps(event))

    # Build the target URL with a 'payload' param
    service_url = os.environ['SERVICE_URL'].rstrip('/')
    payload_str = json.dumps(event)
    query       = urllib.parse.urlencode({'payload': payload_str})
    health_url  = f"{service_url}/health?{query}"
    logger.info("Calling ECS GET %s", health_url)

    try:
        with urllib.request.urlopen(health_url, timeout=10) as resp:
            body   = resp.read().decode('utf-8')
            status = resp.getcode()
            logger.info("ECS responded %d: %s", status, body)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='ignore')
        logger.error("ECS returned HTTP %d: %s", e.code, err_body)
        return {
            "statusCode": e.code,
            "body": json.dumps({"error": err_body})
        }
    except urllib.error.URLError as e:
        logger.error("Request to ECS failed: %s", e)
        return {
            "statusCode": 502,
            "body": json.dumps({"error": str(e)})
        }

    # Return the raw JSON from the webserver
    return {
        "statusCode": status,
        "body": body
    }