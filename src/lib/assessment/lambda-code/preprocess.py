import os
import json
import logging
import urllib.request
import urllib.error

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    1) Read SERVICE_URL from the environment
    2) Issue a POST to SERVICE_URL/assessments/action with the incoming event as JSON
    3) Return the ECS service’s JSON response (statusCode, headers, body)
    """
    logger.info("Received event: %s", json.dumps(event))

    service_url = os.environ['SERVICE_URL'].rstrip('/')
    url = f"{service_url}/assessments/action"

    # Prepare JSON payload
    payload_bytes = json.dumps(event).encode('utf-8')
    headers = {
        'Content-Type': 'application/json',
        'Content-Length': str(len(payload_bytes))
    }

    # Build a POST request
    req = urllib.request.Request(
        url=url,
        data=payload_bytes,
        headers=headers,
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body   = resp.read().decode('utf-8')
            status = resp.getcode()
            logger.info("ECS responded %d: %s", status, body)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='ignore')
        logger.error("ECS returned HTTP %d: %s", e.code, err_body)
        return {
            "statusCode": e.code,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": err_body})
        }
    except urllib.error.URLError as e:
        logger.error("Request to ECS failed: %s", e)
        return {
            "statusCode": 502,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)})
        }

    # Return the raw JSON from the webserver 
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": body
    }
