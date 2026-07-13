# 数据库说明

数据库迁移文件位于：

`supabase/migrations/0001_initial_schema.sql`

## 核心表

- `profiles`：管理员资料
- `events`：活动和稳定大屏令牌
- `groups`：参与抽奖的组别
- `participants`：参与名单，仅后台可见
- `prizes`：可编辑奖项
- `draw_sessions`：每轮抽奖会话和候选快照
- `draw_results`：最终开奖记录
- `event_runtime`：大屏实时状态
- `audio_assets`：音频文件记录
- `display_connections`：大屏心跳和音频启用状态

## 安全

- 所有表开启 RLS。
- 匿名用户不能直接读取 `participants`。
- 客户端不能直接写入 `draw_results`。
- 开始和停止抽奖通过服务端 API 调用数据库事务函数。
- `SUPABASE_SERVICE_ROLE_KEY` 只用于服务端，不能写入浏览器代码。

## 抽奖事务

- `start_draw_session`：锁定活动、保存候选组快照、切换运行状态。
- `stop_draw_session`：锁定当前会话、生成结果、写入 reveal_at、更新开奖记录。
