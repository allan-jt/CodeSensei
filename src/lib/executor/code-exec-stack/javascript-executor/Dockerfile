FROM python:alpine

WORKDIR /app

RUN apk add --no-cache nodejs npm

COPY /src/ .

RUN pip install --no-cache-dir flask boto3

EXPOSE 80

CMD ["python", "main.py"]
