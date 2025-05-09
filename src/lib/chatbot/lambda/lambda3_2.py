import json
import os
# import requests
import boto3
import urllib.request

ECS_API_ENDPOINT = os.environ.get('ECS_API_ENDPOINT')  # 建议通过环境变量注入，如 https://your-api.example.com/process

def send_socket_message(connection_id, data, domain_name, stage):
    print(f"Frontend data: {data}")
    endpoint = f"https://{domain_name}/{stage}"
    client = boto3.client('apigatewaymanagementapi', endpoint_url=endpoint)

    try:
        client.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps(data).encode('utf-8')
        )
    except client.exceptions.GoneException:
        print(f"Connection {connection_id} is gone.")

def lambda_handler(event, context):
    try:
        for record in event['Records']:
            body = json.loads(record['body'])

            prompt = body.get("prompt")
            question_id = body.get("questionId")

            print(f"Sent request to ECS! Questiontext: {prompt}, QuestionID: {question_id}")
            # 发给 ECS 服务
            # response = requests.post(
            #     ECS_API_ENDPOINT,
            #     json={"questionid":question_id,"questiontext":prompt},
            #     headers={"Content-Type": "application/json"},
            #     timeout = 100  # 超时保护
            # )

            data = {
                "questionid": question_id,
                "questiontext": prompt
            }
            json_data = json.dumps(data).encode("utf-8")
            req = urllib.request.Request(
                url=ECS_API_ENDPOINT,
                data=json_data,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=100) as response:
                response_body = response.read().decode("utf-8")
                status_code = response.getcode()


            print(f"✅ Response from ECS: {status_code} - {response_body}")
            frontend_data = {
                "action": "chatbot",
                "message": response_body
            }
            socket = body.get("socket")
            if socket:
                send_socket_message(
                    socket.get("connectionId"),
                    frontend_data,
                    socket.get("domainName"),
                    socket.get("stage")
                )

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Message forwarded to ECS and deleted from SQS"})
        }

    except Exception as e:
        print("❌ Error:", str(e))
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
