# 会场分组抽奖系统

一个可长期维护的 Next.js + Supabase 会场分组抽奖系统。

## 功能

- 大屏展示：`/display/[eventSlug]/[displayToken]`
- 管理后台：`/admin/[eventSlug]`
- Supabase Auth 邮箱密码登录
- Supabase PostgreSQL 持久化数据
- Supabase Realtime 同步大屏状态
- Supabase Storage 上传紧张音乐和揭晓音效
- 服务端抽奖 API，前端不生成最终结果
- Canvas 摇奖球动画，球上不显示姓名或组别
- Excel 导入导出参与名单
- 自定义奖项名称、次数和每次抽取组数
- 开奖记录永久保存并支持撤销

## 本地运行

```bash
npm install
cp .env.example .env.local
npm run dev
```

如果没有配置 Supabase 环境变量，系统会进入本地演示模式，可访问：

- 后台：`http://localhost:3000/admin/demo-event`
- 大屏：`http://localhost:3000/display/demo-event/demo-display-token`

## 常用命令

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## 生产部署

详见 [DEPLOYMENT.md](./DEPLOYMENT.md)。
