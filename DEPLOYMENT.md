# 部署说明

## 需要你登录或授权的步骤

以下步骤涉及账号权限，必须由你本人完成或提供已登录 CLI：

1. 登录 GitHub 或安装并登录 GitHub CLI。
2. 创建或选择 Supabase 项目。
3. 获取 Supabase URL、anon key、service role key。
4. 登录 Vercel，并允许 Vercel 访问 GitHub 仓库。

## Supabase

1. 在 Supabase 创建新项目。
2. 打开 SQL Editor，执行 `supabase/migrations/0001_initial_schema.sql`。
3. 执行 `supabase/seed/seed_demo.sql` 创建演示活动。
4. 在 Authentication 中开启 Email Password 登录。
5. 在 Authentication Users 中创建管理员邮箱和密码。
6. 在 Storage 中确认存在公开 bucket：`raffle-audio`。

## Vercel

在 Vercel 项目中设置环境变量：

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RATE_LIMIT_SECRET`

部署后，将 `NEXT_PUBLIC_APP_URL` 改为 Vercel Production Domain，例如：

`https://your-project.vercel.app`

## 固定链接

后台链接：

`https://your-project.vercel.app/admin`

演示活动大屏链接：

`https://your-project.vercel.app/display/demo-event/demo-display-token`

正式活动的大屏链接以后台“复制大屏链接”为准。
