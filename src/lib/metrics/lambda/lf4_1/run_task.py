import os
import json
import boto3

ecs_client = boto3.client("ecs")

def run_task(payload):
    cluster_name = os.environ.get("CLUSTER_NAME")
    task_definition_arn = os.environ.get("TASK_DEFINITION_ARN")
    container_name = os.environ.get("CONTAINER_NAME")
    security_group_id = os.environ.get("SECURITY_GROUP_ID")
    subnet_ids = os.environ.get("SUBNET_IDS").split(",")

    ecs_client.run_task(
        cluster=cluster_name,
        taskDefinition=task_definition_arn,
        launchType="FARGATE",
        overrides={
            "containerOverrides": [
                {
                    "name": container_name,
                    "environment": [{ "name": "TASK_PAYLOAD", "value": json.dumps(payload) }]
                }
            ]
        },
        networkConfiguration={
            "awsvpcConfiguration": {
                "assignPublicIp": "ENABLED",
                "securityGroups": [security_group_id],
                "subnets": subnet_ids
            }
        }
    )

if __name__ == "__main__":
    payload = {
        "user_id": "u001",
        "scopes": ["array#easy"],
        "time_spent": 300,
        "execution_time": 1.5,
        "execution_memory": 128
    }
    run_task(payload)