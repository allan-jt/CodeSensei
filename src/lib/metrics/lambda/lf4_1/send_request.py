import os
import json
from urllib.request import Request, urlopen

def send_request(payload):
    URL = f"http://{os.environ.get("REQUEST_URL")}/update"
    headers = { "Content-Type": "application/json" }
    data = json.dumps(payload).encode("utf-8")
    
    request = Request(URL, method="POST", headers=headers, data=data)
    
    with urlopen(request) as response:
        return json.loads(response.read().decode("utf-8"))

if __name__ == "__main__":
    payload = {
        "user_id": "u001",
        "scopes": ["array#easy"],
        "time_spent": 300,
        "execution_time": 1.5,
        "execution_memory": 128
    }
    send_request(payload)