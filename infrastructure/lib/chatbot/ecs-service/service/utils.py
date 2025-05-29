import boto3
import json
import os

# Environment variables
sqs_url = os.environ["SQS_URL"]
bedrock_model = os.environ["BEDROCK_MODEL"]
question_db = os.environ["QUESTION_DB"]

# AWS clients
sqs = boto3.client("sqs")
dynamodb = boto3.client("dynamodb")
bedrock = boto3.client("bedrock-runtime")

def get_question_context(question_id: str) -> dict:
    try:
        response = dynamodb.get_item(
            TableName=question_db,
            Key={"questionId": {"S": question_id}},
        )

        item = response.get("Item", {})

        context = {
            "topics": [t["S"] for t in item["topics"]["L"]],
            "title": item["title"]["S"],
            "description": item["description"]["S"]
        }

        return context

    except KeyError as e:
        print(f"Missing field in item: {e}")
        return {}
    except Exception as e:
        print(f"Error fetching question context: {e}")
        return {}

def send_to_socket(socket: dict, message: dict):
    endpoint_url = f"https://{socket['domainName']}/{socket['stage']}"
    api = boto3.client(
        "apigatewaymanagementapi",
        endpoint_url=endpoint_url
    )
    try:
        api.post_to_connection(
            ConnectionId=socket["connectionId"],
            Data=json.dumps(message).encode('utf-8')
        )
    except Exception as e:
        print(f"Error sending to socket: {e}")

def call_bedrock(prompt: str, context: dict) -> str:
    system_prompt = f"""
        You are a helpful assistant designed to support users 
        working on coding problems. Your role is to provide 
        clarifications, explanations, and gentle hints that 
        guide the user toward solving the problem themselves.

        Do not write code, share direct solutions, or give step-
        by-step answers. If the user asks for a direct answer or 
        code, respond by helping them understand the concepts or 
        think critically about how to approach the problem.

        Keep your answers concise and under 100 words.

        Current Coding Problem:
        Title: {context["title"]}
        Description: {context["description"]}
        Topics: {', '.join(context["topics"])}
    """
    
    messages = [{"role": "user", "content": prompt}]
    
    try:
        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "messages": messages,
            "system": system_prompt,
            "max_tokens": 250,
            "temperature": 0.7,
            "top_p": 0.9,
        }

        response = bedrock.invoke_model(
            modelId=f"us.{bedrock_model}",
            body=json.dumps(payload),
            contentType="application/json",
            accept="application/json"
        )
        response_body = json.loads(response["body"].read())
        return response_body["content"][0]["text"]
    except Exception as e:
        print(f"Error from Bedrock: {e}")
        return "Error generating response."