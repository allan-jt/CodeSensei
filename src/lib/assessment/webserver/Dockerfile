FROM --platform=linux/amd64 python:3.11-slim
WORKDIR /app
COPY . /app
RUN pip install fastapi uvicorn boto3
ENV PATH="/usr/local/bin:${PATH}"
CMD ["uvicorn", "webserver:app", "--host", "0.0.0.0", "--port", "80"]