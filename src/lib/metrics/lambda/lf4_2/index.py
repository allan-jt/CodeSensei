import json
from send_request import send_request

def handler(event, context):
    for record in event.get("Records"):
        message_id = record.get("messageId")
        try:
            message = json.loads(record.get("body"))
            response = send_request(message)
            print(f"Successfully processed message {message_id}")
        except Exception as e:
            print(f"Error processing message {message_id}: {e}")

if __name__ == "__main__":
    event = {
        "Records": [
            {
                "messageId": "1",
                "body": json.dumps({
                    "user_id": "u001",
                    "scopes": ["array#all", "all#easy", "all#all"],
                    "time_spent": 300,
                    "execution_time": 1.5,
                    "execution_memory": 128
                })
            }
        ]
    }
    handler(event, None)