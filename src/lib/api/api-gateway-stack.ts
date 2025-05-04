import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export interface ApiGatewayStackProps extends StackProps {
  handler: lambda.IFunction;
}

export class ApiGatewayStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    // Create the REST API
    const api = new apigateway.RestApi(this, "AssessmentRestApi", {
      description: "Assessment API with simplified structure",
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowCredentials: true,
        allowOrigins: ['*'], // Restrict to specific origins in production
      },
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 50,
      },
    });

    // Create Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(props.handler, {
      proxy: true,
    });

    // Create health check endpoint
    const pingResource = api.root.addResource('ping');
    pingResource.addMethod('GET', lambdaIntegration);

    // Create assessments resource
    const assessmentsResource = api.root.addResource('assessments');
    
    // Add action resource for handling different operations
    const actionResource = assessmentsResource.addResource('action');
    
    // POST /assessments/action - Handle all assessment operations
    actionResource.addMethod('POST', lambdaIntegration);

    // Output the API endpoint URL
    new CfnOutput(this, "RestApiUrl", {
      value: api.url,
      description: "API Gateway REST API endpoint",
    });
  }
}
