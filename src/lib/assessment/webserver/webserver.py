import os
import json
import logging
import boto3
from fastapi import FastAPI, HTTPException, Query
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

@app.get("/")
async def root():
    return {"status": "OK"}

@app.get("/health")
async def health(payload: str = Query(..., description="URL-encoded JSON payload")):
    # 1) Parse incoming JSON
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        logger.error("Invalid JSON payload: %s", payload)
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # 2) Create a Mistral-style prompt with JSON data as string
    json_str = json.dumps(data)
    instruction = (
        "You are a helpful AI. Process the following JSON data and provide a concise summary."
    )
    # Mistral requires the prompt in an instruction tag
    formatted_prompt = f"<s>[INST] {instruction}\n{json_str} [/INST]"

    # 3) Prepare Bedrock payload with Mistral parameters
    model_id = os.getenv('MODEL_ID', 'mistral.mistral-7b-instruct-v0:2')
    region   = os.getenv('AWS_REGION', 'us-east-1')
    bedrock_payload = {
        "prompt": formatted_prompt,
        "max_tokens": 512,
        "temperature": 0.7,
    }

    # 4) Invoke Bedrock model
    try:
        client = boto3.client('bedrock-runtime', region_name=region)
        resp = client.invoke_model(
            modelId=model_id,
            contentType='application/json',
            accept='application/json',
            body=json.dumps(bedrock_payload).encode('utf-8')
        )
        raw_body = resp['body'].read().decode('utf-8')
        logger.info("Bedrock raw response: %s", raw_body)
        # Parse out the Mistral-specific output structure
        parsed = json.loads(raw_body)
        # For Mistral text completion, results are in 'outputs'[0]['text']
        llm_out = parsed.get('outputs', [{}])[0].get('text', raw_body)
    except Exception as e:
        logger.error("Bedrock call failed", exc_info=True)
        llm_out = f"Bedrock error: {e}"

    # 5) Return both the original request and the LLM’s response
    return {
        "request": data,
        "formatted_prompt": formatted_prompt,
        "bedrock": llm_out
    }

if __name__ == '__main__':
    port = int(os.getenv('PORT', '80'))
    logger.info("Starting FastAPI server on port %d", port)
    uvicorn.run(app, host='0.0.0.0', port=port)

