def handler(event, context):
    code = event.get("code")
    print("Received code from ECS:", code)
    return {"statusCode": 200, "body": f"Got your code: {code}"}
