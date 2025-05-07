import { Stack, StackProps, CfnOutput, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { EcsFargateConstruct } from "./custom-constructs/ecs_fargate";
import { LambdaForEcsFargate } from "./custom-constructs/lambda";
import { BedrockConstruct } from "./custom-constructs/bedrock";

export interface AssessmentStackProps extends StackProps {
  openSearchLambda?: lambda.Function; // Make it optional for backward compatibility
}

export class AssessmentStack extends Stack {
  public readonly lambdaForEcs: LambdaForEcsFargate;
  public readonly ecsFargate: EcsFargateConstruct;
  public readonly bedrock: BedrockConstruct;

  constructor(scope: Construct, id: string, props: AssessmentStackProps = {}) {
    super(scope, id, props);

    // Create ECS Fargate cluster for backend
    this.ecsFargate = new EcsFargateConstruct(this, "EcsFargate");

    // Add OpenSearch Lambda permission to the task role if provided
    if (props.openSearchLambda) {
      this.ecsFargate.taskRole.addToPolicy(
        new iam.PolicyStatement({
          actions: ["lambda:InvokeFunction"],
          resources: [props.openSearchLambda.functionArn],
        })
      );
      
      // Pass the Lambda ARN to the container as an environment variable
      this.ecsFargate.service.taskDefinition.defaultContainer?.addEnvironment(
        "OPENSEARCH_LAMBDA_ARN", 
        props.openSearchLambda.functionArn
      );
    }

    // In assessment-stack.ts
this.lambdaForEcs = new LambdaForEcsFargate(this, "LambdaForECS", {
  cluster: this.ecsFargate.cluster,
  taskDefinition: this.ecsFargate.service.taskDefinition,
  albDns: this.ecsFargate.service.loadBalancer.loadBalancerDnsName,
});

// Add this line to ensure resource stability
(this.lambdaForEcs.fn.node.defaultChild as lambda.CfnFunction).overrideLogicalId('LambdaForEcsFargate');

    // Set up Bedrock for AI-powered assessment
    const models = [
      'amazon.titan-tg1-large',
      'us.anthropic.claude-3-5-sonnet-20241022-v2:0'
    ];

    this.bedrock = new BedrockConstruct(this, 'Bedrock', {
      vpc: this.ecsFargate.cluster.vpc,
      modelIds: models,
    });

    // Output the API endpoint
    new CfnOutput(this, "ApiEndpoint", {
      value: this.lambdaForEcs.fn.functionName,
      description: "Lambda function name that processes API requests",
    });
  }
}