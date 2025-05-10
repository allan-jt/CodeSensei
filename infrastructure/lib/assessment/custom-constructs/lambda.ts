import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Role, ServicePrincipal, PolicyStatement, ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as path from 'path';

export interface LambdaForEcsFargateProps {
  /** ECS cluster to run tasks in */
  readonly cluster: ecs.ICluster;
  /** Task definition for the Fargate service */
  readonly taskDefinition: ecs.ITaskDefinition;
  /** AWS region (defaults to stack region) */
  readonly region?: string;
  /** The DNS name of your ALB so Lambda can call it */
  readonly albDns: string; 
}

export class LambdaForEcsFargate extends Construct {
  /** The Lambda function that triggers Fargate tasks */
  public readonly fn: Function;

  constructor(scope: Construct, id: string, props: LambdaForEcsFargateProps) {
    super(scope, id);

    // Create IAM role for Lambda
    const role = new Role(this, 'LambdaExecutionRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant ECS permissions to Lambda
    role.addToPolicy(new PolicyStatement({
      actions: [
        'ecs:RunTask',
        'ecs:DescribeTasks',
        'ecs:DescribeClusters',
        'iam:PassRole',
      ],
      resources: [
        props.taskDefinition.taskDefinitionArn,
        props.cluster.clusterArn,
      ],
    }));

    // Define the Lambda function
    this.fn = new Function(this, 'LambdaForEcsFargate', {
      functionName: 'Code_Sensei_LF_1-0',
      runtime: Runtime.PYTHON_3_13,
      code: Code.fromAsset(path.join(__dirname, '../lambda-code')),
      handler: 'preprocess.handler',
      role,
      timeout: cdk.Duration.seconds(60),
      environment: {
        CLUSTER_NAME: props.cluster.clusterName,
        TASK_DEF_ARN: props.taskDefinition.taskDefinitionArn,
        CLUSTER_REGION: props.region ?? cdk.Aws.REGION,
        SERVICE_URL: `http://${props.albDns}`,
      },
    });
  }
}