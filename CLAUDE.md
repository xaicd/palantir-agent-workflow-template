# Palantir Agent Workflow — Claude CLI 集成指南

本文件定义了 Claude Code CLI 在项目中的角色行为指引与速查命令。
**工程最高宪法、复用总则与交付红线请严格参见：[`AGENTS.md`](AGENTS.md)**。

---

## 一、 Palantir Foundry 全角色工程与质保体系

角色详解参见：`.agents/skills/palantir-foundry-roles-workflow/SKILL.md`。

### 斜杠命令速查 (Slash Commands)

| 命令 | 角色 / 功能 | 核心使用场景 |
|:---|:---|:---|
| `/fdse` | FDSE 前线部署工程师 | 全栈功能开发、缺陷修复、防御性测试、消除死穴 |
| `/ds` | DS 部署战略专家 | 业务旅程探路、UAT 验收、反造数审查、视觉遮挡嗅探 |
| `/pre` | PRE 产品可靠性工程师 | 环境版本握手、5分钟回滚留点、发布镜像治理 |
| `/proxy-refresh` | PRE / SRE 代理运维 | Mihomo TUN 模式节点测速、热重载与内网自适应放行 |
| `/deploy-dev` | 本地开发环境发布 | 本地容器构建、热更新与冒烟验证 |
| `/deploy-test` | 共享测试环境发布 | 打包、远程镜像同步、5分钟回滚点保存与健康握手 |
| `/deploy-prod` | 生产环境发布 SOP | 严格防回滚点打标、发布门禁审计与生产真机验收 |

---

## 二、 六大交付红线（全角色共守，违者交付判定失败）

1. ❌ **严禁测试“仅截图不点击”**：所有测试必须触发真实的 DOM / 真机交互（点击、输入、导航）。
2. ❌ **严禁只测默认 Tab**：界面中所有横向 Tab、二级子菜单必须 100% 遍历覆盖。
3. ❌ **严禁提交含未声明变量的代码**：TypeScript 必须严格模式 0 报错（`tsc --noEmit` 0 退出码）。
4. ❌ **严禁在未对齐版本的测试环境上出具验收结论**：部署前必须检查 `/api/health` 与 Commit Hash。
5. ❌ **严禁发布无点击响应的假按钮与死链接**。
6. ❌ **严禁忽略控制台未捕获异常**（Unhandled Exception）。

---

## 三、 跨智能体协作与双远端同步纪律

1. **跨会话 Commit 纪律**：改动 SOP、Skill 或关键部署配置后，必须执行 `git push origin HEAD` 与 `git push gitee HEAD`（双远端同步），防止版本脱节。
2. **多 Agent 调度**：若涉及长链路任务或跨环境编译，遵循 `agy-orchestration` 调度容器内 AGY 执行无头自动化任务。
