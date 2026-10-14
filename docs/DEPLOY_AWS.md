# AWS へのデプロイ

構成: Web = S3 + CloudFront (静的エクスポート) / API = Lambda (FastAPI + Mangum) の Function URL。

```bash
# API
cd api && pip install -r requirements.txt -t build && cp -r app build/ && (cd build && zip -r ../api.zip .)
aws s3 cp api.zip s3://<code-bucket>/api.zip

# インフラ
aws cloudformation deploy --template-file infra/template.yaml --stack-name household \
  --capabilities CAPABILITY_IAM --parameter-overrides ApiCodeBucket=<code-bucket>

# Web
cd web && npm ci && npm run build
aws s3 sync out s3://<WebBucketName> --delete
aws cloudfront create-invalidation --distribution-id <DistributionId> --paths "/*"
```

Lambda 用の依存は Linux 向けにビルドすること (必要なら `pip install --platform manylinux2014_x86_64 --only-binary=:all:`)。
現状 Web は localStorage で動作し、API は独立して動く (メモリ保存のデモ)。永続化は DynamoDB 等に差し替える。
Amplify を使う場合は `web` をアプリルートに指定し、出力ディレクトリを `out` にする。
