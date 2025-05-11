import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { EcsFargateConstruct } from "./custom-constructs/ecs_fargate";
import { LambdaForEcsFargate } from "./custom-constructs/lambda";
import { BedrockConstruct } from "./custom-constructs/bedrock";
import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Cluster } from "aws-cdk-lib/aws-ecs";

export interface AssessmentStackProps extends cdk.StackProps {
  /** The OpenSearch-init Lambda from StorageStack */
  readonly opensearchLamba: IFunction;
  readonly cluster: Cluster;
}

export class AssessmentStack extends cdk.Stack {
  public readonly ecsFargate: EcsFargateConstruct;
  public readonly lambdaForEcs: LambdaForEcsFargate;
  public readonly bedrock: BedrockConstruct;

  constructor(scope: Construct, id: string, props: AssessmentStackProps) {
    super(scope, id, props);

    // ECS/Fargate service
    this.ecsFargate = new EcsFargateConstruct(this, "EcsFargate", {
      cluster: props.cluster,
    });

    // Lambda that triggers ECS tasks
    this.lambdaForEcs = new LambdaForEcsFargate(this, "LambdaForEcsFargate", {
      cluster: props.cluster,
      taskDefinition: this.ecsFargate.service.taskDefinition,
      albDns: this.ecsFargate.service.loadBalancer.loadBalancerDnsName,
    });

    // Bedrock integration (shared VPC)
    const models = ["mistral.mistral-7b-instruct-v0:2"];

    this.bedrock = new BedrockConstruct(this, "Bedrock", {
      vpc: props.cluster.vpc,
      modelIds: models,
    });

    // Grant ECS Task Role Bedrock invocation permissions
    // Pull out the Task Role from the service’s TaskDefinition
    const ecsTaskRole = this.ecsFargate.service.taskDefinition.taskRole;

    // Build open privilege bedrock IAM policy for invoke/list/get
    const bedrockPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "bedrock:InvokeModel",
        "bedrock:ListFoundationModels",
        "bedrock:GetFoundationModel",
      ],
      resources: ["*"],
    });
    // Attach it
    ecsTaskRole.addToPrincipalPolicy(bedrockPolicy);

    // Grant ECS Task Role OpenSearch invocation permissions
    const openSearchPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["lambda:InvokeFunction"],
      resources: ["*"],
    });

    ecsTaskRole.addToPrincipalPolicy(openSearchPolicy);

    // Grant broad DynamoDB permissions to the task role ———
    const dynamoDbPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem",
      ],
      resources: ["*"],
    });

    ecsTaskRole.addToPrincipalPolicy(dynamoDbPolicy);

    const container = this.ecsFargate.service.taskDefinition.defaultContainer!;
    if (container) {
      container.addEnvironment(
        "OPENSEARCH_LAMBDA_ARN",
        props.opensearchLamba.functionArn
      );
    }

    // Output the Task Role ARN so you can inspect it in the console
    new cdk.CfnOutput(this, "EcsTaskRoleArn", {
      value: ecsTaskRole.roleArn,
      description: "IAM Role that your Fargate tasks assume",
    });

    // Stack Outputs
    new cdk.CfnOutput(this, "LoadBalancerDNS", {
      value: this.ecsFargate.service.loadBalancer.loadBalancerDnsName,
      description: "Public DNS name of the Fargate service ALB",
    });

    new cdk.CfnOutput(this, "LambdaInvokeArn", {
      value: this.lambdaForEcs.fn.functionArn,
      description: "Invoke ARN for the ECS-triggering Lambda",
    });

    new cdk.CfnOutput(this, "EcsOpenSearchLambdaArn", {
      value: props.opensearchLamba.functionArn,
      description: "ARN of the OpenSearch-init Lambda",
    });
  }
}
