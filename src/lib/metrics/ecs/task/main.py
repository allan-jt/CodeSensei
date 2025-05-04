import os
import json
import decimal
import boto3

METRICS_TABLE_NAME = os.environ.get("METRICS_TABLE_NAME")
TASK_PAYLOAD = os.environ.get("TASK_PAYLOAD")

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(METRICS_TABLE_NAME)

def main():
    payload = json.loads(TASK_PAYLOAD)
    user_id = payload.get("user_id")
    scope = payload.get("scope")
    metrics = { metric: decimal.Decimal(str(value)) for metric, value in payload.items() if metric not in ["user_id", "scope"] }

    update_expression = "SET"
    expression_attribute_values = { ":zero": decimal.Decimal(0), ":count": decimal.Decimal(1) }
    expression_attribute_names = { "#metrics": "metrics", "#scope": scope, "#count": "count", "#total": "total" }

    # Build update expression and expression attribute values based on metrics
    for metric, value in metrics.items():
        metric_path = f"#metrics.{metric}.#scope"
        update_expression += f" {metric_path}.#count = if_not_exists({metric_path}.#count, :zero) + :count,"
        update_expression += f" {metric_path}.#total = if_not_exists({metric_path}.#total, :zero) + :{metric},"
        expression_attribute_values[f":{metric}"] = value

    # Strip trailing comma
    update_expression = update_expression.rstrip(",")

    table.update_item(
        Key={"userId": user_id},
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_attribute_values,
        ExpressionAttributeNames=expression_attribute_names
    )

    print(json.dumps({"message": f"Updated metrics for user {user_id} and scope {scope}"}))

if __name__ == "__main__":
    main()