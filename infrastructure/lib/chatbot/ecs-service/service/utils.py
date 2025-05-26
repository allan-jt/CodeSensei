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
    except ClientError as e:
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
    except ClientError as e:
        print(f"Error sending to socket: {e}")

def call_bedrock(prompt: str, context: dict) -> str:
    final_prompt = f"""
        You are a helpful assistant designed to support users 
        working on coding problems. Your role is to provide 
        clarifications, explanations, and gentle hints that 
        guide the user toward solving the problem themselves.

        Do not write code, share direct solutions, or give step-
        by-step answers. If the user asks for a direct answer or 
        code, respond by helping them understand the concepts or 
        think critically about how to approach the problem.

        Current Coding Problem:
        Title: {context["title"]}
        Description: {context["description"]}
        Topics: {context["topics"]}


        User question: {prompt}

        Return only the answer to the user's quesiton.
        """
    
    try:
        payload = {
            "prompt": final_prompt,
            "max_tokens_to_sample": 50,
            "temperature": 0.7,
            "top_p": 0.9,
        }

        response = bedrock.invoke_model(
            modelId=bedrock_model,
            body=json.dumps(payload),
            contentType="application/json",
            accept="application/json"
        )
        response_body = json.loads(response["body"].read().decode("utf-8"))
        return response_body.get("completion", "").strip()
    except Exception as e:
        print(f"Error from Bedrock: {e}")
        return "Error generating response."