import { redirect } from "next/navigation";
import { hasSupabasePublicEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  if (!hasSupabasePublicEnv()) {
    return { id: "local-demo-admin", email: "local@example.com" };
  }
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
