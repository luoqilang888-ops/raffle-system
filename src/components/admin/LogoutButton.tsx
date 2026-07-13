"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/Button";
import { hasSupabasePublicEnv } from "@/lib/env";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    if (hasSupabasePublicEnv()) {
      await createClient().auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" onClick={logout} icon={<LogOut size={16} />}>
      退出
    </Button>
  );
}
