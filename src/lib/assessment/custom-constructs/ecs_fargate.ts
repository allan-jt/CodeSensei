import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam'; // Add this import

export interface EcsFargateProps {
  /** Optionally provide an existing VPC */
  readonly vpc?: ec2.IVpc;
  /** Container image URI (defaults to ECS sample image) */
  readonly containerImage?: string;
  /** Number of tasks to run (default: 1) */
  readonly desiredCount?: number;
  /** CPU units for each task (default: 256) */
  readonly cpu?: number;
  /** Memory (MiB) for each task (default: 512) */
  readonly memoryLimitMiB?: number;
}

export class EcsFargateConstruct extends Construct {
  /** ECS cluster created or provided */
  public readonly cluster: ecs.Cluster;
  /** Fargate service behind an ALB */
  public readonly service: ecs_patterns.ApplicationLoadBalancedFargateService;
  /** Task role for the Fargate service */
  public readonly taskRole: iam.Role;

  constructor(scope: Construct, id: string, props?: EcsFargateProps) {
    super(scope, id);

    // Use provided VPC or create a new one
    const vpc = props?.vpc ?? new ec2.Vpc(this, 'Vpc', { maxAzs: 2 });

    // Create ECS cluster in the VPC
    this.cluster = new ecs.Cluster(this, 'Cluster', { vpc });

    // Create the task role that will be used by the container
    this.taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    
    // Add DynamoDB permissions to the task role
    this.taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem", 
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchWriteItem",
          "dynamodb:BatchGetItem"
        ],
        resources: [
          `arn:aws:dynamodb:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:table/AssessmentsTable`
        ]
      })
    );
    this.taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "bedrock:InvokeModel",
          "bedrock:ListFoundationModels",
          "bedrock:GetFoundationModel"
        ],
        resources: ["*"] // Or restrict to only the models you use
      })
    );

    // Define Fargate service + ALB
    this.service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'FargateService', {
      cluster: this.cluster,
      cpu: props?.cpu ?? 256,
      memoryLimitMiB: props?.memoryLimitMiB ?? 512,
      desiredCount: props?.desiredCount ?? 1,
      publicLoadBalancer: true,
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(
          ecr.Repository.fromRepositoryName(
            this, 
            'AssessmentHandlerRepo', 
            'assessment-handler'
          ), 
          'latest'
        ),
        containerPort: 80,
        taskRole: this.taskRole, // Use the custom task role with DynamoDB permissions
      },
    });

    // Output ALB DNS for convenience
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.service.loadBalancer.loadBalancerDnsName,
      description: 'Public DNS for your Fargate service',
    });
  }
}