import Link from "next/link";
import { ArrowRight, Monitor, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { demoDisplayToken } from "@/lib/mock-data";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold text-amber-600">会场分组抽奖系统</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-normal">
          为课程、会议和线下活动准备的实时分组抽奖系统
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          大屏只负责展示，后台负责登录管理、组别、奖项、名单、音乐、开奖记录和实时控制。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="inline-flex h-11 items-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700"
            href="/admin"
          >
            进入后台
            <ArrowRight size={16} />
          </Link>
          <Link
            className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-5 text-sm font-medium text-slate-800 hover:bg-slate-50"
            href={`/display/demo-event/${demoDisplayToken}`}
          >
            查看演示大屏
            <Monitor size={16} />
          </Link>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            ["稳定链接", "使用活动标识和固定令牌生成大屏链接，重新部署后不会改变。"],
            ["安全开奖", "结果由服务端接口和数据库事务生成，前端不能私自开奖。"],
            ["实时联动", "后台控制、大屏状态和连接心跳通过 Supabase Realtime 同步。"],
          ].map(([title, text]) => (
            <Card key={title}>
              <ShieldCheck className="text-amber-500" size={22} />
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
