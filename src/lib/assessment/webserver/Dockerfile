# assessment/webserver/Dockerfile
FROM python:3.9-slim

WORKDIR /app

# 1) Install AWS SDK so boto3 is available at runtime
RUN pip install --no-cache-dir boto3

# 2) Copy your server into the image
COPY webserver.py .

# 3) Expose the port and launch
EXPOSE 80
CMD ["python", "webserver.py"]