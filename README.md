# my-household-account-

家計簿アプリ。Next.js (App Router) + FastAPI。

| ディレクトリ | 内容 |
|---|---|
| `web/` | Next.js フロント (静的エクスポート)。Vitest / Playwright |
| `api/` | FastAPI (Lambda 用 Mangum ハンドラ付き)。pytest |
| `infra/` | CloudFormation (S3 + CloudFront + Lambda) |
| `docs/` | AI 開発フロー、AWS デプロイ手順 |

## 起動

```bash
docker compose up --build   # web: http://localhost:3000 / api: http://localhost:8000/docs
```

## 開発・テスト

```bash
cd web && npm ci && npm run dev
cd web && npm test              # Vitest
cd web && npx playwright install chromium && npm run test:e2e
cd api && pip install -r requirements.txt && pytest
```

詳細: [docs/WORKFLOW.md](docs/WORKFLOW.md), [docs/DEPLOY_AWS.md](docs/DEPLOY_AWS.md)
