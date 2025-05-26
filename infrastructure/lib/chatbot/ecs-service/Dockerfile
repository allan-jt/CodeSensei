FROM python:alpine

WORKDIR /app

COPY /service/ .

RUN pip install --no-cache-dir boto3

EXPOSE 80

CMD ["python", "main.py"]