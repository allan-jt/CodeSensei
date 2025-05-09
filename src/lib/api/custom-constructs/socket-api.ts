import { WebSocketApi, WebSocketStage } from "aws-cdk-lib/aws-apigatewayv2";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Function } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface SocketApiCustomProps {
  executionEntryLambda: Function;
  chatbotEntryLambda: Function;
}

export class SocketApiCustom extends Construct {
  constructor(scope: Construct, id: string, props: SocketApiCustomProps) {
    super(scope, id);

    const api = new WebSocketApi(this, "WebSocketApiConstruct");
    api.addRoute("executeCode", {
      integration: new WebSocketLambdaIntegration(
        "SocketExecutionLambdaIntegration",
        props.executionEntryLambda
      ),
    });
    api.addRoute("chatbot", {
      integration: new WebSocketLambdaIntegration(
        "SocketChatbotLambdaIntegration",
        props.chatbotEntryLambda
      ),
    });

    new WebSocketStage(this, "SocketDevDeployStage", {
      webSocketApi: api,
      stageName: "dev",
      autoDeploy: true,
    });
  }
}
