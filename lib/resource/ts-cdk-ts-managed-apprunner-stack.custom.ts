import {
  AppRunnerClient,
  CreateAutoScalingConfigurationCommand,
  DeleteAutoScalingConfigurationCommand,
  ListAutoScalingConfigurationsCommand,
} from "@aws-sdk/client-apprunner";
import { CdkCustomResourceEvent, CdkCustomResourceResponse } from "aws-lambda";

interface InputProps {
  autoScalingConfigurationName: string;
  maxConcurrency: number;
  maxSize: number;
  minSize: number;
}

const appRunnerClient = new AppRunnerClient({
  region: process.env.REGION,
});

export const handler = async function (
  event: CdkCustomResourceEvent,
): Promise<CdkCustomResourceResponse> {
  const data: { [key: string]: string } = {};
  const requestType = event.RequestType;
  const input: InputProps = {
    autoScalingConfigurationName: event.ResourceProperties["AutoScalingConfigurationName"],
    maxConcurrency: event.ResourceProperties["MaxConcurrency"],
    maxSize: event.ResourceProperties["MaxSize"],
    minSize: event.ResourceProperties["MinSize"],
  };

  if (requestType === "Create") {
    const createAutoScalingConfigurationCommand = new CreateAutoScalingConfigurationCommand({
      AutoScalingConfigurationName: input.autoScalingConfigurationName,
      MaxConcurrency: input.maxConcurrency,
      MaxSize: input.maxSize,
      MinSize: input.minSize,
    });

    const createAutoScalingConfigurationResponse = await appRunnerClient.send(
      createAutoScalingConfigurationCommand,
    );

    data["AutoScalingConfigurationArn"] =
      createAutoScalingConfigurationResponse.AutoScalingConfiguration
        ?.AutoScalingConfigurationArn ?? "";
  } else if (requestType === "Delete") {
    const listAutoScalingConfigurationCommand = new ListAutoScalingConfigurationsCommand({
      AutoScalingConfigurationName: input.autoScalingConfigurationName,
    });

    const listAutoScalingConfigurationsResponse = await appRunnerClient.send(
      listAutoScalingConfigurationCommand,
    );

    if (listAutoScalingConfigurationsResponse.AutoScalingConfigurationSummaryList?.length) {
      const autoScalingConfigurationArn =
        listAutoScalingConfigurationsResponse.AutoScalingConfigurationSummaryList[0]
          .AutoScalingConfigurationArn;
      const deleteAutoScalingConfigurationCommand = new DeleteAutoScalingConfigurationCommand({
        AutoScalingConfigurationArn: autoScalingConfigurationArn ?? "",
      });

      await appRunnerClient.send(deleteAutoScalingConfigurationCommand);
    }
  }

  return {
    PhysicalResourceId: "AutoScalingConfiguration",
    Data: data,
  };
};
