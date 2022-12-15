import { StackProps } from "aws-cdk-lib";

export interface ConfigStackProps extends StackProps {
  config: StackInput;
}

export interface StackInput {
  stackEnv: StackEnv;
  vpcConnectorProps: VpcConnectorProps;
  sourceConfigurationProps: SourceConfigurationProps;
  instanceConfigurationProps: InstanceConfigurationProps;
  autoScalingConfigurationArnProps: AutoScalingConfigurationArnProps;
}

export interface StackEnv {
  account: string;
  region: string;
}

export interface VpcConnectorProps {
  vpcID: string;
  subnetID1: string;
  subnetID2: string;
}

export interface SourceConfigurationProps {
  repositoryUrl: string;
  branchName: string;
  buildCommand: string;
  startCommand: string;
  port: number;
  connectionName: string;
}

export interface InstanceConfigurationProps {
  cpu: string;
  memory: string;
}

export interface AutoScalingConfigurationArnProps {
  maxConcurrency: number;
  maxSize: number;
  minSize: number;
}

export const stackInput: StackInput = {
  stackEnv: {
    account: "123456789012", // Your AWS Account ID
    region: "ap-northeast-1",
  },
  vpcConnectorProps: {
    vpcID: "vpc-*****************", // Your VPC ID
    subnetID1: "subnet-*****************", // Your Subnet ID
    subnetID2: "subnet-*****************", // Your Subnet ID
  },
  sourceConfigurationProps: {
    repositoryUrl: "https://github.com/go-to-k/ts-cdk-ts-managed-apprunner",
    branchName: "master",
    buildCommand: "yarn install --non-interactive --frozen-lockfile --prod && tsc index.ts",
    startCommand: "node index.js",
    port: 8080,
    connectionName: "AppRunnerConnection",
  },
  instanceConfigurationProps: {
    cpu: "1 vCPU",
    memory: "2 GB",
  },
  autoScalingConfigurationArnProps: {
    maxConcurrency: 50,
    maxSize: 3,
    minSize: 1,
  },
};

export const configStackProps: ConfigStackProps = {
  env: {
    account: stackInput.stackEnv.account,
    region: stackInput.stackEnv.region,
  },
  config: stackInput,
};
