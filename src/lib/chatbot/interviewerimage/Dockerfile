# Construct maven project
FROM openjdk:17

WORKDIR /app

COPY ai-interviewer.jar /app/
COPY static /app/static/

EXPOSE 4567

CMD ["java", "-jar", "ai-interviewer.jar"]


