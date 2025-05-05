FROM python:3.9-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir fastapi uvicorn boto3

# Copy the FastAPI server
COPY webserver.py .

EXPOSE 80

CMD ["uvicorn", "webserver:app", "--host", "0.0.0.0", "--port", "80"]