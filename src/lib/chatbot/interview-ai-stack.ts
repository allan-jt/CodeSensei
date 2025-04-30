import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { StorageStack } from '../storage/storage-stack'; // ✅ 确保导入路径正确

export interface InterviewAiStackProps extends cdk.StackProps {
  userTable: cdk.aws_dynamodb.ITable;  //  StorageStack 中的 userTable
}

export class InterviewAiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InterviewAiStackProps) {
    super(scope, id, props);

    const { userTable } = props;

    const queue = new sqs.Queue(this, 'PromptQueue', {
      fifo: true,
      contentBasedDeduplication: true,
      queueName: 'PromptQueue.fifo',
    });

    const lambda3_1 = new lambda.Function(this, 'Lambda3_1_SendToSQS', {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'lambda3_1.lambda_handler',
      code: lambda.Code.fromAsset('lambda/lambda3_1'),
      environment: {
        QUEUE_URL: queue.queueUrl,
      },
    });
    queue.grantSendMessages(lambda3_1);

    const lambda3_2 = new lambda.Function(this, 'Lambda3_2_ReadFromSQS', {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'lambda3_2.lambda_handler',
      code: lambda.Code.fromAsset('lambda/lambda3_2'),
      environment: {
        ECS_API_ENDPOINT: 'https://your-ecs-endpoint.com/process',
      },
    });
    queue.grantConsumeMessages(lambda3_2);
    lambda3_2.addEventSource(new lambdaEventSources.SqsEventSource(queue));

    const lambda3_3 = new lambda.Function(this, 'Lambda3_3_WriteToDynamo', {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'lambda3_3.lambda_handler',
      code: lambda.Code.fromAsset('lambda/lambda3_3'),
      environment: {
        DDB_TABLE: userTable.tableName, // ✅ 引入 DynamoDB 表名
      },
    });
    userTable.grantWriteData(lambda3_3); // ✅ 授权写入
  }
}
