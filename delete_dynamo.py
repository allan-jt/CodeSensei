import boto3

def delete_all_assessments():
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('AssessmentsTable')
    
    # Scan for all items
    response = table.scan()
    items = response.get('Items', [])
    
    # Delete each item
    for item in items:
        table.delete_item(
            Key={
                'userId': item['userId'],
                'timestamp': item['timestamp']
            }
        )
        print(f"Deleted: {item['userId']} - {item['timestamp']}")
    
    print(f"Deleted {len(items)} items")

if __name__ == "__main__":
    delete_all_assessments()