import json
from datetime import datetime
from fetch import fetch_assessment_question
from send_request import send_request
from send_message import send_message

def get_related_scopes(scopes):
    related_scopes = set()
    
    for scope in scopes:
        topic, difficulty = scope.split("#")
        related_scopes.add(f"{topic}#all")
        related_scopes.add(f"all#{difficulty}")
        related_scopes.add("all#all")
    
    return list(related_scopes)

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
    headers = {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"}
    try:
        # Get parameters from event
        user_id = event.get("user_id")
        timestamp = event.get("timestamp")
        
        # Fetch most recently completed assessment question
        question = fetch_assessment_question(user_id, timestamp)
        if not question:
            raise Exception("There are no completed assessment questions")
        
        # Get metrics from the question
        status = question.get("status")
        topics = question.get("topics")
        difficulty = question.get("difficulty")
        time_started = question.get("timeStarted")
        time_ended = question.get("timeEnded")
        best_exec_time = question.get("bestExecTime")
        best_exec_mem = question.get("bestExecMem")

        # Validate the values
        if status != "pass":
            raise Exception("The question was not completed")
        if not all([topics, difficulty]):
            raise Exception("The question has missing scopes")
        if not all([time_started, time_ended, best_exec_time, best_exec_mem]):
            raise Exception("The question has missing metrics")
        
        # Create update metrics payload
        scopes = [f"{topic}#{difficulty}" for topic in topics]
        time_started = datetime.fromisoformat(time_started.replace("Z", "+00:00"))
        time_ended = datetime.fromisoformat(time_ended.replace("Z", "+00:00"))
        time_spent = (time_ended - time_started).total_seconds()
        payload = {
            "user_id": user_id,
            "timestamp": timestamp,
            "scopes": scopes,
            "time_spent": time_spent,
            "execution_time": float(best_exec_time),
            "execution_memory": int(best_exec_mem)
        }
        
        # Send request to update assessment metrics for primary scopes (real-time)
        ecs_assessments_response = send_request(payload, endpoint="/assessments/update")

        # Send request to update overall metrics for primary scopes (real-time)
        ecs_metrics_response = send_request(payload, endpoint="/metrics/update")

        # Send message to SQS to update metrics for related scopes (asynchronous)
        related_scopes = get_related_scopes(scopes)
        payload["scopes"] = related_scopes
        sqs_response = send_message(payload)

        # Format responses for return data
        updated_assessment_metrics = format_metrics(ecs_assessments_response)
        updated_overall_metrics = format_metrics(ecs_metrics_response)
        sqs_message_id = sqs_response.get("messageId")

        # Return response with updated metrics
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
                "message": f"Metrics updated for user {user_id}",
                "assessment_metrics": updated_assessment_metrics,
                "overall_metrics": updated_overall_metrics,
                "sqs_message_id": sqs_message_id
            }),
        }
    
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({ "error": str(e) })
        }

if __name__ == "__main__":
    event = {
        "user_id": "u001",
        "timestamp": "2025-05-01T00:00:00Z"
    }
    response = handler(event, None)
    print(response)