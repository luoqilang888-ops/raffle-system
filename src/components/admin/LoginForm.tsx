"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { hasSupabasePublicEnv } from "@/lib/env";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const canUseAuth = hasSupabasePublicEnv();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formEmail = String(formData.get("email") ?? email);
    const formPassword = String(formData.get("password") ?? password);
    setLoading(true);
    setMessage("");

    if (!canUseAuth) {
      router.push("/admin");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: formEmail,
      password: formPassword,
    });
    setLoading(false);
    if (error) {
      setMessage("登录失败，请检查邮箱和密码。");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          管理员邮箱
        </label>
        <Input
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@example.com"
          required={canUseAuth}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          密码
        </label>
        <Input
          type="password"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="请输入密码"
          required={canUseAuth}
        />
      </div>
      {!canUseAuth && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          当前是本地演示模式，配置 Supabase 环境变量后会启用真实登录。
        </p>
      )}
      {message && <p className="text-sm text-rose-600">{message}</p>}
      <Button type="submit" disabled={loading} icon={<LogIn size={16} />}>
        {loading ? "登录中" : "登录后台"}
      </Button>
    </form>
  );
}
