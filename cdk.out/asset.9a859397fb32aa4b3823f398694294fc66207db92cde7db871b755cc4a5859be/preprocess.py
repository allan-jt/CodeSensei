import os
import json
import logging
import urllib.request
import urllib.error

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",  # Or your specific origin
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        "Access-Control-Allow-Credentials": "true"
    }


def handler(event, context):
    # Log the incoming event
    logger.info("📩 Incoming event: %s", json.dumps(event))
    logger.info(f"📌 ECS Service URL from environment: {os.environ.get('SERVICE_URL', 'not set')}")

    # Get HTTP method from event
    http_method = event.get('httpMethod', 'GET')
    
    # Extract path parameters if available
    path_params = event.get('pathParameters', {})
    resource_path = event.get('resource', '')
    
    logger.info(f"📋 Request details - Method: {http_method}, Path: {resource_path}, Params: {json.dumps(path_params)}")
    
    # Handle different resource paths
    if resource_path == '/ping':
        return {
            "statusCode": 200,
            "headers": cors_headers(),
            "body": json.dumps({"status": "alive", "message": "Health check passed"})
        }
    
    # Get ECS service base URL from environment
    service_url = os.environ.get('SERVICE_URL', 'http://localhost:80')
    
    # Determine target URL based on the resource path
    if resource_path == '/assessments/{id}/start' and path_params and 'id' in path_params:
        assessment_id = path_params['id']
        target_url = f"{service_url.rstrip('/')}/assessments/{assessment_id}/start"
    elif resource_path == '/assessments/{id}' and path_params and 'id' in path_params:
        assessment_id = path_params['id']
        target_url = f"{service_url.rstrip('/')}/assessments/{assessment_id}"
    elif resource_path == '/assessments':
        target_url = f"{service_url.rstrip('/')}/assessments"
    else:
        # Default fallback
        target_url = f"{service_url.rstrip('/')}/webhook"
    
    # Extract request body from API Gateway payload for POST requests
    request_body = {}
    if http_method in ['POST', 'PUT'] and 'body' in event:
        logger.info(f"🔗 Attempting to forward request to URL: {target_url}")

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
    
    # Prepare and send request to ECS webserver
    try:
        req = urllib.request.Request(
            target_url,
            data=json.dumps(request_body).encode("utf-8") if request_body else None,
            headers={"Content-Type": "application/json"},
            method=http_method
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
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }