import * as cdk from "aws-cdk-lib";
import { Function } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { SocketApiCustom } from "./custom-constructs/socket-api";

interface ApiGatewayProps extends cdk.StackProps {
  executionEntryLambda: Function;
}

export class ApiGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id, props);

    const socketApi = new SocketApiCustom(this, "SocketAPI", {
      executionEntryLambda: props.executionEntryLambda,
    });
  }
}
