import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StorageStack } from "./storage/storage-stack";
import { AssessmentStack } from './assessment/assessment-stack';


export class CodeSenseiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const storage = new StorageStack(this, "StorageStack");

    const assessment = new AssessmentStack(this, "AssessmentStack",{
      env: props?.env,
    });
  }
}

