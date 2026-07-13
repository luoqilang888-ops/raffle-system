import Link from "next/link";
import {
  AudioLines,
  ClipboardList,
  Gift,
  LayoutDashboard,
  Monitor,
  Settings,
  Users,
} from "lucide-react";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "", label: "抽奖控制", icon: LayoutDashboard },
  { href: "/participants", label: "参与名单", icon: Users },
  { href: "/groups", label: "组别管理", icon: ClipboardList },
  { href: "/prizes", label: "奖项设置", icon: Gift },
  { href: "/audio", label: "音乐设置", icon: AudioLines },
  { href: "/records", label: "开奖记录", icon: ClipboardList },
  { href: "/settings", label: "系统设置", icon: Settings },
];

export function AdminShell({
  eventSlug,
  title,
  children,
}: {
  eventSlug?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div>
            <p className="text-xs font-medium text-amber-600">会场分组抽奖系统</p>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          <LogoutButton />
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-[220px_1fr] gap-6 px-6 py-6">
        <aside className="space-y-2">
          {eventSlug ? (
            <>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={`/admin/${eventSlug}${item.href}`}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white hover:text-blue-700",
                    )}
                  >
                    <Icon size={17} />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href={`/admin/${eventSlug}/display`}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-500"
              >
                <Monitor size={17} />
                大屏预览
              </Link>
            </>
          ) : (
            <p className="rounded-lg bg-white p-4 text-sm text-slate-500">
              选择或创建活动后，会出现完整后台菜单。
            </p>
          )}
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
