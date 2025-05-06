FROM python:3.13-slim

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir boto3 flask

EXPOSE 80

CMD ["python", "app.py"]