import json
from run_task import run_task

def handler(event, context):
    # Run ECS task on most relevant scope (real-time)
    run_task(event)

    # Send message to SQS for other scopes (asynchronous)

    # Return response
    return {
        "statusCode": 200,
        "body": json.dumps({"message": f"Updated metrics for user {event['user_id']} and scope {event['scope']}"}),
    }

if __name__ == "__main__":
    event = {
        "user_id": "u001",
        "scope": "Array#easy",
        "time_spent": 300,
        "execution_time": 1.5,
        "execution_memory": 128
    }
    handler(event, None)