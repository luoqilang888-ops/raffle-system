# 测试说明

运行全部本地检查：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## 已覆盖

- 安全随机抽取不会重复。
- 揭晓时间包含减速和悬念停顿。
- 大屏不显示开始/停止按钮。
- 大屏不显示参与者姓名。
- 大屏摇奖球使用 Canvas，不在球上渲染文字。
- 演示后台可编辑奖项名称。

## 需要生产环境复测

- Supabase Auth 登录。
- Supabase Realtime 是否正常推送。
- Storage 上传音频。
- Vercel Production Domain 固定链接。
