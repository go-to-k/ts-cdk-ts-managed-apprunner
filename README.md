# ts-cdk-ts-managed-apprunner

[TypeScript マネージドな App Runner を CDK で構築する](https://go-to-k.hatenablog.com/entry/ts-cdk-ts-managed-apprunner)

## 参考

[Go マネージドな App Runner を Go 版 CDK で構築する](https://go-to-k.hatenablog.com/entry/go-cdk-go-managed-apprunner)

## deploy

```sh
yarn install

# まだGitHub接続を作成していない場合は事前にシェルで作成も可能(投げずにcdk deployだけでも可能)
bash ./create_connection.sh -c AppRunnerConnection [-p profile]

# deploy
# 初回デプロイ時は、deployコマンド実行後にApp RunnerコンソールのGitHub接続ページで「ハンドシェイクを完了」というボタンを押す
yarn cdk deploy
```

## 注意

- AWS アカウントの AWS Fargate クォータ(Fargate On-Demand vCPU resource count)値により、CPU, Memory, AutoScalingConfiguration の設定値次第では更新エラーになることがあります。
  - https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-quotas.html
  - 以下のメッセージが 1 回または複数回イベントログに出力された後にサービス更新がエラーになる
    ```
    05-27-2023 01:29:08 AM [AppRunner] Failed to create App Runner instances due to low vCPU limit. Increase your Fargate On-Demand vCPU resource count and re-try.
    ```
