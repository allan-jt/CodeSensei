import os
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
metrics_table = dynamodb.Table(os.environ.get("METRICS_TABLE_NAME"))
assessments_table = dynamodb.Table(os.environ.get("ASSESSMENTS_TABLE_NAME"))
# metrics_table = dynamodb.Table("MetricsTable")
# assessments_table = dynamodb.Table("AssessmentsTable")

def fetch_overall_metrics(user_id):
    try:
        response = metrics_table.get_item(Key={"userId": user_id})
        item = response.get("Item", {})
        metrics = item.get("metrics", {})
        
        return metrics
    
    except Exception as e:
        return { "error": str(e) }

def fetch_all_assessment_metrics(user_id):
    try:
        response = assessments_table.query(
            KeyConditionExpression=Key("userId").eq(user_id),
            ProjectionExpression="#timestamp, #metrics",
            ExpressionAttributeNames={"#timestamp": "timestamp", "#metrics": "metrics"}
        )
        items = response.get("Items", [])
        
        return items
    
    except Exception as e:
        return { "error": str(e) }

if __name__ == "__main__":
    user_id = "u001"
    # response = fetch_overall_metrics(user_id)
    response = fetch_all_assessment_metrics(user_id)
    print(response)