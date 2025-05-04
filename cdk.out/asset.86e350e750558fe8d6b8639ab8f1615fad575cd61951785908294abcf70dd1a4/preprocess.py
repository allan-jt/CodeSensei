import os
import json
import logging
import urllib.request
import urllib.error

logger = logging.getLogger()
logger.setLevel(logging.INFO)

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
    
    # Check if this is a preflight OPTIONS request
    if http_method == 'OPTIONS':
        return {
            "statusCode": 200,
            "headers": cors_headers(),
            "body": ""
        }
    
    # Get ECS service base URL from environment
    service_url = os.environ.get('SERVICE_URL', 'http://localhost:80')
    
    # Determine target URL based on the resource path and path parameters
    target_url = construct_target_url(service_url, resource_path, path_params, event.get('path', ''))
    
    logger.info(f"🔗 Attempting to forward request to URL: {target_url}")
    
    # Extract request body from API Gateway payload for POST requests
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

import urllib.parse  # Add this import at the top of your file

def construct_target_url(service_url, resource_path, path_params, original_path):
    base_url = service_url.rstrip('/')
    
    # Use the original path from the event if available, otherwise construct from resource and params
    if original_path:
        # Strip the stage name if present (e.g., "/prod/assessments" -> "/assessments")
        path_parts = original_path.split('/')
        if len(path_parts) > 1 and path_parts[1] == 'prod':
            path = '/' + '/'.join(path_parts[2:])
        else:
            path = original_path
        
        # URL-decode the path before forwarding to ECS
        decoded_path = urllib.parse.unquote(path)
        return f"{base_url}{decoded_path}"
    
    # For different resource paths
    if resource_path == '/ping':
        return f"{base_url}/ping"
    elif resource_path == '/assessments':
        return f"{base_url}/assessments"
    elif resource_path == '/assessments/{id}':
        # URL-decode the ID before forwarding to ECS
        assessment_id = urllib.parse.unquote(path_params.get('id', ''))
        return f"{base_url}/assessments/{assessment_id}"
    elif resource_path == '/assessments/{id}/start':
        # URL-decode the ID before forwarding to ECS
        assessment_id = urllib.parse.unquote(path_params.get('id', ''))
        return f"{base_url}/assessments/{assessment_id}/start"
    elif resource_path == '/assessments/{userId}/{timestamp}':
        user_id = urllib.parse.unquote(path_params.get('userId', ''))
        timestamp = urllib.parse.unquote(path_params.get('timestamp', ''))
        return f"{base_url}/assessments/{user_id}/{timestamp}"
    else:
        # Default fallback
        return f"{base_url}/webhook"