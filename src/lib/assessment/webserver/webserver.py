import os
import json
import logging
import boto3
from http.server import BaseHTTPRequestHandler, HTTPServer

logger = logging.getLogger()
logger.setLevel(logging.INFO)

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path in ('/', '/health'):
            # 1) Base “hello world”
            health_msg = "hello world"
            logger.info("Responding to /health with base message: %s", health_msg)

            # 2) Call Bedrock
            model_id   = os.environ.get('MODEL_ID', 'mistral.mistral-7b-instruct-v0:2')
            region     = os.environ.get('AWS_REGION', 'us-east-1')
            payload    = {"inputText": "Health check"}  # simple prompt
            try:
                client = boto3.client('bedrock-runtime', region_name=region)
                resp = client.invoke_model(
                    modelId=model_id,
                    contentType='application/json',
                    accept='application/json',
                    body=json.dumps(payload).encode('utf-8')
                )
                # read and decode the streaming body
                llm_out = resp['body'].read().decode('utf-8')
                logger.info("Bedrock responded: %s", llm_out)
            except Exception as e:
                logger.error("Bedrock call failed: %s", e, exc_info=True)
                llm_out = f"Bedrock error: {e}"

            # 3) Build a combined JSON response
            response = {
                "health": health_msg,
                "bedrock": llm_out
            }

            # 4) Send back
            body = json.dumps(response)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(body.encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '80'))
    logger.info("Starting server on port %d…", port)
    HTTPServer(('0.0.0.0', port), HealthHandler).serve_forever()