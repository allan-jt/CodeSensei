import { Construct } from "constructs";
import {
  Role,
  ServicePrincipal,
  ManagedPolicy,
  PolicyStatement,
} from "aws-cdk-lib/aws-iam";
import {
  FoundationModel,
  FoundationModelIdentifier,
} from "aws-cdk-lib/aws-bedrock";

export class BedrockAccessRole extends Construct {
  public readonly role: Role;
  public readonly modelId =
    FoundationModelIdentifier.ANTHROPIC_CLAUDE_3_5_SONNET_20241022_V2_0_51K;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const model = FoundationModel.fromFoundationModelId(
      this,
      "BedrockModel",
      this.modelId
    );

    this.role = new Role(this, "BedrockEcsRole", {
      assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    this.role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonBedrockFullAccess")
    );

    this.role.addToPolicy(
      new PolicyStatement({
        actions: [
          "bedrock:InvokeModel",
          "bedrock:ListFoundationModels",
          "bedrock:GetFoundationModel",
        ],
        resources: [model.modelArn],
      })
    );
  }
}
