# my-household-account-

家計簿アプリ。Next.js (App Router) + FastAPI。

| ディレクトリ | 内容 |
|---|---|
| `web/` | Next.js フロント (静的エクスポート)。Vitest / Playwright |
| `api/` | FastAPI (Lambda 用 Mangum ハンドラ付き)。pytest |
| `infra/` | CloudFormation (S3 + CloudFront + Lambda) |
| `docs/` | AI 開発フロー、AWS デプロイ手順 |

## 開発環境の準備

VS Code で Docker を使わずに開発する場合は、次を用意します。

- Node.js 22 (npm を含む)
- Python 3.12 以降

Node.js は [公式サイト](https://nodejs.org/ja/download) から入手できます。
VS Code のターミナルでバージョンを確認します。

```bash
node --version
npm --version
python --version
```

Web の依存パッケージは、初回セットアップ時に `web` ディレクトリでインストールします。

```bash
cd web
npm ci
```

- `npm ci`: `package-lock.json` に記録された依存関係をインストールします。通常はこちらを使います。
- `npm install`: 依存パッケージの追加・更新時に使います。更新後は `package-lock.json` もコミットします。

Docker Compose の場合、Web の依存パッケージはイメージのビルド時にインストールされます。
そのため、ホスト側で `npm ci` を実行する必要はありません。

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

Web と API を VS Code の別々のターミナルで起動します。Docker Compose は起動しないでください。

#### Web

初回のみ、依存パッケージをインストールします。

```bash
cd web
npm ci
```

起動するたびに、`web` ディレクトリで次を実行します。

```bash
npm run dev
```

#### API (Git Bash)

初回のみ、仮想環境を作成して依存パッケージをインストールします。

```bash
cd api
python -m venv .venv
source .venv/Scripts/activate
python -m pip install -r requirements.txt
```

起動するたびに、`api` ディレクトリで仮想環境を有効化してからAPIを起動します。

```bash
source .venv/Scripts/activate
python -m uvicorn app.main:app --reload --port 8000
```

Windows PowerShell を使う場合は、`api` ディレクトリで次を実行します。

```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

起動中は両方のターミナルを開いたままにします。Web は http://localhost:3000、API ドキュメントは http://localhost:8000/docs です。停止するときは各ターミナルで `Ctrl+C` を押します。

## 開発・テスト

```bash
cd web && npm ci && npm run dev
cd web && npm test              # Vitest
cd web && npx playwright install chromium && npm run test:e2e
cd api && pip install -r requirements.txt && pytest
```

詳細: [docs/WORKFLOW.md](docs/WORKFLOW.md), [docs/DEPLOY_AWS.md](docs/DEPLOY_AWS.md)
