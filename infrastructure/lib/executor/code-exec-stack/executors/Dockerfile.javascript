FROM python:alpine

WORKDIR /app

RUN apk add --no-cache nodejs npm

COPY /javascript-executor/ .

COPY /shared/ .

RUN pip install --no-cache-dir flask boto3

EXPOSE 80

CMD ["python", "main.py"]
