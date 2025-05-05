import os
import json
import decimal
import boto3
from flask import Flask, request, jsonify


app = Flask(__name__)


METRICS_TABLE_NAME = os.environ.get("METRICS_TABLE_NAME")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(METRICS_TABLE_NAME)


@app.route("/")
def health_check():
    return jsonify({"status": "ok"}), 200


def get_metrics(user_id, scopes_to_include):
    response = table.get_item(Key={"userId": user_id})
    item = response.get("Item", {})
    metrics = item.get("metrics", {})

    filtered_metrics = {}
    for metric, scopes in metrics.items():
        filtered_metrics[metric] = {
            scope: value
            for scope, value in scopes.items()
            if scope in scopes_to_include
        }
    
    return { "userId": user_id, "metrics": filtered_metrics }


@app.route("/update", methods=["POST"])
def update_metrics():
    try:
        payload = request.get_json()
        user_id = payload.get("user_id")
        scopes = payload.get("scopes")
        metrics = { metric: decimal.Decimal(str(value)) for metric, value in payload.items() if metric not in ["user_id", "scopes"] }

        for scope in scopes:
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
        
        updated_metrics = get_metrics(user_id, scopes)
        return jsonify(updated_metrics), 200
    
    except Exception as e:
        print(f"Error updating metrics: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)