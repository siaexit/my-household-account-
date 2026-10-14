"use client";

import { useEffect, useState } from "react";
import {
  formatYen,
  sortByDateDesc,
  summarize,
  validateTransaction,
  type Transaction,
  type TransactionType,
} from "@/lib/ledger";

const STORAGE_KEY = "household-account:transactions";

function load(): Transaction[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Transaction[]) : [];
  } catch {
    return [];
  }
}

export default function Home() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(load());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const candidate = {
      type: data.get("type") as TransactionType,
      amount: Number(data.get("amount")),
      category: String(data.get("category") ?? ""),
      date: String(data.get("date") ?? ""),
      memo: String(data.get("memo") ?? ""),
    };
    const message = validateTransaction(candidate);
    setError(message);
    if (message) return;
    setItems((prev) => [
      ...prev,
      { ...candidate, category: candidate.category.trim(), id: crypto.randomUUID() },
    ]);
    form.reset();
  }

  const summary = summarize(items);

  return (
    <main>
      <h1>家計簿</h1>
      <dl className="summary">
        <div>
          <dt>収入</dt>
          <dd data-testid="income">{formatYen(summary.income)}</dd>
        </div>
        <div>
          <dt>支出</dt>
          <dd data-testid="expense">{formatYen(summary.expense)}</dd>
        </div>
        <div>
          <dt>残高</dt>
          <dd data-testid="balance">{formatYen(summary.balance)}</dd>
        </div>
      </dl>

      <form onSubmit={onSubmit} aria-label="取引の追加">
        <label>
          種別
          <select name="type" defaultValue="expense">
            <option value="expense">支出</option>
            <option value="income">収入</option>
          </select>
        </label>
        <label>
          金額
          <input name="amount" type="number" min="1" step="1" />
        </label>
        <label>
          カテゴリ
          <input name="category" type="text" />
        </label>
        <label>
          日付
          <input name="date" type="date" />
        </label>
        <label>
          メモ
          <input name="memo" type="text" />
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button type="submit">追加</button>
      </form>

      <ul aria-label="取引一覧">
        {sortByDateDesc(items).map((t) => (
          <li key={t.id}>
            <span>
              {t.date} {t.category}
              {t.memo && ` (${t.memo})`}
            </span>
            <span className={t.type}>
              {t.type === "income" ? "+" : "-"}
              {formatYen(t.amount)}{" "}
              <button
                type="button"
                aria-label={`${t.category}を削除`}
                onClick={() => setItems((prev) => prev.filter((p) => p.id !== t.id))}
              >
                削除
              </button>
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
