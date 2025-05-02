import json


def handler(event, context):
    print("Received code from ECS:", json.dumps(event, indent=2))
    return {"statusCode": 200, "body": f"Received"}


# {
# userID,
# timestamp,
# results

# }
