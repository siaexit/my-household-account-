export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  memo: string;
}

export interface Summary {
  income: number;
  expense: number;
  balance: number;
}

export type NewTransaction = Omit<Transaction, "id">;

export function validateTransaction(input: NewTransaction): string | null {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    return "金額は1以上の整数で入力してください";
  }
  if (!input.category.trim()) {
    return "カテゴリを入力してください";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return "日付を入力してください";
  }
  return null;
}

export function summarize(transactions: Transaction[]): Summary {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, balance: income - expense };
}

export function sortByDateDesc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) =>
    a.date === b.date ? 0 : a.date < b.date ? 1 : -1,
  );
}

export function formatYen(value: number): string {
  return `${value < 0 ? "-" : ""}¥${Math.abs(value).toLocaleString("ja-JP")}`;
}
