# my-household-account-

家計簿アプリ。Next.js (App Router) + FastAPI。

| ディレクトリ | 内容 |
|---|---|
| `web/` | Next.js フロント (静的エクスポート)。Vitest / Playwright |
| `api/` | FastAPI (Lambda 用 Mangum ハンドラ付き)。pytest |
| `infra/` | CloudFormation (S3 + CloudFront + Lambda) |
| `docs/` | AI 開発フロー、AWS デプロイ手順 |

## 前提

- Node.js 22 (npm を含む)
- Python 3.12 以降
- Docker Desktop (Docker Compose で起動する場合のみ)

```bash
node --version
npm --version
python --version
```

## 起動

開発時はローカル起動を使う。ソース変更が自動で反映される。
Docker Compose はビルド済みの状態をまとめて確認する用途で、ソース変更の反映には再ビルドが必要。

### ローカル起動 (開発用)

Web と API を別々のターミナルで起動する。Docker Compose が起動中の場合は先に `docker compose down` で停止する。

#### Web

```bash
cd web
npm ci          # 初回のみ
npm run dev
```

- URL: http://localhost:3000
- `npm ci` は `package-lock.json` どおりに依存関係を入れる。依存の追加・更新時は `npm install` を使い、`package-lock.json` も変更対象に含める。

#### API

初回のみ、仮想環境の作成と依存関係のインストールを行う。

```bash
cd api
python -m venv .venv
source .venv/Scripts/activate      # PowerShell: .\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

起動のたびに、仮想環境を有効化してから起動する。

```bash
cd api
source .venv/Scripts/activate      # PowerShell: .\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

- API ドキュメント: http://localhost:8000/docs
- ヘルスチェック: http://localhost:8000/health

停止は各ターミナルで `Ctrl+C`。

### Docker Compose

1. Docker Desktop を起動し、Docker Engine の起動完了を待つ
2. リポジトリのルートで実行する

```bash
docker compose up --build        # フォアグラウンド。停止は Ctrl+C
docker compose up --build -d     # バックグラウンド
docker compose down              # 停止・削除
```

- Web: http://localhost:3000
- API ドキュメント: http://localhost:8000/docs
- 初回はイメージ取得とビルドに時間がかかる
- Web の依存関係はイメージのビルド時に入るため、ホスト側の `npm ci` は不要
- `failed to connect to the docker API` が出た場合は Docker Desktop の起動を確認して再実行する

## テスト

```bash
cd web && npm test                                              # Vitest
cd web && npx playwright install chromium && npm run test:e2e   # Playwright (初回のみ install)
cd api && python -m pytest                                      # pytest (仮想環境を有効化して実行)
```

詳細: [docs/WORKFLOW.md](docs/WORKFLOW.md), [docs/DEPLOY_AWS.md](docs/DEPLOY_AWS.md)
