import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import { ConfigStackProps, StackInput } from "../config";

export class AppRunnerStack extends Stack {
  private stackInput: StackInput;

  constructor(scope: Construct, id: string, props: ConfigStackProps) {
    super(scope, id, props);

    this.stackInput = props.config;
    this.create();
  }

  private create() {}
}
