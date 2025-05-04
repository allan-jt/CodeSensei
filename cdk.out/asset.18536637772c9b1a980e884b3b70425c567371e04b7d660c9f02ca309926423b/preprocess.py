import os
import json
import logging
import urllib.request
import urllib.error

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info("📩 Incoming event: %s", json.dumps(event))

    # Get ECS service base URL from environment
    service_url = os.environ['SERVICE_URL']
    target_url = f"{service_url.rstrip('/')}/webhook"  # or just '/', based on your webserver

    # Extract request body from API Gateway payload
    try:
        request_body = json.loads(event.get("body", "{}"))
        logger.info("📝 Forwarding payload to ECS service: %s", json.dumps(request_body))
    except json.JSONDecodeError as e:
        logger.error("❌ Failed to parse JSON body: %s", str(e))
        return {
            "statusCode": 400,
            "headers": cors_headers(),
            "body": json.dumps({"error": "Invalid JSON body"})
        }

    # Prepare and send POST to ECS webserver
    try:
        req = urllib.request.Request(
            target_url,
            data=json.dumps(request_body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            ecs_response_body = resp.read().decode("utf-8")
            status = resp.getcode()
            logger.info("✅ ECS service responded with %d: %s", status, ecs_response_body)
    except urllib.error.URLError as e:
        logger.error("🚫 Failed to reach ECS service: %s", str(e))
        return {
            "statusCode": 502,
            "headers": cors_headers(),
            "body": json.dumps({"error": "Failed to reach ECS service", "details": str(e)})
        }

    return {
        "statusCode": status,
        "headers": cors_headers(),
        "body": ecs_response_body
    }


def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    }