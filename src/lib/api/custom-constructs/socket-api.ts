import { WebSocketApi, WebSocketStage } from "aws-cdk-lib/aws-apigatewayv2";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Function } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface SocketApiCustomProps {
  codeExecutionLambda: Function;
}

export class SocketApiCustom extends Construct {
  constructor(scope: Construct, id: string, props: SocketApiCustomProps) {
    super(scope, id);

    const api = new WebSocketApi(this, "WebSocketApiConstruct");
    api.addRoute("executeCode", {
      integration: new WebSocketLambdaIntegration(
        "ExecutionLambdaIntegration",
        props.codeExecutionLambda
      ),
    });

    new WebSocketStage(this, "DevDeployStage", {
      webSocketApi: api,
      stageName: "dev",
      autoDeploy: true,
    });
  }
}
