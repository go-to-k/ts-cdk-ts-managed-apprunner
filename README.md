# ts-cdk-ts-managed-apprunner

[TypeScript マネージドな App Runner を CDK で構築する](https://go-to-k.hatenablog.com/entry/ts-cdk-ts-managed-apprunner)

## deploy

```sh
yarn install

# If you did not create any GitHub Connections yet. If you want to specify a profile, use `-p` option.
bash ./create_connection.sh -c AppRunnerConnection [-p profile]

# Before deploy, click the "Complete HANDSHAKE" button at your AWS App Runner console.

# deploy
yarn cdk deploy
```
