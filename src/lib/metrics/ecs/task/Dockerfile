FROM python:3.13-slim

WORKDIR /app

COPY main.py .

RUN pip install --no-cache-dir boto3

EXPOSE 80

CMD ["python", "main.py"]