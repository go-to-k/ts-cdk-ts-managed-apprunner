import {
  ConfigurationSourceType,
  Cpu,
  GitHubConnection,
  Memory,
  Runtime as appRunnerRuntime,
  Service,
  Source,
  VpcConnector,
} from "@aws-cdk/aws-apprunner-alpha";
import { AppRunnerClient, ListConnectionsCommand } from "@aws-sdk/client-apprunner";
import { CfnOutput, CustomResource, Duration, Stack } from "aws-cdk-lib";
import { CfnService, CfnVpcConnector } from "aws-cdk-lib/aws-apprunner";
import { SecurityGroup, Vpc, Subnet } from "aws-cdk-lib/aws-ec2";
import { PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Provider } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { ConfigStackProps, StackInput } from "../config";

export class AppRunnerStack extends Stack {
  private stackInput: StackInput;

  constructor(scope: Construct, id: string, props: ConfigStackProps) {
    super(scope, id, props);

    this.stackInput = props.config;

    (async () => {
      await this.create();
    })();
  }

  private async create() {
    /*
      Custom Resource Lambda for creation of AutoScalingConfiguration
     */
    const customResourceLambda = new NodejsFunction(this, "custom", {
      runtime: Runtime.NODEJS_16_X,
      bundling: {
        forceDockerBundling: false,
      },
      timeout: Duration.seconds(900),
      initialPolicy: [
        new PolicyStatement({
          actions: [
            "apprunner:*AutoScalingConfiguration*",
            "apprunner:UpdateService",
            "apprunner:ListOperations",
          ],
          resources: ["*"],
        }),
        new PolicyStatement({
          actions: ["cloudformation:DescribeStacks"],
          resources: [this.stackId],
        }),
      ],
    });

    /*
      AutoScalingConfiguration
    */
    const autoScalingConfigurationProvider = new Provider(
      this,
      "AutoScalingConfigurationProvider",
      {
        onEventHandler: customResourceLambda,
      },
    );

    const autoScalingConfigurationProperties: { [key: string]: string } = {};
    autoScalingConfigurationProperties["AutoScalingConfigurationName"] = this.stackName;
    autoScalingConfigurationProperties["MaxConcurrency"] = String(
      this.stackInput.autoScalingConfigurationArnProps.maxConcurrency,
    );
    autoScalingConfigurationProperties["MaxSize"] = String(
      this.stackInput.autoScalingConfigurationArnProps.maxSize,
    );
    autoScalingConfigurationProperties["MinSize"] = String(
      this.stackInput.autoScalingConfigurationArnProps.minSize,
    );
    autoScalingConfigurationProperties["StackName"] = this.stackName;

    const autoScalingConfiguration = new CustomResource(this, "AutoScalingConfiguration", {
      resourceType: "Custom::AutoScalingConfiguration",
      properties: autoScalingConfigurationProperties,
      serviceToken: autoScalingConfigurationProvider.serviceToken,
    });
    const autoScalingConfigurationArn = autoScalingConfiguration.getAttString(
      "AutoScalingConfigurationArn",
    );

    /*
      ConnectionArn for GitHub Connection
    */
    const connectionArn = await this.getConnection(
      this.stackInput.sourceConfigurationProps.connectionName,
      this.stackInput.stackEnv.region,
    );

    /*
      InstanceRole for AppRunner Service
    */
    const appRunnerInstanceRole = new Role(this, "AppRunnerInstanceRole", {
      assumedBy: new ServicePrincipal("tasks.apprunner.amazonaws.com"),
    });

    /*
      L2 Construct(alpha version) for VPC Connector
	  */
    const vpc = Vpc.fromLookup(this, "VPCForSecurityGroupForVpcConnectorL2", {
      vpcId: this.stackInput.vpcConnectorProps.vpcID,
    });

    const securityGroupForVpcConnectorL2 = new SecurityGroup(
      this,
      "SecurityGroupForVpcConnectorL2",
      {
        vpc: vpc,
        description: "for AppRunner VPC Connector L2",
      },
    );

    const vpcConnectorL2 = new VpcConnector(this, "VpcConnectorL2", {
      vpc: vpc,
      securityGroups: [securityGroupForVpcConnectorL2],
      vpcSubnets: {
        subnets: [
          Subnet.fromSubnetId(this, "Subnet1", this.stackInput.vpcConnectorProps.subnetID1),
          Subnet.fromSubnetId(this, "Subnet2", this.stackInput.vpcConnectorProps.subnetID2),
        ],
      },
    });

    /*
      L1 Construct for VPC Connector
    */
    const securityGroupForVpcConnectorL1 = new SecurityGroup(
      this,
      "SecurityGroupForVpcConnectorL1",
      {
        vpc: vpc,
        description: "for AppRunner VPC Connector L1",
      },
    );

    const vpcConnectorL1 = new CfnVpcConnector(this, "VpcConnectorL1", {
      securityGroups: [securityGroupForVpcConnectorL1.securityGroupId],
      subnets: [
        this.stackInput.vpcConnectorProps.subnetID1,
        this.stackInput.vpcConnectorProps.subnetID2,
      ],
    });

    /*
      L2 Construct(alpha version) for AppRunner Service
    */
    const appRunnerServiceEnvironment: { [key: string]: string } = {};
    appRunnerServiceEnvironment["ENV1"] = "L2";

    const appRunnerServiceL2 = new Service(this, "AppRunnerServiceL2", {
      instanceRole: appRunnerInstanceRole,
      source: Source.fromGitHub({
        repositoryUrl: this.stackInput.sourceConfigurationProps.repositoryUrl,
        branch: this.stackInput.sourceConfigurationProps.branchName,
        configurationSource: ConfigurationSourceType.API,
        codeConfigurationValues: {
          runtime: appRunnerRuntime.NODEJS_16,
          port: String(this.stackInput.sourceConfigurationProps.port),
          startCommand: this.stackInput.sourceConfigurationProps.startCommand,
          buildCommand: this.stackInput.sourceConfigurationProps.buildCommand,
          environment: appRunnerServiceEnvironment,
        },
        connection: GitHubConnection.fromConnectionArn(connectionArn),
      }),
      cpu: Cpu.of(this.stackInput.instanceConfigurationProps.cpu),
      memory: Memory.of(this.stackInput.instanceConfigurationProps.memory),
      vpcConnector: vpcConnectorL2,
      autoDeploymentsEnabled: true,
    });

    const cfnAppRunner = appRunnerServiceL2.node.defaultChild as CfnService;
    cfnAppRunner.autoScalingConfigurationArn = autoScalingConfigurationArn;
    cfnAppRunner.healthCheckConfiguration = {
      path: "/",
      protocol: "HTTP",
    };

    /*
      L1 Construct for AppRunner Service
    */
    const appRunnerServiceL1 = new CfnService(this, "AppRunnerServiceL1", {
      sourceConfiguration: {
        autoDeploymentsEnabled: true,
        authenticationConfiguration: {
          connectionArn: connectionArn,
        },
        codeRepository: {
          repositoryUrl: this.stackInput.sourceConfigurationProps.repositoryUrl,
          sourceCodeVersion: {
            type: "BRANCH",
            value: this.stackInput.sourceConfigurationProps.branchName,
          },
          codeConfiguration: {
            configurationSource: "API",
            codeConfigurationValues: {
              runtime: "NODEJS_16",
              port: String(this.stackInput.sourceConfigurationProps.port),
              startCommand: this.stackInput.sourceConfigurationProps.startCommand,
              buildCommand: this.stackInput.sourceConfigurationProps.buildCommand,
              runtimeEnvironmentVariables: [
                {
                  name: "ENV1",
                  value: "L1",
                },
              ],
            },
          },
        },
      },
      healthCheckConfiguration: {
        path: "/",
        protocol: "HTTP",
      },
      instanceConfiguration: {
        cpu: this.stackInput.instanceConfigurationProps.cpu,
        memory: this.stackInput.instanceConfigurationProps.memory,
        instanceRoleArn: appRunnerInstanceRole.roleArn,
      },
      networkConfiguration: {
        egressConfiguration: {
          egressType: "VPC",
          vpcConnectorArn: vpcConnectorL1.attrVpcConnectorArn,
        },
      },
      autoScalingConfigurationArn: autoScalingConfigurationArn,
    });

    new CfnOutput(this, "AppRunnerServiceL2ServiceArn", {
      value: appRunnerServiceL2.serviceArn,
      exportName: `${this.stackName}AppRunnerServiceL2ServiceArn`,
    });

    new CfnOutput(this, "AppRunnerServiceL1ServiceArn", {
      value: appRunnerServiceL1.attrServiceArn,
      exportName: `${this.stackName}AppRunnerServiceL1ServiceArn`,
    });
  }

  private async getConnection(connectionName: string, region: string): Promise<string> {
    try {
      const appRunnerClient = new AppRunnerClient({
        region: region,
      });

      const listConnectionsCommand = new ListConnectionsCommand({
        ConnectionName: connectionName,
      });

      const listConnectionsResponse = await appRunnerClient.send(listConnectionsCommand);

      if (
        !listConnectionsResponse.ConnectionSummaryList?.length ||
        listConnectionsResponse.ConnectionSummaryList[0].Status === "PENDING_HANDSHAKE"
      ) {
        console.error("GitHub Connection is PENDING_HANDSHAKE or not exist.");
        console.error("Do the next steps.");
        console.error("1. Run the shell script.");
        console.error("# bash ./create_connection.sh -c AppRunnerConnection");
        console.error("# bash ./create_connection.sh -c AppRunnerConnection -p profile");
        console.error("2. Click the Complete HANDSHAKE button at your AWS App Runner console.");
        console.error();
        throw new Error("GitHubConnectionError");
      }

      return listConnectionsResponse.ConnectionSummaryList[0].ConnectionArn ?? "";
    } catch (err) {
      throw err;
    }
  }
}
