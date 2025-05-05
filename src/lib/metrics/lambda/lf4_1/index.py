import json
from send_request import send_request
from send_message import send_message

def get_related_scopes(scope):
    topic, difficulty = scope.split("#")
    return [f"{topic}#all", f"all#{difficulty}", "all#all"]

def handler(event, context):
    try:
        # Get parameters from event
        user_id = event.get("user_id")
        scope = event.get("scope")
        time_spent = event.get("time_spent")
        execution_time = event.get("execution_time")
        execution_memory = event.get("execution_memory")

        # Run ECS task for the primary scope (real-time)
        ecs_response = send_request({
            "user_id": user_id,
            "scopes": [scope],
            "time_spent": time_spent,
            "execution_time": execution_time,
            "execution_memory": execution_memory
        })

        # Send message to SQS for other scopes (asynchronous)
        sqs_response = send_message({
            "user_id": user_id,
            "scopes": get_related_scopes(scope),
            "time_spent": time_spent,
            "execution_time": execution_time,
            "execution_memory": execution_memory
        })

        # Return response
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": f"Metrics updated for user {user_id}",
                "ecs_response": ecs_response,
                "sqs_response": sqs_response
            }),
        }
    
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({ "error": str(e) })
        }

if __name__ == "__main__":
    event = {
        "user_id": "u001",
        "scope": "array#easy",
        "time_spent": 300,
        "execution_time": 1.5,
        "execution_memory": 128
    }
    handler(event, None)