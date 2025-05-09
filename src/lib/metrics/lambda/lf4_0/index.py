import json
from fetch import fetch_overall_metrics, fetch_all_assessment_metrics

def format_metrics(metrics_dict):
    formatted_metrics = []
    for metric_name, scopes_dict in metrics_dict.items():
        scopes = []
        for scope_name, values in scopes_dict.items():
            scopes.append({
                "scopeName": scope_name,
                "count": int(values.get("count", 0)),
                "value": float(values.get("total", 0))
            })
        formatted_metrics.append({
            "metricName": metric_name,
            "scopes": scopes
        })
    return formatted_metrics

def handler(event, context):
    try:
        # Get parameters from event
        user_id = event.get("user_id")

        # Fetch overall metrics
        overall_metrics = fetch_overall_metrics(user_id)

        # Fetch all assessment metrics
        all_assessment_metrics = fetch_all_assessment_metrics(user_id)
        
        # Format for metrics data
        result = [{ "type": "overall", "metrics": format_metrics(overall_metrics) }]
        for assessment in all_assessment_metrics:
            result.append({
                "type": assessment.get("timestamp"),
                "metrics": format_metrics(assessment.get("metrics"))
            })

        # Return formatted data
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": f"Metrics retrieved for user {user_id}",
                "data": result
            }),
        }
    
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({ "error": str(e) })
        }

if __name__ == "__main__":
    event = { "user_id": "u001" }
    response = handler(event, None)
    print(response)