import os
import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ.get("ASSESSMENTS_TABLE_NAME"))
# table = dynamodb.Table("AssessmentsTable")

def fetch_assessment_question(user_id, timestamp):
    try:
        key = { "userId": user_id, "timestamp": timestamp }
        response = table.get_item(Key=key)
        item = response.get("Item", {})
        questions = item.get("questions", [])
        
        # Return most recently completed question
        return questions[-2] if questions and len(questions) > 1 else {}
    
    except Exception as e:
        return { "error": str(e) }

if __name__ == "__main__":
    user_id = "u001"
    timestamp = "2025-05-01T00:00:00Z"
    response = fetch_assessment_question(user_id, timestamp)
    print(response)