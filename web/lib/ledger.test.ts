import { describe, expect, it } from "vitest";
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
} from "./ledger";

const tx = (over: Partial<Transaction>): Transaction => ({
  id: "1",
  type: "expense",
  amount: 100,
  category: "食費",
  date: "2024-01-01",
  memo: "",
  ...over,
});

describe("summarize", () => {
  it("computes income, expense and balance", () => {
    expect(
      summarize([tx({ type: "income", amount: 5000 }), tx({ amount: 1200 })]),
    ).toEqual({ income: 5000, expense: 1200, balance: 3800 });
  });
  it("returns zeros for empty list", () => {
    expect(summarize([])).toEqual({ income: 0, expense: 0, balance: 0 });
  });
});

describe("validateTransaction", () => {
  const ok = { type: "expense" as const, amount: 100, category: "食費", date: "2024-01-01", memo: "" };
  it("accepts valid input", () => expect(validateTransaction(ok)).toBeNull());
  it("rejects non-positive or fractional amount", () => {
    expect(validateTransaction({ ...ok, amount: 0 })).not.toBeNull();
    expect(validateTransaction({ ...ok, amount: 1.5 })).not.toBeNull();
  });
  it("rejects blank category and bad date", () => {
    expect(validateTransaction({ ...ok, category: "  " })).not.toBeNull();
    expect(validateTransaction({ ...ok, date: "" })).not.toBeNull();
  });
});

describe("sortByDateDesc", () => {
  it("sorts newest first without mutating", () => {
    const list = [tx({ id: "a", date: "2024-01-01" }), tx({ id: "b", date: "2024-02-01" })];
    expect(sortByDateDesc(list).map((t) => t.id)).toEqual(["b", "a"]);
    expect(list[0].id).toBe("a");
  });
});

describe("formatYen", () => {
  it("formats values", () => {
    expect(formatYen(1234)).toBe("¥1,234");
    expect(formatYen(-500)).toBe("-¥500");
  });
});

describe("formatAmountInput / parseAmount", () => {
  it("adds comma separators and drops non-digits", () => {
    expect(formatAmountInput("1234567")).toBe("1,234,567");
    expect(formatAmountInput("1,2a3")).toBe("123");
    expect(formatAmountInput("")).toBe("");
  });
  it("parses formatted text back to a number", () => {
    expect(parseAmount("1,234,567")).toBe(1234567);
    expect(parseAmount("")).toBe(0);
  });
});

describe("todayString", () => {
  it("returns a zero-padded local date", () => {
    expect(todayString(new Date(2024, 0, 5))).toBe("2024-01-05");
    expect(todayString(new Date(2024, 11, 31))).toBe("2024-12-31");
  });
});

describe("updateTransaction", () => {
  it("replaces only the target without mutating", () => {
    const list = [tx({ id: "a" }), tx({ id: "b", amount: 200 })];
    const next = updateTransaction(list, "a", {
      type: "income",
      amount: 999,
      category: "給与",
      date: "2024-03-01",
      memo: "更新",
    });
    expect(next[0]).toEqual({
      id: "a",
      type: "income",
      amount: 999,
      category: "給与",
      date: "2024-03-01",
      memo: "更新",
    });
    expect(next[1]).toBe(list[1]);
    expect(list[0].amount).toBe(100);
  });
});
