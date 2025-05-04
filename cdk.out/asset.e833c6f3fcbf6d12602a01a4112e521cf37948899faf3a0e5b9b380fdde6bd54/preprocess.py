import os
import json
import logging
import urllib.request
import urllib.error
import urllib.parse

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    # Log the incoming event
    logger.info("📩 Incoming event: %s", json.dumps(event))
    
    # Get HTTP method from event
    http_method = event.get('httpMethod', 'GET')
    
    # Extract resource path
    resource_path = event.get('resource', '')
    
    logger.info(f"📋 Request details - Method: {http_method}, Path: {resource_path}")
    
    # Check if this is a preflight OPTIONS request
    if http_method == 'OPTIONS':
        return {
            "statusCode": 200,
            "headers": cors_headers(),
            "body": ""
        }
    
    # Get ECS service base URL from environment
    service_url = os.environ.get('SERVICE_URL', 'http://localhost:80')
    
    # Determine target URL based on the resource path
    if resource_path == '/ping':
        target_url = f"{service_url.rstrip('/')}/ping"
    elif resource_path == '/assessments/action':
        target_url = f"{service_url.rstrip('/')}/assessments/action"
    else:
        target_url = f"{service_url.rstrip('/')}/webhook"
    
    logger.info(f"🔗 Attempting to forward request to URL: {target_url}")
    
    # Extract request body from API Gateway payload
    request_body = {}
    if http_method in ['POST', 'PUT'] and 'body' in event:
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
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token"
    }