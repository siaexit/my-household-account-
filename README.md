# my-household-account-

家計簿アプリ。Next.js (App Router) + FastAPI。

| ディレクトリ | 内容 |
|---|---|
| `web/` | Next.js フロント (静的エクスポート)。Vitest / Playwright |
| `api/` | FastAPI (Lambda 用 Mangum ハンドラ付き)。pytest |
| `infra/` | CloudFormation (S3 + CloudFront + Lambda) |
| `docs/` | AI 開発フロー、AWS デプロイ手順 |

## 起動

### Docker Compose を使う場合

1. Docker Desktop を起動し、画面上で Docker Engine が起動完了するまで待ちます。
2. このリポジトリのルート (この README と `docker-compose.yml` がある場所) で、次を実行します。

```bash
docker compose up --build
```

初回は Docker イメージや依存パッケージを取得してビルドするため、完了まで時間がかかることがあります。

- Web アプリ: http://localhost:3000
- FastAPI ドキュメント: http://localhost:8000/docs
- API ヘルスチェック: http://localhost:8000/health

起動中のログを表示したまま使う場合は、そのターミナルを開いたままにします。停止するときは同じターミナルで `Ctrl+C` を押します。バックグラウンドで起動する場合は `docker compose up --build -d` を使い、停止時はリポジトリのルートで次を実行します。

```bash
docker compose down
```

`failed to connect to the docker API` や `dockerDesktopLinuxEngine` が見つからないエラーが出た場合は、Docker Desktop が起動していることを確認してから、コマンドを再実行してください。

### Docker を使わずに起動する場合

Web と API を別々のターミナルで起動します。

Web:

```bash
cd web
npm ci
npm run dev
```

API (Git Bash):

```bash
cd api
python -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API の仮想環境を有効化した後は、Web と API をそれぞれのターミナルで実行したままにします。Windows PowerShell では仮想環境の有効化に `.\.venv\Scripts\Activate.ps1` を使います。

## 開発・テスト

```bash
cd web && npm ci && npm run dev
cd web && npm test              # Vitest
cd web && npx playwright install chromium && npm run test:e2e
cd api && pip install -r requirements.txt && pytest
```

詳細: [docs/WORKFLOW.md](docs/WORKFLOW.md), [docs/DEPLOY_AWS.md](docs/DEPLOY_AWS.md)
