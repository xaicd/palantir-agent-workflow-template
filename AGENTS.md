# AI Agent 工程协作与质量治理工作手册 (AGENTS.md)

**版本**: 1.0 (Universal Template) | **适用架构**: 全栈/多端/分布式单体/微服务

> 本手册是智能体团队（Claude Code、Hermes、AGY、CommandCode 等）在本项目中协作的**最高常青宪法与红线指南**。
> 所有加入本项目的 AI 智能体在阅读任何业务代码前，**必须首先无条件服从本手册的最高优先级条款与交付红线**。

---

## 最高优先级 0：手册生命周期进化与精简归档机制（强制）

为杜绝指令手册体积无序膨胀、降低大模型上下文 Token 消耗并保持红线清晰，本手册实行**三阶段生命周期进化与自动归档机制**：

```
[阶段 1: 观察纠偏 (HOT_FIX)]  ──> 发现高频踩坑/新业务痛点，记录于本手册末尾【近期观察期规则】，严禁长篇大论
           │
           ▼
[阶段 2: 守卫固化 (GUARDED)]  ──> 必须编写对应自动化测试/Guardrail/AST 静态拦截门禁
           │
           ▼
[阶段 3: 稳定归档 (ARCHIVED)] ──> 经多轮迭代未复发，归档至 docs/archive/，本手册仅保留单行权威索引与一句话禁令红线
```

- **健康度上限门禁**: 本手册推荐体积 $\le 32\text{ KB}$。任何模型不得未经生命周期评估直接追加长段领域业务逻辑。
- **动态进化原则**: 规则必须附带机器可校验的 Guardrail 测试，禁止仅停留在“文字口头叮嘱”。

---

## 最高优先级 1：工程效率、复用与工具化总则（强制）

> 本节优先于一般实现习惯；但不得以节省代码或 AI Token 为由削弱业务正确性、RBAC、多租户隔离、资金安全、事务一致性、测试或发布门禁。

### 强制执行决策顺序

任何模型开始规划或编码前，必须按顺序决策，并在任务计划中用一行 `Reuse:` 记录结论：

1. **先查存量**：搜索真实 owner、公共 facade、shared contract/UI、现有 Service/Repository/Route、注册表、模板、脚本、测试 fixture 和功能文档；**禁止未检索就新建**。
2. **先用架构**：沿用模块优先（modules-first）、owner public facade、application port、版本化 contract、统一 API/RBAC/多租户/字典/统一错误处理；**禁止平行架构或第二事实源**。
3. **先复用工具**：优先使用脚手架、代码生成器及检验工具链；生成物只是受控骨架，不等于业务完成。
4. **优先扩展存量**：向原 owner 增加参数/策略/adapter/模板能力；**禁止复制后改名、包装一层或另起同义 Service/API/组件**。
5. **缺工具先造工具**：缺口属于可重复、输入输出稳定、$\ge 2$ 场景可复用且机械时，先建模板/生成器/guardrail 再生成差异；一次性领域语义不得伪装成“通用工具”。
6. **最后才写业务代码**：订单、支付、资金、库存、履约、状态机、并发事务和分布式 Saga 必须严格设计实现，**禁止通用低代码猜测生成**。

### 零重复、零无效代码门禁

- **禁止重复定义**：严禁重复定义已有类型/枚举/validator/DTO/状态映射/API client/权限码/测试 helper。跨模块复用一律通过合法 public contract。
- **禁止死代码与空占位**：严禁新增无真实调用方的 wrapper/barrel/空目录/空 Service/占位 Route/假 repository/mock 假数据/装饰数字。
- **第二次必须抽取**：同类代码出现第二次前必须抽取到真实 owner 或 shared 纯能力；但不得将业务状态机与核心语义盲目下沉。
- **新文件必要性证明**：新建任何文件必须能明确回答：**“为何不能复用、真实调用方是谁、删除后哪个验收条款失败”**。回答不清不得创建。

### 极低 Token 文档与测试规则

- 中央规范/架构/测试基线只维护一份，任务中只引用权威路径并描述增量差异，**禁止整段复制通用检查表**。
- 读取代码优先用文件清单、导出签名与窄范围检索，**禁止无脑遍历 `node_modules`、构建产物或历史备份**。
- 测试复用嵌入式沙箱与共享 fixture，仅新增需求特有 case。

---

## 一、 Palantir Foundry 五大角色体系与职责分工

本项目采用源自 Palantir Foundry 的专业化角色分工协作范式：

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

## 二、 核心交付红线（全角色共守，违者判定交付失败）

1. ❌ **严禁测试“仅截图不点击”**：UI 验收必须包含真实的 DOM / 真机交互（点击、输入、弹窗、滚动、导航），杜绝静态摆拍。
2. ❌ **严禁只测默认 Tab**：界面中所有横向 Tab、二级子菜单、折叠面板必须 **100% 遍历覆盖**。
3. ❌ **严禁提交含未声明变量与编译报错的代码**：TypeScript 必须严格模式 0 报错（`tsc --noEmit` 退出码必须为 0）。
4. ❌ **严禁在未对齐版本的测试环境上出具验收结论**：部署验收必须先检查 `/api/health` 或版本 Git Commit Hash 握手。
5. ❌ **严禁发布无响应的假按钮与假跳转**：所有按钮点击后必须有确定性反馈（下钻页面、状态流转或有效错误提示）。
6. ❌ **严禁忽略控制台未捕获异常**：无论是浏览器端还是服务端日志，测试期间产生的 Unhandled Exception 一律视为阻断性缺陷。

---

## 三、 真实数据与业务全流程走通（强制反造数规范）

> **为什么强制？** 假数据会导致界面排版失真、真实 API 报错被掩盖、下游履约全线崩溃。

1. **禁装饰性造数**：
   - 严禁在页面写死假数字（如固定写死 `¥999` 或写死 `月售 8888`）。
   - 严禁使用英文占位字符（如 `Lorem ipsum`、`Test test`）敷衍填充。
2. **多媒体与图片真实防御**：
   - 页面严禁裸露灰底空占位图或死图（404）；
   - 代码层必须实施三级防御策略：**`数据指定缩略图 → 图集第一张 → 业务类型确定性高清图池兜底`**。
3. **真实资金与状态机闭环**：
   - 业务全链路必须闭环：**`选品/填单 → 真实金额算价 → 提交订单 → 状态机推进 → 履约核销`**。

---

## 四、 部署、回滚与发布工程纪律

1. **5 分钟快速回滚承诺（Mandatory Rollback Point）**：
   - 任何发布动作前，**必须先保留回滚镜像或配置快照**（例如：`docker tag app:latest app:rollback-pre-<TIMESTAMP>`）；
   - 发布后立即进行路由与健康校验，一旦异常在 **5 分钟内执行单行回滚**。
2. **Docker Compose 环境变量注入纪律**：
   - 严格区分 **A 阶段（image baked env，Dockerfile 构建期）** 与 **B 阶段（container runtime env，容器启动期）**；
   - 杜绝仅靠 `docker compose up -d --force-recreate` 侥幸更新环境变量，必须遵循 `stop → rm -f → up` 完整生命周期。
3. **跨会话 Commit 纪律与双远端同步**：
   - 任何涉及 SOP、Skill、基础设施配置或核心业务改动，提交时建议推双远端（如 `origin` + 镜像仓），杜绝会话间版本脱节。
4. **事故复盘 4 件套（Incident Postmortem）**：
   - 发生任何回滚或破坏性故障后，必须在 30 分钟内产出：**根因（Root Cause） + 检测信号（Detection Signal） + 拦截门禁（Guard Rail） + 沉淀路径（Sink Path）**。

---

## 五、 全端自动化与双层真实交互验收

1. **层级 1：宿主机真实交互验收 (`agent-device`)**
   - 针对移动端（Flutter / React Native + WebView），利用原生 Accessibility 节点树直接读取真实 DOM 与交互状态；
   - 验证原生 Native Bridge（版本检查、更新弹窗、外部跳转）与真实手势。
2. **层级 2：浏览器 E2E 验收 (`Playwright`)**
   - 针对 PC 门户与 Web 端，执行高并发、全自动化回归；
   - 执行 **A11y 交互点嗅探** 与 **DOM 物理遮挡几何判定**（计算重叠元素 `z-index` 与 `getBoundingClientRect`，防止不可点击的“悬浮遮挡”）。
3. **层级 3：多模态视觉比对**
   - 关键业务旅程必须截屏归档，防止文字重叠、字号截断与布局崩坏。

---

## 六、 统一通用技能索引矩阵 (Skills Directory)

本项目沉淀的工程技能全部收录在 `.agents/skills/` 目录中：

| 分类 | 技能名 | 路径 | 核心能力 |
|:---|:---|:---|:---|
| **角色与规范** | `palantir-foundry-roles-workflow` | `.agents/skills/palantir-foundry-roles-workflow/` | 五大角色职责、审查清单与全闭环验收规范 |
| | `feature-development-workflow` | `.agents/skills/feature-development-workflow/` | 业务需求到接口、建模、生成、配置与验收全生命周期 |
| **测试与质保** | `comprehensive-testing-workflow` | `.agents/skills/comprehensive-testing-workflow/` | PGlite WASM 脱机沙箱、Tab 遍历、物理遮挡审查 |
| | `app-agent-device-combo-validation` | `.agents/skills/app-agent-device-combo-validation/` | 移动端真机/模拟器 Accessibility 节点级交互验证 |
| | `tdd` | `.agents/skills/tdd/` | 测试驱动开发 Red-Green-Refactor 循环 |
| | `diagnosing-bugs` | `.agents/skills/diagnosing-bugs/` | 硬 Bug 根因定位与性能衰退排查循环 |
| | `code-review` | `.agents/skills/code-review/` | 双轴代码审查（Standards + Spec） |
| **发布与运维** | `rollback-discipline` | `.agents/skills/rollback-discipline/` | 5 分钟发布回滚 SOP 与回滚点机制 |
| | `docker-compose-env-discipline` | `.agents/skills/docker-compose-env-discipline/` | Docker Compose 环境变量三阶段注入防错 |
| | `commit-discipline-cross-session` | `.agents/skills/commit-discipline-cross-session/` | 跨智能体会话 commit 纪律与双远端同步 |
| | `incident-postmortem` | `.agents/skills/incident-postmortem/` | 事故复盘 4 件套（根因/信号/门禁/沉淀） |
| | `proxy-network-workflow` | `.agents/skills/proxy-network-workflow/` | Mihomo TUN 代理热重载与内网自适应放行 |
| **智能体协同** | `digital-employee-operations` | `.agents/skills/digital-employee-operations/` | 数字员工全自主业务接管与 E2E 运营自愈 |
| | `agy-orchestration` | `.agents/skills/agy-orchestration/` | 宿主机跨容器无头调度 Antigravity (AGY) 黄金 SOP |
| **多媒体与设计**| `ui-ux-pro-max` | `.agents/skills/ui-ux-pro-max/` | 67 种 UI 风格、96 套色板与组件设计决策 |
| | `archify` | `.agents/skills/archify/` | 架构图、数据流、时序图可交互 HTML 生成 |
| | `course-deck` | `.agents/skills/course-deck/` | 1080P 多文件 HTML 独立课件与矢量 PDF/PPTX 导出 |
| | `course-commerce-generation` | `.agents/skills/course-commerce-generation/` | 真实教案、PPTX、PDF 讲义与 H.264 MP4 自动化造数 |
| | `video-to-transcript` | `.agents/skills/video-to-transcript/` | 音视频下载与 Whisper 批量转写流水线 |
| | `lecture-lesson-plan` | `.agents/skills/lecture-lesson-plan/` | 逐字稿清洗、同音字纠错与结构化教案生成 |
| | `domain-modeling` | `.agents/skills/domain-modeling/` | 领域建模、上下文地图与 ADR 记录 |
