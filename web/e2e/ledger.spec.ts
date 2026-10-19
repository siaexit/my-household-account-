import { expect, test } from "@playwright/test";

test("add and delete a transaction", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("種別").selectOption("income");
  await page.getByLabel("金額").fill("5000");
  await page.getByLabel("カテゴリ").fill("給与");
  await page.getByLabel("日付").fill("2024-01-10");
  await page.getByRole("button", { name: "追加" }).click();

  await page.getByLabel("種別").selectOption("expense");
  await page.getByLabel("金額").fill("1200");
  await page.getByLabel("カテゴリ").fill("食費");
  await page.getByLabel("日付").fill("2024-01-11");
  await page.getByRole("button", { name: "追加" }).click();

  await expect(page.getByTestId("income")).toHaveText("¥5,000");
  await expect(page.getByTestId("expense")).toHaveText("¥1,200");
  await expect(page.getByTestId("balance")).toHaveText("¥3,800");

  await page.getByRole("button", { name: "食費を削除" }).click();
  await expect(page.getByTestId("balance")).toHaveText("¥5,000");
});

test("shows validation error", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "追加" }).click();
  await expect(page.getByText("金額は1以上の整数で入力してください")).toBeVisible();
});

test("persists after reload", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("金額").fill("300");
  await page.getByLabel("カテゴリ").fill("交通");
  await page.getByLabel("日付").fill("2024-02-01");
  await page.getByRole("button", { name: "追加" }).click();
  await page.reload();
  await expect(page.getByTestId("expense")).toHaveText("¥300");
});

test("defaults date to today", async ({ page }) => {
  await page.goto("/");
  const today = await page.evaluate(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
  });
  await expect(page.getByLabel("日付")).toHaveValue(today);
});

test("formats amount with commas and right-aligns it", async ({ page }) => {
  await page.goto("/");
  const amount = page.getByLabel("金額");
  await amount.fill("1234567");
  await expect(amount).toHaveValue("1,234,567");
  await expect(amount).toHaveCSS("text-align", "right");
});

test("edits and updates a transaction", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("金額").fill("1200");
  await page.getByLabel("カテゴリ").fill("食費");
  await page.getByLabel("日付").fill("2024-01-11");
  await page.getByRole("button", { name: "追加" }).click();

  await page.getByRole("button", { name: "食費を編集" }).click();
  await expect(page.getByLabel("金額")).toHaveValue("1,200");
  await expect(page.getByLabel("カテゴリ")).toHaveValue("食費");

  await page.getByLabel("金額").fill("3500");
  await page.getByLabel("カテゴリ").fill("外食");
  await page.getByRole("button", { name: "更新" }).click();

  await expect(page.getByTestId("expense")).toHaveText("¥3,500");
  await expect(page.getByRole("button", { name: "外食を編集" })).toBeVisible();
  await expect(page.getByRole("button", { name: "食費を編集" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "追加" })).toBeVisible();
});
