#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { AppRunnerStack } from "../lib/resource/ts-cdk-ts-managed-apprunner-stack";
import { configStackProps } from "../lib/config";

const app = new App();

new AppRunnerStack(app, "AppRunnerStack", configStackProps);
