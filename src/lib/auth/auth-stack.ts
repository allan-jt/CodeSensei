import * as cdk from "aws-cdk-lib";
import {
  UserPool,
  UserPoolClient,
  UserPoolDomain,
  UserPoolOperation,
} from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import { CognitoCustom } from "./custom-constructs/cognito";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { LambdaCustom } from "./custom-constructs/lambda";

interface AuthStackProps extends cdk.StackProps {
  userTable: TableV2;
}

export class AuthStack extends cdk.Stack {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;
  public readonly userPoolDomain: UserPoolDomain;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const cognito = new CognitoCustom(this, "CognitoService", {
      callBackUrl: "http://localhost:5173/",
      logoutUrl: "http://localhost:5173/",
    });
    this.userPool = cognito.userPool;
    this.userPoolClient = cognito.userPoolClient;
    this.userPoolDomain = cognito.userPoolDomain;

    const lambda = new LambdaCustom(this, "LambdaCognitoService", {
      userTable: props.userTable
    })

    this.userPool.addTrigger(
      UserPoolOperation.POST_CONFIRMATION,
      lambda.fn
    )
  }
}
