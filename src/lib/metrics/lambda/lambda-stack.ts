import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Function, Code, Runtime } from "aws-cdk-lib/aws-lambda";
import * as path from "path";

export class MetricsLambdaStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        
        const appName = "CodeSensei";
      
        const lf4_0 = new Function(this, "LF4_0", {
            functionName: `${appName}-LF4_0`,
            runtime: Runtime.PYTHON_3_13,
            code: Code.fromAsset(path.join(__dirname, "lf4_0")),
            handler: "index.handler"
        });
        
        const lf4_1 = new Function(this, "LF4_1", {
            functionName: `${appName}-LF4_1`,
            runtime: Runtime.PYTHON_3_13,
            code: Code.fromAsset(path.join(__dirname, "lf4_1")),
            handler: "index.handler"
        });
        
        const lf4_2 = new Function(this, "LF4_2", {
            functionName: `${appName}-LF4_2`,
            runtime: Runtime.PYTHON_3_13,
            code: Code.fromAsset(path.join(__dirname, "lf4_2")),
            handler: "index.handler"
        });
    }
}