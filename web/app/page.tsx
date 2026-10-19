"use client";

import { useEffect, useState } from "react";
import {
  formatAmountInput,
  formatYen,
  parseAmount,
  sortByDateDesc,
  summarize,
  todayString,
  updateTransaction,
  validateTransaction,
  type Transaction,
  type TransactionType,
} from "@/lib/ledger";

const STORAGE_KEY = "household-account:transactions";

interface FormValues {
  type: TransactionType;
  amount: string;
  category: string;
  date: string;
  memo: string;
}

function emptyForm(date = ""): FormValues {
  return { type: "expense", amount: "", category: "", date, memo: "" };
}

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
  const [form, setForm] = useState<FormValues>(() => emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);

  // 静的エクスポートのため、今日の日付はブラウザーでの表示後に設定する。
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setItems(load());
    setForm(emptyForm(todayString()));
    setLoaded(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (loaded) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  function changeField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm(todayString()));
    setEditingId(null);
    setError(null);
  }

  function startEdit(t: Transaction) {
    setForm({
      type: t.type,
      amount: formatAmountInput(String(t.amount)),
      category: t.category,
      date: t.date,
      memo: t.memo,
    });
    setEditingId(t.id);
    setError(null);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((p) => p.id !== id));
    if (editingId === id) resetForm();
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const candidate = {
      type: form.type,
      amount: parseAmount(form.amount),
      category: form.category.trim(),
      date: form.date,
      memo: form.memo,
    };
    const message = validateTransaction(candidate);
    setError(message);
    if (message) return;
    if (editingId) {
      setItems((prev) => updateTransaction(prev, editingId, candidate));
    } else {
      setItems((prev) => [...prev, { ...candidate, id: crypto.randomUUID() }]);
    }
    resetForm();
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

      <form onSubmit={onSubmit} aria-label={editingId ? "取引の編集" : "取引の追加"}>
        <label>
          種別
          <select
            name="type"
            value={form.type}
            onChange={(e) => changeField("type", e.target.value as TransactionType)}
          >
            <option value="expense">支出</option>
            <option value="income">収入</option>
          </select>
        </label>
        <label>
          金額
          <input
            name="amount"
            type="text"
            inputMode="numeric"
            className="amount-input"
            value={form.amount}
            onChange={(e) => changeField("amount", formatAmountInput(e.target.value))}
          />
        </label>
        <label>
          カテゴリ
          <input
            name="category"
            type="text"
            value={form.category}
            onChange={(e) => changeField("category", e.target.value)}
          />
        </label>
        <label>
          日付
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={(e) => changeField("date", e.target.value)}
          />
        </label>
        <label>
          メモ
          <input
            name="memo"
            type="text"
            value={form.memo}
            onChange={(e) => changeField("memo", e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="submit">{editingId ? "更新" : "追加"}</button>
          {editingId && (
            <button type="button" onClick={resetForm}>
              キャンセル
            </button>
          )}
        </div>
      </form>

      <ul aria-label="取引一覧">
        {sortByDateDesc(items).map((t) => (
          <li key={t.id}>
            <span>
              {t.date} {t.category}
              {t.memo && ` (${t.memo})`}
            </span>
            <span className={`item-actions ${t.type}`}>
              <span className="item-amount">
                {t.type === "income" ? "+" : "-"}
                {formatYen(t.amount)}
              </span>
              <button
                type="button"
                aria-label={`${t.category}を編集`}
                onClick={() => startEdit(t)}
              >
                編集
              </button>
              <button
                type="button"
                aria-label={`${t.category}を削除`}
                onClick={() => removeItem(t.id)}
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
