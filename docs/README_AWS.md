# AWS セットアップガイド

このガイドは、家計簿アプリのAPIを AWS Lambda (FastAPI + Mangum) に配置し、Function URL で公開する手順をまとめる。CloudFormation テンプレートはWeb用のS3バケットとCloudFrontも作成する。

## 今回のデプロイ実績

- リージョン: アジアパシフィック (シドニー) `ap-southeast-2`
- Lambda用コードバケット: `fd-lambda-deploy-ap-southeast-2`
- CloudFormationスタック: `household`
- Lambda関数: `household-ApiFunction-6b76ET2dEFF2`
- Webバケット: `household-webbucket-36mareuenbi8`
- CloudFrontディストリビューション: `E2OGP3ML8GUK85`
- API URL: `https://d2q7iswigigu3qtfldqusagqmi0xfmra.lambda-url.ap-southeast-2.on.aws/`
- Web URL: `https://d3m3upxijmtxht.cloudfront.net`

フロントエンドは最初にHTML等をアップロードした際、`_next/` が不足してJavaScriptとCSSが403になった。その後 `_next/` のファイルを追加し、CloudFrontの `/*` を無効化して解消した。公開ページでも日付初期値、金額のカンマ区切り・右寄せ、取引の登録・集計・削除を確認済み。確認用取引は削除済み。

## 構成と注意点

- API: AWS Lambda / Python 3.12 / x86_64 / Function URL
- Web: S3 静的ホスティング相当 + CloudFront
- インフラ作成: CloudFormation (`infra/template.yaml`)
- 現状、Web画面はAPIを呼び出さず `localStorage` を使用する。APIは別に動作するデモ
- APIのデータ保存先はメモリ。Lambdaの再利用や再起動でデータが失われるため、実データには使わない
- Function URL は `AuthType: NONE` で公開される。URLを知る人は認証なしでAPIを呼び出せるため、動作確認用に限定する

## 必要なもの

- AWSアカウントと、Lambda・S3・CloudFormation・IAM・CloudFrontを操作できる権限
- AWS CLI v2
- Python 3.12
- Windowsでは PowerShell、macOS/Linuxでは Bash
- デプロイ対象のGitリポジトリ

AWS認証情報はリポジトリやREADMEに記載しない。アクセスキーはAWS CLIの設定画面に直接入力する。

## 1. AWS CLIの設定

AWS CLIのインストール後、プロファイルを作成する。

```bash
aws configure --profile household
```

対話入力ではアクセスキー、シークレットアクセスキー、リージョン `ap-southeast-2`、出力形式を入力する。入力内容は端末内のAWS CLI設定に保存される。

```bash
aws sts get-caller-identity --profile household
```

アカウント情報が表示されれば認証確認完了。以下ではリージョンを `ap-southeast-2`、プロファイルを `household` とする。IAMはグローバルサービス、CloudFrontはグローバルな配信サービス。S3バケット、Lambda、CloudFormationスタックは `ap-southeast-2` に揃える。

## 2. Lambda用パッケージの作成

LambdaはLinux環境で動くため、Windowsで通常の `pip install` を行ったパッケージをそのままZIPにしない。次の手順では、pipのプラットフォーム指定でPython 3.12・Linux x86_64向けのwheelを取得する。

コマンドはリポジトリのルートで実行する。作業ディレクトリ `api/build` とZIPファイルは生成物なので、再作成時に削除しても問題ないことを確認する。

### Windows PowerShell

```powershell
if (Test-Path api/build) { Remove-Item api/build -Recurse -Force }
New-Item -ItemType Directory api/build | Out-Null
python -m pip install -r api/requirements.txt --target api/build --platform manylinux2014_x86_64 --python-version 3.12 --implementation cp --abi cp312 --only-binary=:all:
Copy-Item api/app api/build/app -Recurse
Compress-Archive -Path api/build/* -DestinationPath api/api.zip -Force
```

### macOS / Linux Bash

```bash
rm -rf api/build api/api.zip
mkdir -p api/build
python3 -m pip install -r api/requirements.txt --target api/build --platform manylinux2014_x86_64 --python-version 3.12 --implementation cp --abi cp312 --only-binary=:all:
cp -R api/app api/build/app
python3 -c 'from pathlib import Path; from zipfile import ZipFile, ZIP_DEFLATED; root=Path("api/build"); archive=ZipFile("api/api.zip", "w", ZIP_DEFLATED); [archive.write(path, path.relative_to(root)) for path in root.rglob("*") if path.is_file() and "__pycache__" not in path.parts and path.suffix != ".pyc"]; archive.close()'
```

Git Bashで `python3` が見つからない場合は、コマンド中の `python3` を `python` に置き換える。`zip` コマンドがない環境でもPython標準ライブラリでZIPを作成できる。

作成したZIPには `app/main.py` と依存パッケージがZIP直下に含まれる。CloudFormationのハンドラー `app.main.handler` と一致することを確認する。

## 3. コード用S3バケットの作成とアップロード

バケット名はAWS全体で一意にする。例の `your-unique-code-bucket-12345` は、自分で決めた小文字・数字・ハイフンの名前に置き換える。

```bash
aws s3 mb s3://your-unique-code-bucket-12345 --region ap-southeast-2 --profile household
aws s3 cp api/api.zip s3://your-unique-code-bucket-12345/api.zip --region ap-southeast-2 --profile household
```

## 4. CloudFormationでインフラを作成

リポジトリのルートで実行する。`ApiCodeBucket` には手順3で使ったバケット名を指定する。

```bash
aws cloudformation deploy --template-file infra/template.yaml --stack-name household --region ap-southeast-2 --profile household --capabilities CAPABILITY_IAM --parameter-overrides ApiCodeBucket=your-unique-code-bucket-12345
```

スタック作成には数分かかる。完了後、API URL・Webバケット名・CloudFront情報を確認する。

```bash
aws cloudformation describe-stacks --stack-name household --region ap-southeast-2 --profile household --query "Stacks[0].Outputs" --output table
```

### AWSコンソールから作成する場合

1. リージョンをアジアパシフィック (シドニー) `ap-southeast-2` にする。
2. CloudFormationで「スタックの作成」→「新しいリソースを使用 (標準)」を選び、`infra/template.yaml` をアップロードする。
3. スタック名に `household` を入力する。
4. `ApiCodeBucket` に `fd-lambda-deploy-ap-southeast-2`、`ApiCodeKey` に `api.zip` を指定する。
5. スタックオプションは変更せず進み、確認画面でIAMリソース作成を承認してスタックを作成する。
6. スタックの状態が `CREATE_COMPLETE` になったら「出力」タブを開き、`ApiUrl`、`SiteUrl`、`WebBucketName`、`DistributionId` を記録する。

実行ユーザーには、スタック作成に必要なCloudFormation、S3、Lambda、IAM、CloudFrontの権限が必要。`IAMFullAccess` などの強い権限を一時利用する場合も、スタックの更新・削除を終えるまで外さない。アクセスキーやパスワードはドキュメントに記録しない。

## 5. APIの動作確認

出力された `ApiUrl` の末尾に `/health` を付けて実行する。

```bash
curl.exe https://<ApiUrlのホスト名>/health
```

次の応答が返れば疎通確認完了。

```json
{"status":"ok"}
```

`ApiUrl` を開けない場合は、CloudFormationスタックの状態が `CREATE_COMPLETE` か、Lambdaの実行ログにエラーがないか確認する。

## 6. Webのデプロイ (必要な場合)

この手順はAPIの動作確認には不要。現状のWebはAPIへ接続しないが、静的サイトとして公開できる。

```bash
cd web
npm ci
npm run build
cd ..
```

CloudFormation Outputsの `WebBucketName` と `DistributionId` を使い、リポジトリのルートで実行する。

```bash
aws s3 sync web/out s3://<WebBucketName> --delete --region ap-southeast-2 --profile household
aws cloudfront create-invalidation --distribution-id <DistributionId> --paths "/*" --profile household
```

S3コンソールからアップロードする場合は、`web/out` フォルダー自体ではなく、その中身をすべてバケット直下へ配置する。`index.html` と `_next/` がバケット直下にあることを確認する。`_next/` を含めずにHTMLだけ配置すると、JavaScriptやCSSが読み込めず、フォームや表示が正しく動かない。

今回、最初のアップロードではHTML等の9ファイルだけが配置され、`_next/` が不足していた。`web/out/_next/` の123ファイルを追加し、CloudFrontディストリビューション `E2OGP3ML8GUK85` で `/*` を無効化して解消した。アップロード後に表示が古い場合やスクリプトが403になる場合は、S3上のファイル配置とCloudFrontのキャッシュ無効化を確認する。

公開URLはCloudFormation Outputsの `SiteUrl`。

## 別PCでの再現性

- Node.js依存は `web/package-lock.json` と `npm ci` により、同じロックファイルのバージョンを導入する
- APIの `api/requirements.txt` は現状 `>=` 指定のため、時間が経つと別バージョンが選ばれる可能性がある。完全に同じ依存関係を再現するには、依存バージョンを固定したロックファイルの導入が必要
- AWSアカウント、リージョン、CLIプロファイル、S3バケット名が異なるPCでは、それぞれの値を自分の環境に合わせる
- AWS権限と外部ネットワーク接続が必要。IAM認証情報はPC間で共有せず、それぞれの利用者・環境に設定する

## 削除と費用

動作確認後にAWSリソースが不要になったら削除する。Webバケットが空でないとCloudFormationスタックを削除できないため、先に中身を空にする。

```bash
aws s3 rm s3://<WebBucketName> --recursive --region ap-southeast-2 --profile household
aws cloudformation delete-stack --stack-name household --region ap-southeast-2 --profile household
```

スタック削除完了後、Lambda ZIPを置いたコード用バケットも空にして削除する。

```bash
aws s3 rm s3://your-unique-code-bucket-12345 --recursive --region ap-southeast-2 --profile household
aws s3 rb s3://your-unique-code-bucket-12345 --region ap-southeast-2 --profile household
```

S3・Lambdaの利用量、CloudFrontの転送量などに応じて料金が発生する。検証前にAWS Budgetsで予算アラートを設定する。
