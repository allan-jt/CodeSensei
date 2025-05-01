def handler(event, context):
    results = event.get("results")
    print("Received code from ECS:", results)
    return {"statusCode": 200, "body": f"Got your code: {results}"}
