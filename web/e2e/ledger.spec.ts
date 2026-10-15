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
