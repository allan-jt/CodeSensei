# CodeSensei
CodeSensei is a cloud-native web application that provides AI-managed coding assessments to help software engineers prepare for algorithm interviews. The app is built using a [microservices](https://en.wikipedia.org/wiki/Microservices) architecture on AWS's cloud platform to achieve reliability and scalability.

## Table of Contents
- [Features](#features)
- [System Design](#system-design)
- [Usage](#usage)
- [Contributors](#contributors)

## Features
Preparing for algorithm interviews often involves practicing a subset of LeetCode-style questions filtered by topic (e.g., arrays, graphs) and difficulty (easy, medium, hard). The selection within this subset is typically random and left to the user, making it hard to identify and focus on weak areas. CodeSensei streamlines this process by allowing users to configure their assessments, while dynamically selecting each question within that configuration based on their performance on previous ones. This enables a more personalized and targeted practice experience. To achieve this, we implemented the following features: 

#### User Authentication and Profiles
Users can sign up, log in, and maintain personalized assessment histories. Sign-ups include strong password requirements and email verification to ensure account security.

![Signup](media/demo/login.gif)

#### Assessment Configuration
Users can customize each assessment by selecting topics, difficulty levels, and the number of questions they want to attempt.

![Config](media/demo/assessment_configuration.gif)

#### Code Submission
Users can submit code for each question and view its output, along with key performance metrics such as execution time, accuracy, and memory usage.

![Execution](media/demo/execution_output_attempts.gif)

#### Chatbot Assistance
If users get stuck, they can ask the built-in chatbot for hints or clarifications. To preserve the integrity of the assessment, the chatbot does not provide code or direct answers.

![Chatbot](media/demo/chatbot.gif)

#### Dynamic Question Progression
After completing a question, users can proceed to the next one, which is selected dynamically based on their performance on previous questions within the assessment.

![Next](media/demo/submit_and_next.gif)

#### Assessment Submission and Metrics
Upon completing all questions, users can submit the assessment and view detailed metrics on time spent, execution time, and memory usage, broken down by topic and difficulty. They can also view aggregate metrics across assessments to benchmark their overall performance.

![Metrics](media/demo/metrics.gif)

## System Design

We adopted a microservices architecture composed of five core features: authentication, assessment handling, chatbot, code execution, and performance metrics. The frontend communicates with these services via HTTP requests and WebSockets through API Gateway, an AWS-managed entry point.

<img src="media/system_design/Architecture.png" alt="Architecture" style="width: 60%; display: block;">
<br>

Data is stored in DynamoDB, a serverless NoSQL database known for scalability and performance. We maintain tables for users, assessments, question bank, and performance metrics.

<img src="media/system_design/Databases.png" alt="Databases" style="width: 60%; display: block;"/>
<br>

Computationally intensive services of each feature are hosted on ECS with Fargate, allowing us to scale each service independently without managing servers.

<img src="media/system_design/Containers.png" alt="Containers" style="width: 85%; display: block;"/>
<br>

The frontend is deployed via S3 and distributed globally using CloudFront, AWS's CDN service, to ensure low-latency access across regions.

<img src="media/system_design/Frontend.png" alt="Frontend" style="width: 30%; display: block;"/>
<br>

AWS Cognito manages user authentication and signups. Upon signup, a Lambda function is triggered to create an entry for the user in the Users table.

<img src="media/system_design/Authentication.png" alt="Authentication" style="width: 35%; display: block;"/>
<br>

The Assessment Handler receives HTTP requests via an entrypoint Lambda, which performs validation before forwarding the request to the main handler service running on ECS. This service queries the Assessment table to gather the current context, including assessment configurations (e.g., selected topics and difficulty levels) and the user’s performance on prior questions. It then invokes an LLM on AWS Bedrock to determine the topic and difficulty of the next question. To efficiently retrieve matching questions, we query OpenSearch, which is indexed by topic and difficulty, enabling fast lookups without scanning and filtering the entire Questions table. A question ID is randomly selected from the retrieved list, and the corresponding full question is fetched from the Questions table. The question is then returned to the user via the entrypoint Lambda.

<img src="media/system_design/Assessment.png" alt="Assessment" style="width: 50%; display: block;"/>
<br>

The Chatbot receives socket messages containing the user prompt and current question ID. After validation, the message is pushed to an SQS queue. The chatbot service, running on ECS, polls the queue, retrieves question details from the Questions table, and forwards them along with the user prompt to an LLM on Bedrock. The response is returned to the user via WebSocket.

<img src="media/system_design/Chatbot.png" alt="Chatbot" style="width: 55%; display: block;"/>
<br>

The Code Executor handles language-specific code evaluation. An entrypoint Lambda receives user code, question ID, and language config via socket. After validation, the job is sent to an SQS queue, which triggers a distributor Lambda. Each language has its own Fargate service, allowing popular languages (like Python) to scale independently. Services fetch test cases from the Questions table, execute the code, and pass the results to a Results Manager Lambda, which compares them to expected outputs, updates the Assessment table, and returns results to the user via socket.

<img src="media/system_design/Execution.png" alt="Execution" style="width: 70%; display: block;"/>
<br>

The Metrics feature has two Lambda entrypoints. The getter Lambda retrieves user-wide metrics (from the Metrics table) and assessment-specific metrics (from the Assessment table), triggered when users visit their dashboard. The updater Lambda is invoked via HTTP when a question is completed. It triggers jobs for metric calculation at various scopes—e.g., easy-graphs (directly to Fargate) or easy-all, all-graphs, all-all (routed through SQS, then processed by a Lambda worker). This architecture balances real-time feedback with scalable aggregation and minimizes compute/database load.

<img src="media/system_design/Metrics.png" alt="Metrics" style="width: 45%; display: block;"/>


## Contributors
- Aaron Bengochea
- Timothy Cao
- Janardhan Reddy
- Allan Thekkepeedika
