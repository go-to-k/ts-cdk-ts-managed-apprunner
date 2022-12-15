#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { AppRunnerStack } from "../lib/resource/ts-cdk-ts-managed-apprunner-stack";
import { configStackProps } from "../lib/config";

const app = new App();

const appRunner = new AppRunnerStack(app, "AppRunnerTsStack", configStackProps);
(async () => {
  await appRunner.create();
})();
