# assesments/lambda-code/preprocess.py
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
    2) Call SERVICE_URL/health
    3) Return the health endpoint’s response
    """
    logger.info("Received event: %s", json.dumps(event))

    # Build the URL
    service_url = os.environ['SERVICE_URL']            # e.g. ECS Loadbalancer URL
    health_url  = f"{service_url.rstrip('/')}/health"  # ensure no double-slash
    logger.info("Calling ECS service health endpoint: %s", health_url)

    try:
        with urllib.request.urlopen(health_url, timeout=10) as resp:
            body   = resp.read().decode('utf-8')
            status = resp.getcode()
            logger.info("Health check returned %d: %s", status, body)
    except urllib.error.URLError as e:
        logger.error("Health check request failed: %s", e)
        return {
            "statusCode": 502,
            "body": json.dumps({"error": str(e)})
        }

    return {
        "statusCode": status,
        "body": json.dumps({"health": body})
    }