FROM python:alpine

WORKDIR /app

COPY /server/ .

RUN pip install --no-cache-dir flask boto3

EXPOSE 80

CMD ["python", "main.py"]