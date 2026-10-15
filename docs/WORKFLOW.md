# AI 開発フロー (仕様 → 実装 → テスト → レビュー)

Cursor / GitHub Copilot などで機能を追加するときの手順。

1. **仕様**: `docs/specs/<feature>.md` に目的・入出力・受け入れ条件を書く (AI に下書きさせて人間が確認)。
2. **実装**: 仕様ファイルを AI に渡し、`web/lib` (純粋ロジック) → `web/app` (UI) → `api/app` の順に実装させる。
3. **テスト**: 受け入れ条件を Vitest (`web/lib/*.test.ts`)、pytest (`api/tests`)、Playwright (`web/e2e`) に落とす。
4. **レビュー**: AI のレビュー (Copilot code review 等) → 人間レビュー。CI (`.github/workflows/ci.yml`) が通ること。
