import json
from run_task import run_task
from send_message import send_message

def get_related_scopes(scope):
    topic, difficulty = scope.split("#")
    return [f"{topic}#all", f"all#{difficulty}", "all#all"]

def handler(event, context):
    # Get parameters from event
    user_id = event.get("user_id")
    scope = event.get("scope")
    time_spent = event.get("time_spent")
    execution_time = event.get("execution_time")
    execution_memory = event.get("execution_memory")

    # Run ECS task for the primary scope (real-time)
    run_task({
        "user_id": user_id,
        "scopes": [scope],
        "time_spent": time_spent,
        "execution_time": execution_time,
        "execution_memory": execution_memory
    })

    # Send message to SQS for other scopes (asynchronous)
    send_message({
        "user_id": user_id,
        "scopes": get_related_scopes(scope),
        "time_spent": time_spent,
        "execution_time": execution_time,
        "execution_memory": execution_memory
    })

    # Return response
    return {
        "statusCode": 200,
        "body": json.dumps({"message": f"Updating metrics for user {event['user_id']} and scope {event['scope']}..."}),
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