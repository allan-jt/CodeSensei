FROM python:alpine

WORKDIR /app

COPY /src/ .

RUN pip install --no-cache-dir flask boto3

EXPOSE 80

CMD ["python", "main.py"]
