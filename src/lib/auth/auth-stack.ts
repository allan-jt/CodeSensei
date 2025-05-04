import * as cdk from "aws-cdk-lib";
import { ManagedLoginVersion, UserPool, UserPoolClient, UserPoolDomain } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs"

export class AuthStack extends cdk.Stack {
    public readonly userPool: UserPool
    public readonly userPoolClient: UserPoolClient;
    public readonly userPoolDomain: UserPoolDomain;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.userPool = new UserPool(this, "UserPool", {
            userPoolName: "CodeSenseiUserPool",
            selfSignUpEnabled: true,
            signInAliases: { email: true },
            autoVerify: { email: true },
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        this.userPoolClient = new UserPoolClient(this, "UserPoolClient", {
            userPool: this.userPool,
            generateSecret: false,
            authFlows: { userPassword: true }
        })

        this.userPoolDomain = new UserPoolDomain(this, "UserPoolDomain", {
            userPool: this.userPool,
            cognitoDomain: { domainPrefix: "codesensei-app" },
            managedLoginVersion: ManagedLoginVersion.NEWER_MANAGED_LOGIN
        })
    }
}