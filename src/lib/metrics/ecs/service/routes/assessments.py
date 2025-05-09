import os
import decimal
import boto3
from flask import Blueprint, request, jsonify

assessments_blueprint = Blueprint("assessments", __name__, url_prefix="/assessments")

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ.get("ASSESSMENTS_TABLE_NAME"))

def filter_metrics(metrics, scopes_to_include):
    filtered_metrics = {}

    for metric, scopes in metrics.items():
        filtered_metrics[metric] = {
            scope: value
            for scope, value in scopes.items()
            if scope in scopes_to_include
        }
    
    return filtered_metrics

@assessments_blueprint.route("/update", methods=["POST"])
def update_assessment_metrics():
    try:
        # Get parameters from request
        payload = request.get_json()
        user_id = payload.get("user_id")
        timestamp = payload.get("timestamp")
        scopes = payload.get("scopes")
        update_metrics = {
            metric: decimal.Decimal(str(value))
            for metric, value in payload.items()
            if metric not in ["user_id", "timestamp", "scopes"]
        }

        # Fetch the metrics object in the assessment record
        fetch_response = table.get_item(Key={"userId": user_id, "timestamp": timestamp})
        item = fetch_response.get("Item")
        metrics = item.get("metrics", {})

        # Update it in memory (add nested metrics and scopes if they don't exist)
        for metric, value in update_metrics.items():
            if metric not in metrics:
                metrics[metric] = {}
            for scope in scopes:
                if scope not in metrics[metric]:
                    metrics[metric][scope] = { "count": decimal.Decimal(0), "total": decimal.Decimal(0) }

                metrics[metric][scope]["count"] += decimal.Decimal(1)
                metrics[metric][scope]["total"] += value

        # Replace the metrics object in the assessment record
        update_response = table.update_item(
            Key={"userId": user_id, "timestamp": timestamp},
            UpdateExpression="SET #metrics = :metrics",
            ExpressionAttributeNames={"#metrics": "metrics"},
            ExpressionAttributeValues={":metrics": metrics},
            ReturnValues="UPDATED_NEW"
        )

        # print(update_response)

        # Raise an exception if the update was unsuccessful
        if update_response.get("ResponseMetadata").get("HTTPStatusCode") != 200:
            raise Exception("Failed to update assessment metrics")

        # Filter the metrics object to include only the requested scopes
        updated_metrics = update_response.get("Attributes").get("metrics")
        updated_metrics = filter_metrics(updated_metrics, scopes)

        return jsonify(updated_metrics), 200
    
    except Exception as e:
        return jsonify({ "error": str(e) }), 500