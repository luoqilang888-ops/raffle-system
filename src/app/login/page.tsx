import { LoginForm } from "@/components/admin/LoginForm";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <Card className="w-full max-w-md">
        <p className="text-sm font-semibold text-amber-600">管理员登录</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          进入会场抽奖后台
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          使用 Supabase Auth 中创建的管理员邮箱和密码登录。
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </Card>
    </main>
  );
}
