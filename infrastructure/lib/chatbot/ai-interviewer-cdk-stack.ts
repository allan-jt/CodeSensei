import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as path from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";

export class InterviewAiCombinedStack extends cdk.Stack {
  public readonly chatbotEntryLambda: lambda.Function;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // -------------------- VPC & ECS Setup --------------------
    const cluster = new ecs.Cluster(this, "InterviewerCluster");

    const taskRole = new iam.Role(this, "FargateTaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    taskRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonDynamoDBFullAccess")
    );

    const fargateService =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        "InterviewerFargateService",
        {
          cluster,
          cpu: 256,
          memoryLimitMiB: 512,
          desiredCount: 1,
          publicLoadBalancer: true,
          taskSubnets: { subnetType: ec2.SubnetType.PUBLIC },
          assignPublicIp: true,
          taskImageOptions: {
            image: ecs.ContainerImage.fromAsset(
              path.join(__dirname, "interviewerimage")
            ),
            containerPort: 4567,
            taskRole: taskRole,
          },
        }
      );

    const ecsEndpoint =
      "http://" + fargateService.loadBalancer.loadBalancerDnsName + "/hint";

    // -------------------- DynamoDB 引用 --------------------
    const questionTable = dynamodb.Table.fromTableName(
      this,
      "InterviewerTable",
      "QuestionBankTable"
    );
    questionTable.grantReadWriteData(taskRole);

    // -------------------- SQS Queue --------------------
    const queue = new sqs.Queue(this, "PromptQueue", {
      fifo: true,
      contentBasedDeduplication: true,
      queueName: "PromptQueue.fifo",
      visibilityTimeout: cdk.Duration.seconds(120),
    });

    // -------------------- Lambda 3-1 --------------------
    const lambda3_1 = new lambda.Function(this, "Lambda3_1_SendToSQS", {
      functionName: "Lambda3-1-SendToSQS",
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: "lambda3_1.lambda_handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
      environment: {
        QUEUE_URL: queue.queueUrl,
      },
    });
    queue.grantSendMessages(lambda3_1);
    lambda3_1.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    this.chatbotEntryLambda = lambda3_1;

    // -------------------- Lambda 3-2 --------------------
    const lambda3_2 = new lambda.Function(this, "Lambda3_2_ReadFromSQS", {
      functionName: "Lambda3-2-ReadFromSQS",
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: "lambda3_2.lambda_handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
      timeout: cdk.Duration.seconds(100),
      environment: {
        ECS_API_ENDPOINT: ecsEndpoint,
      },
    });
    queue.grantConsumeMessages(lambda3_2);
    lambda3_2.addEventSource(new lambdaEventSources.SqsEventSource(queue));
    lambda3_2.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    lambda3_2.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["execute-api:ManageConnections"],
        resources: ["arn:aws:execute-api:*:*:*/*/POST/@connections/*"],
      })
    );
  }
}
