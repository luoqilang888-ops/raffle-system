import Link from "next/link";
import {
  AudioLines,
  ClipboardList,
  Gift,
  LayoutDashboard,
  Monitor,
  Settings,
  Users,
  UserRound,
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
    <div className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
        <div className="flex h-[72px] items-center justify-between px-10">
          <h1 className="text-2xl font-bold tracking-normal text-slate-950">
            会场抽奖后台
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-slate-100 to-blue-100 ring-1 ring-slate-200">
              <UserRound size={22} className="text-blue-700" />
            </div>
            <span className="text-sm font-semibold text-slate-700">管理员</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="grid min-h-[calc(100vh-72px)] grid-cols-[250px_1fr]">
        <aside className="flex flex-col border-r border-slate-200/80 bg-white px-4 py-6">
          {eventSlug ? (
            <>
              <nav className="space-y-3">
                {navItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={`/admin/${eventSlug}${item.href}`}
                    className={cn(
                      "flex h-14 items-center gap-4 rounded-lg px-5 text-[15px] font-semibold transition",
                      index === 0
                        ? "bg-blue-50 text-blue-700 shadow-[0_12px_28px_rgba(37,99,235,0.10)]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-blue-700",
                    )}
                  >
                    <Icon size={20} />
                    {item.label}
                  </Link>
                );
              })}
              </nav>
              <Link
                href={`/admin/${eventSlug}/display`}
                className="mt-3 flex h-14 items-center gap-4 rounded-lg px-5 text-[15px] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-blue-700"
              >
                <Monitor size={20} />
                大屏预览
              </Link>
              <div className="mt-auto">
                <Link
                  href={`/admin/${eventSlug}/settings`}
                  className="flex h-14 items-center gap-4 rounded-lg border border-slate-200 bg-white px-5 text-[15px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <Settings size={20} />
                  系统设置
                </Link>
              </div>
            </>
          ) : (
            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
              选择或创建活动后，会出现完整后台菜单。
            </p>
          )}
        </aside>
        <main className="min-w-0 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-950">{title}</h2>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
