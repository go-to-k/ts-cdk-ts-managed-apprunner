# ts-cdk-ts-managed-apprunner

[TypeScript マネージドな App Runner を CDK で構築する](https://go-to-k.hatenablog.com/entry/ts-cdk-ts-managed-apprunner)

```sh
yarn install

# If you did not create any GitHub Connections yet.
bash ./create_connection.sh -c AppRunnerConnection
### if specify a profile
# bash ./create_connection.sh -c AppRunnerConnection -p profile

# Then, click the Complete HANDSHAKE button at your AWS App Runner console.

# deploy
yarn run cdk deploy
```
