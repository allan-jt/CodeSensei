from utils import *

def handle_message(message):
    question_id = message.get("questionId")
    prompt = message.get("prompt")
    socket = message.get("socket", {})

    if not question_id or not prompt:
        print("Invalid message body")
        return
    
    context = get_question_context(question_id)
    print(context)
    answer = call_bedrock(prompt, context)
    print(answer)
    send_to_socket(socket, {"message": answer})

while True:
    response = sqs.receive_message(
        QueueUrl=sqs_url,
        MaxNumberOfMessages=5,
        WaitTimeSeconds=10
    )

    messages = response.get("Messages", [])
    for msg in messages:
        try:
            print(msg)
            body = json.loads(msg["Body"])
            handle_message(body)
            sqs.delete_message(
                QueueUrl=sqs_url,
                ReceiptHandle=msg["ReceiptHandle"]
            )
        except Exception as e:
            print(f"Error handling message: {e}")