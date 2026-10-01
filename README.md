# Palantir Agent Workflow Template

> 一套完整的 **AI 代理角色工程与生产级质保工作流** 模板，基于 Palantir Foundry 五大角色体系提炼，深度沉淀真实复杂工程的最佳实践、部署纪律与质量守卫，可直接开箱应用于任意全栈/移动端/分布式项目。

---

## 一、 包含 Skills 全景矩阵

### 1. 核心角色与业务流程体系

| Skill | 路径 | 适用角色 | 核心能力说明 |
|:---|:---|:---|:---|
| `palantir-foundry-roles-workflow` | `.agents/skills/palantir-foundry-roles-workflow/` | 全部角色 | FDA/FDSE/DS/Core SWE/PRE 角色定义、职责、审查清单、六大交付红线 |
| `feature-development-workflow` | `.agents/skills/feature-development-workflow/` | FDSE + FDA | 需求分析 → 领域建模 → API 设计 → 受控实现 → 菜单配置 → 闭环验收 |

### 2. 自动化测试与全端质保体系

| Skill | 路径 | 适用角色 | 核心能力说明 |
|:---|:---|:---|:---|
| `comprehensive-testing-workflow` | `.agents/skills/comprehensive-testing-workflow/` | DS + FDSE | PGlite WASM 嵌入式沙箱、Tab 100% 遍历、DOM 物理遮挡几何判定、多模态屏幕快照 |
| `app-agent-device-combo-validation` | `.agents/skills/app-agent-device-combo-validation/` | DS + FDSE | 宿主机 `agent-device` 真机/模拟器 Accessibility 节点级交互 + Playwright 浏览器双层验收 |
| `tdd` | `.agents/skills/tdd/` | FDSE | 测试驱动开发，严格执行 Red-Green-Refactor 循环 |
| `diagnosing-bugs` | `.agents/skills/diagnosing-bugs/` | FDSE | 硬 Bug 根因定位、火焰图分析与性能衰退排查 |
| `code-review` | `.agents/skills/code-review/` | Core SWE + FDSE | 双轴代码审查（Standards 规范轴 + Spec 需求轴），并行 Subagent 评审 |

### 3. 发布、运维与故障纪律体系

| Skill | 路径 | 适用角色 | 核心能力说明 |
|:---|:---|:---|:---|
| `rollback-discipline` | `.agents/skills/rollback-discipline/` | PRE + SRE | **5 分钟快速回滚承诺**：发布强制留 `rollback-pre-...` 镜像/配置点与单行回滚 SOP |
| `docker-compose-env-discipline` | `.agents/skills/docker-compose-env-discipline/` | PRE + Core SWE | Docker Compose 环境变量三阶段注入防错（image baked env vs runtime env 严格区分） |
| `commit-discipline-cross-session` | `.agents/skills/commit-discipline-cross-session/` | 全部角色 | 跨智能体会话 Commit 纪律、双远端同步（`origin` + `gitee`）与 memory 沉淀 |
| `incident-postmortem` | `.agents/skills/incident-postmortem/` | DS + PRE + SWE | 破坏性故障强制复盘 4 件套（根因 / 检测信号 / 拦截门禁 / 沉淀路径） |
| `proxy-network-workflow` | `.agents/skills/proxy-network-workflow/` | PRE + SRE | Mihomo TUN 模式代理热重载、内网网段自适应探测放行与合规海外节点锁定 |
| `deployment-workflow` | `.agents/skills/deployment-workflow/` | PRE + FDSE | 4 级联级发布链（SQL 迁移 → 镜像 → 静态前端 → 移动端 APK）与单链路反例 |
| `deployment-tarball-test` | `.agents/skills/deployment-tarball-test/` | PRE + 雨蛙 | 测试环境轻量 V4 Tarball + systemd 软链秒级回滚极速发布（提速 50%） |

### 4. 智能体跨环境协同与数字员工运营

> 团队编制与协同协议详见：[`docs/team-orchestration.md`](docs/team-orchestration.md)

| Skill | 路径 | 适用角色 | 核心能力说明 |
|:---|:---|:---|:---|
| `master-orchestrator-dispatch` | `.agents/skills/master-orchestrator-dispatch/` | 主 Agent / 总监 | 主智能体派活与调度黄金规程：10段式任务书、底座工位解耦、4项真实证据核验协议 |
| `digital-employee-operations` | `.agents/skills/digital-employee-operations/` | DS + Hermes | 将 E2E 升级为自主“数字员工”手臂：全生命周期商品/房型上架与零死穴、零空白自愈 |
| `agy-orchestration` | `.agents/skills/agy-orchestration/` | 全部 Agent | 宿主机总指挥（Claude/Hermes）向容器内 Antigravity (AGY) 智能体派活的无头黄金 SOP |

### 5. 多媒体与课件工业化内容流水线

| Skill | 路径 | 适用角色 | 核心能力说明 |
|:---|:---|:---|:---|
| `video-to-transcript` | `.agents/skills/video-to-transcript/` | 全员 | 音视频伪装下载、断点续传与 Whisper 批量转写流水线 |
| `lecture-lesson-plan` | `.agents/skills/lecture-lesson-plan/` | 全员 | 逐字稿清洗、人名术语纠错与结构化教案/讲义生成 |
| `course-deck` | `.agents/skills/course-deck/` | 全员 | 1080P 多文件 HTML 独立课件渲染与矢量 PDF/PPTX 导出 |
| `course-commerce-generation` | `.agents/skills/course-commerce-generation/` | 全员 | 真实教案、PPTX、PDF 讲义与 H.264 MP4 教学视频端到端自动化造数 |

### 6. 架构可视化与领域设计

| Skill | 路径 | 适用角色 | 核心能力说明 |
|:---|:---|:---|:---|
| `archify` | `.agents/skills/archify/` | FDA + Core SWE | 架构图、数据流、时序图可交互 HTML 生成（支持深浅色与动态路径追踪） |
| `ui-ux-pro-max` | `.agents/skills/ui-ux-pro-max/` | FDSE + 前端 | 全栈 UI/UX 设计库：67 种设计风格、96 套专业色板与无障碍指南 |
| `domain-modeling` | `.agents/skills/domain-modeling/` | FDA | 统一领域模型构建、限界上下文地图与架构决策记录（ADR） |

---

## 二、 斜杠命令速查 (Slash Commands)

支持 Claude CLI 与 CommandCode：

| 命令 | 角色 / 功能 | 使用场景 |
|:---|:---|:---|
| `/fdse` | FDSE 前线部署工程师 | 全栈功能开发、缺陷修复、防御性测试、消除死穴 |
| `/ds` | DS 部署战略专家 | 业务旅程探路、UAT 验收、反造数审查、视觉遮挡嗅探 |
| `/pre` | PRE 产品可靠性工程师 | 环境版本握手、5分钟回滚留点、发布镜像治理 |
| `/proxy-refresh` | PRE / SRE 代理运维 | Mihomo TUN 模式节点测速、热重载与内网自适应放行 |
| `/deploy-dev` | 本地开发环境发布 | 本地容器构建、热更新与冒烟验证 |
| `/deploy-test` | 共享测试环境发布 | 打包、远程镜像同步、5分钟回滚点保存与健康握手 |
| `/deploy-prod` | 生产环境发布 SOP | 严格防回滚点打标、发布门禁审计与生产真机验收 |

---

## 三、 五大角色协作分工模型

```
         ┌──────────────────────────────────────┐
         │  FDA (Forward Deployed Architect)    │  顶层数据模型 / 领域架构 / 契约边界
         │  → archify, domain-modeling          │
         └────────────────┬─────────────────────┘
                          │
         ┌────────────────┴─────────────────────┐
         │  Core SWE          │  PRE / SRE       │  平台内核守卫 / 编译守护
         │  → code-review     │  → proxy-network │  发布治理 / 5分钟回滚 / 环境握手
         │    archify         │    rollback-disc.│
         └────────────────┬─────────────────────┘
                          │
         ┌────────────────┴─────────────────────┐
         │  FDSE (前线部署全栈工程师，交付责任人)   │  全栈功能实现 / 死穴消除
         │  → tdd, diagnosing-bugs, feature-dev │  防御性测试 / 嵌入式沙箱
         └────────────────┬─────────────────────┘
                          │
         ┌────────────────┴─────────────────────┐
         │  DS (部署战略专家，用户视角主审官)     │  真实全链路探路 / UAT 验收
         │  → comprehensive-testing-workflow    │  反造数审查 / 视觉与遮挡嗅探
         └──────────────────────────────────────┘
```

---

## 四、 核心红线与工程宪法

完整宪法请查阅：[`AGENTS.md`](AGENTS.md)。

### 六大交付红线
1. ❌ **严禁测试“仅截图不点击”**：所有测试必须触发真实的 DOM / 真机交互（点击、输入、导航）。
2. ❌ **严禁只测默认 Tab**：横向 Tab、二级子菜单必须 100% 遍历覆盖。
3. ❌ **严禁提交含未声明变量的代码**：TypeScript 严格模式 0 报错（`tsc --noEmit` 0 退出码）。
4. ❌ **严禁在未对齐版本的测试环境上出具验收结论**：部署前必须检查 `/api/health` 与 Commit Hash 握手。
5. ❌ **严禁发布无点击响应的假按钮与死链接**。
6. ❌ **严禁忽略控制台未捕获异常**（Unhandled Exception）。

### 真实数据与业务全流程走通（强制反造数）
- **严禁装饰性造数**：拒绝写死数字或用假数据敷衍；
- **全链路闭环**：选品/填单 → 真实金额算价 → 提交订单 → 状态机推进 → 履约核销；
- **图片防御**：严禁出现死图或灰底空占位，必须有三级图池兜底。

---

## 五、 智能体偏好沉淀 (.commandcode/taste)

本仓库提供经由生产环境打磨的智能体偏好（Taste Profiles）：
* `workflow/taste.md`：双远端推送、5分钟回滚留点、不滥加新角色、以真实 UI 为准
* `communication/taste.md`：中文优先、极简高密度输出、杜绝废话、减少不必要的反问
* `data-quality/taste.md`：高品质种子数据、禁假造数、根治问题源头
* `environment/taste.md`：源码不出机安全红线、容器本地构建分发、复用已有大模型渠道
* `ux/taste.md`：对标行业标杆产品、信息结构丰富、杜绝冗余重复控件

---

## 六、 快速接入与同步

### 1. 迁移到新项目
```bash
# 克隆模板
git clone git@github.com:xaicd/palantir-agent-workflow-template.git

# 将规则与指令复制到你的项目
cp -r palantir-agent-workflow-template/.agents YOUR_PROJECT/
cp -r palantir-agent-workflow-template/.claude YOUR_PROJECT/
cp -r palantir-agent-workflow-template/.commandcode YOUR_PROJECT/
cp palantir-agent-workflow-template/AGENTS.md YOUR_PROJECT/
cp palantir-agent-workflow-template/CLAUDE.md YOUR_PROJECT/
```

### 2. 持续反哺与回流
当在业务主工程（如 `wenlv-next`）迭代出新的通用技能时，直接运行：
```bash
bash scripts/sync-skills.sh --push
```
脚本会自动过滤业务私有硬编码、执行脱敏管道，并一键推送到本模板远端。

---

## 七、 核心工程守护、校验与自动化工具集

| 工具 / 脚本 | 路径 | 核心能力说明 | 推荐触发命令 |
|:---|:---|:---|:---|
| **数据库直连守卫** | `scripts/guardrails/no-direct-db-in-personas.guard.ts` | 严禁拟人测试与智能体脚本直连 DB，强制 100% 走真实 HTTP API 避免测试与生产两张皮 | `npm run guard:no-direct-db` |
| **规则生命周期管理** | `scripts/rules/evolve-agents-rules.ts` | 扫描 `AGENTS.md` 健康度、预估 Token 消耗、执行三阶段规则归档 | `npm run rules:check`<br>`npm run rules:evolve` |
| **业务内容合规校验** | `scripts/tools/business-content-validator.ts` | 广告法违禁词、敏感词、死图死链与内网 SSRF 风险校验拦截 | 导入自检 / CI 门禁 |
| **宿主机双端全自动验收** | `scripts/agent-ops/host-dual-acceptance.sh` | 组合调度 `agent-browser` 桌面端与 `agent-device` 真机/模拟器双层自动化视觉验收 | `npm run acceptance:host-dual` |
| **通用 Skills 自动同步** | `scripts/sync-skills.sh` | 自动从主工程检测并同步通用技能至本模板，内置脱敏过滤管道 | `npm run sync:skills` |
| **Mihomo TUN 代理热重载** | `scripts/refresh-proxy.sh` | 代理节点自动探测、测速热更新与本地内网网段自适应放行 | `npm run proxy:refresh` |

---

## License

MIT

