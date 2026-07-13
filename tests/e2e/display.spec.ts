import { expect, test, type BrowserContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

function readLocalEnv(key: string) {
  const env = process.env[key];
  if (env) return env;
  if (!fs.existsSync(".env.local")) return undefined;
  const match = fs.readFileSync(".env.local", "utf8").match(new RegExp(`^${key}=(.*)$`, "m"));
  return match?.[1]?.trim();
}

async function addAdminSessionCookie(
  context: BrowserContext,
  email: string,
  password: string,
) {
  const supabaseUrl = readLocalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = readLocalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase public env for E2E admin login.");
  }

  const storageKey = `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(error?.message ?? "E2E admin login failed.");
  }

  await context.addCookies([
    {
      name: storageKey,
      value: `base64-${Buffer.from(JSON.stringify(data.session)).toString("base64url")}`,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: false,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 60 * 60,
    },
  ]);
}

test("display page hides admin controls and ball labels", async ({ page }) => {
  await page.goto("/display/demo-event/demo-display-token");
  await expect(page.getByText("开始抽奖")).toHaveCount(0);
  await expect(page.getByText("停止抽奖")).toHaveCount(0);
  await expect(page.getByText("第一组")).toHaveCount(0);
  await expect(page.getByTestId("lottery-canvas")).toBeVisible();
});

test("admin demo page exposes editable prize names", async ({ page, context }) => {
  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    test.skip(
      true,
      "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to test private admin pages.",
    );
    return;
  }

  await addAdminSessionCookie(context, adminEmail, adminPassword);

  await page.goto("/admin/demo-event/prizes");
  await expect(page.getByText("奖项设置（可编辑）")).toBeVisible();
  await expect(page.locator('input[value="幸运奖"]').first()).toBeVisible();
});
