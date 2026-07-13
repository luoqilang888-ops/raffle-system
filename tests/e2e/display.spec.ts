import { expect, test } from "@playwright/test";

test("display page hides admin controls and ball labels", async ({ page }) => {
  await page.goto("/display/demo-event/demo-display-token");
  await expect(page.getByText("开始抽奖")).toHaveCount(0);
  await expect(page.getByText("停止抽奖")).toHaveCount(0);
  await expect(page.getByText("第一组")).toHaveCount(0);
  await expect(page.getByTestId("lottery-canvas")).toBeVisible();
});

test("admin demo page exposes editable prize names", async ({ page }) => {
  await page.goto("/admin/demo-event/prizes");
  await expect(page.getByText("奖项设置（可编辑）")).toBeVisible();
  await expect(page.locator('input[value="幸运奖"]')).toBeVisible();
});
