import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Function } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface HttpApiCustomProps {
  metricsDashboardLambda: Function;
  metricsQuestionLambda: Function;
  assessmentEntryLambda: Function;
}

export class HttpApiCustom extends Construct {
  constructor(scope: Construct, id: string, props: HttpApiCustomProps) {
    super(scope, id);

    const api = new HttpApi(this, "HttpApiConstruct", {
      corsPreflight: {
        allowOrigins: ["*"],
        allowMethods: [CorsHttpMethod.ANY],
        allowHeaders: ["*"],
      },
    });

    api.addRoutes({
      path: "/dashboard",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "DashBoardLambda",
        props.metricsDashboardLambda
      ),
    });

    api.addRoutes({
      path: "/metrics",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "QuestionLambda",
        props.metricsQuestionLambda
      ),
    });

    api.addRoutes({
      path: "/assessment",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "AssessmentEntryLambda",
        props.assessmentEntryLambda
      ),
    });
  }
}
