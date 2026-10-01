---
name: comprehensive-testing-workflow
description: 用于系统测试、单元测试、本地脱机沙箱测试、E2E 浏览器旅程、移动端真机快照测试与物理遮挡审查。沉淀了 PGlite WASM 嵌入式测试、A11y 交互点嗅探、DOM 物理遮挡几何计算、多模态屏幕快照视觉验证与反造数断言的全套实战经验。适用于“执行测试”“编写单测/集成测试”“本地脱机测试”“E2E回归”“排查UI遮挡与白屏”等场景。
---

# 综合测试与质量保障通用工作流 (Comprehensive Testing Workflow)

本 Skill 汇总并提炼了企业级全栈系统（PC 管理端、商户/业务端、移动 H5/C 端）在测试架构、脱机沙箱、多模态真机审查与防错工程化方面的**全套通用实战经验与设计范式**。
**本规范为纯通用工程方法论，不绑定任何特定业务，适用于所有基于 Node.js/TypeScript/PostgreSQL 的全栈工程。**

---

## 1. 核心理念与分层测试矩阵

为了彻底解决“依赖外部 Docker 数据库易崩溃、端口冲突、启动慢、数据污染、无法脱机离线测试”的痛点，系统确立了**四层递进式自动化测试金字塔**：

```
[Layer 1: 静态守卫与架构门禁] ────> 模块边界扫描 / 路由契约覆盖 / 图标与字典枚举检查
              │
              ▼
[Layer 2: 毫秒级内存单测/集成] ───> PGlite WASM (毫秒级内存推库，零 Docker 依赖，完全脱机)
              │
              ▼
[Layer 3: 浏览器端到端脱机闭环] ──> PGlite + Web框架 + Playwright (A11y交互嗅探 + 几何防遮挡 + 多模态快照)
              │
              ▼
[Layer 4: 原生 App 真机/模拟器] ──> 设备自动化 CLI / MCP (原生容器、手势交互与真机取证)
```

---

## 2. PGlite 嵌入式脱机沙箱测试通用方案

### 2.1 架构原理
- **引擎**: 基于 `@electric-sql/pglite` (WebAssembly 编译的 PostgreSQL 内核)；
- **网络协议代理**: 通过 `pg-gateway` 暴露标准 PostgreSQL Wire Protocol，动态分配随机未占用端口，生成标准的 `postgresql://postgres@127.0.0.1:<port>/<db_name>?sslmode=disable`；
- **极速同步**: 毫秒级内推送全库 Schema 表结构并初始化基础测试种子数据；
- **全生命周期自闭环**: 执行器（如 `scripts/testing/run-with-pglite.ts`）自动拉起内存库 $\rightarrow$ 注入环境变量 `DATABASE_URL` $\rightarrow$ 执行目标测试/构建命令 $\rightarrow$ 捕获退出信号（SIGINT/SIGTERM） $\rightarrow$ 退出时 100% 自动回收端口与资源，彻底避免脏进程驻留。

### 2.2 通用测试命令设计模式

```bash
# 1. 跑全量单测/集成测试（脱机秒级运行）
npm run test:pglite

# 2. 定向单测：针对特定 Service、Controller 或工具函数
npm run test:pglite <path/to/test-file.test.ts>

# 3. 本地脱机全自闭环 E2E 测试 (无需预先启动任何外部数据库服务)
npm run test:e2e:pglite
# 或执行指定旅程
npm run test:e2e:pglite <path/to/journey.spec.ts>

# 4. 离线/脱机构建预检 (静态页面生成需要真实数据库时)
npm run build:pglite

# 5. 交互式调试沙箱 (开发调试临时需要纯净数据库时，Ctrl+C 退出)
npm run db:pglite
```

### 2.3 测试数据与账号播种规范（Seed & Isolation Standards）
- **密码与凭据统一约定**: 测试沙箱环境统一使用固定的测试弱密码（如 `TestAdmin@2026` 或经环境变量配置），生产环境强制校验拦截；
- **分层角色覆盖**: 播种脚本至少覆盖：
  1. 系统超级管理员（全权限）；
  2. 业务审核/经办角色（受限数据范围）；
  3. 终端用户/客户（普通租户）；
- **自包含原则**: 测试运行后数据全部存于内存，测试结束自动销毁，保证测试用例幂等、无序、可并行。

---

## 3. 全端交互与视觉审查规范 (Interaction & Visual QA)

### 3.1 自动化交互点嗅探 (A11y 树深度遍历)
禁止在 E2E 测试中仅依赖硬编码的单一 CSS 类名选择器进行点击。推荐通过可访问性树（Accessibility Tree）嗅探页面当前视口内的全部可交互元素：
- 按钮 (`role="button"`, `<button>`)
- 链接与路由跳转 (`role="link"`, `<a>`)
- 表单输入框、开关与下拉 (`<input>`, `<select>`, `role="switch"`)
- 快捷入口与卡片动作 (`[data-action]`, `[data-entry]`)

### 3.2 物理遮挡几何计算 (Hit-Testing 遮挡判定算法)
**通用痛点**: 移动端底部 Tab、吸底按钮（Sticky Footer）或悬浮按钮（Floating Action Button）极易发生 z-index 层级过高，将页面主要表单、提交按钮物理遮挡，导致用户“看得见但点不到”。

**自动化判定标准算法**:
```ts
// Playwright 中针对关键交互元素进行几何遮挡探测
const isObstructed = await page.evaluate((selector) => {
  const el = document.querySelector(selector)
  if (!el) return true
  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const hitElement = document.elementFromPoint(cx, cy)
  // 如果中心点命中元素既不是自身，也不是其子节点，则说明被遮挡
  return !(el === hitElement || el.contains(hitElement))
}, targetSelector)
```
- **修复指引**:
  - 悬浮元素若仅展示图标或徽章，外层容器必须增加 `pointer-events-none`，仅具体按钮增加 `pointer-events-auto`；
  - 页面主容器底部必须预留充分的安全内边距（如 `pb-24` 或 `pb-32`），防止被底部浮动栏遮挡。

### 3.3 多模态屏幕快照视觉审校规范
- **通用断点控制**:
  - 桌面端视口：`1280 × 800`
  - 移动端视口：`375 × 667`（典型移动端基准视口）
- **真机快照沉淀**:
  - 截图统一保存至测试制品目录（如 `.playwright/screenshots/`）；
  - 对长页面采用分段滚动截图（顶部首屏 `top`、中间内容 `mid`、底栏 `bottom`），供模型多模态能力审校；
  - 审校要点：文字是否截断、行高是否挤压塌陷（禁超大行高，推荐 1.35 基准）、颜色与主题令牌一致性。

### 3.4 五层 Smart Oracle 真实性与健壮性断言
1. **反虚假造数拦截 (Anti-Fake Oracle)**:
   - 严禁在视图中出现假 Mock ID 或硬编码评分/虚假数字；
   - 统计天数、次数必须有合理的物理上限与真实数据库计算支撑。
2. **浮点数精度截断断言**:
   - 金额计算与关键数值必须做精度舍入（如 `Math.round(x * 10) / 10` 或 Decimal 处理），严禁在 UI 暴露 `517.5999999999999`。
3. **零未捕获异常断言 (Zero Uncaught Error)**:
   - 测试过程中全程监听 `page.on('pageerror')` 与 `page.on('response')`；
   - 严禁产生 `ReferenceError`、`TypeError` 或服务端 500 页面崩溃。
4. **弹窗排版几何约束**:
   - 模态弹窗外层必须具备 `max-h-[90vh]` + `flex flex-col`，内容主体必须 `overflow-y-auto`，严禁超出屏幕视口导致“确定”按钮不可见。

### 3.5 全分段器与横向 Tab 遍历穷举规范 (Segment & Tab Exhaustion - FDSE 强约束)
- **痛点根治**: 杜绝“只测默认 Tab，漏测次级 Tab 内部条件样式或非沉浸分支（如 `showBanner is not defined`）”；
- **强制执行**:
  1. 页面若存在多个 Tab（如推荐/直播/关注/同城/团购/商城），测试必须通过循环依次点击所有 Tab；
  2. 每次点击后等待 DOM 渲染，断言控制台无未捕获异常，且错误边界（Error Boundary）未被触发；
  3. 对包含直链参数的场景（如 `?tab=city`），执行直接访问与跨 Tab 点击双向验证。

### 3.6 假交互与死穴按钮自动嗅探 (Dead Action Hunter - DS 强约束)
- **痛点根治**: 杜绝“看着像按钮，点了毫无反应”的半成品假交互（如城市切换按钮无 `onClick`、卡片无 `href`）；
- **判定标准**:
  - 嗅探页面所有具备交互形态的元素（`button`、`[role="button"]`、`a[href]`、带有 `cursor-pointer` 或 `active:scale-*` 的容器）；
  - 触发点击后，必须产生以下 **四维状态流转之一**：
    1. 路由产生跳转或 URL Hash/Query 变化；
    2. 发起并完成至少一次 API 网络请求；
    3. 唤起 Modal 弹窗、Drawer 抽屉或 Toast 反馈；
    4. 页面 DOM 结构/样式产生可观测的数据变更（如选中高亮、数字增减、展开收起）。
  - 若四项均为 0，判定为 `SUSPECTED_DEAD_CLICK` 死穴缺陷。

### 3.7 靶机环境版本指纹握手协议 (Environment Provenance Handshake - PRE 强约束)
- **痛点根治**: 杜绝“本地 master 已修复，但测试服务器容器仍在跑旧镜像”的脱节幻觉；
- **探针握手**:
  1. 在执行测试前，自动化脚本必须首先调用测试环境探针（如 `GET /api/health` 或校验页面内置的 build SHA）；
  2. 校验测试环境运行的 Git Commit SHA 是否与当前分支对齐；
  3. 若检测到环境版本滞后（Env Drift），测试脚本必须立即发出 `ENV_DRIFT_WARNING` 并阻断出具最终合规结论。

---

## 4. 通用 E2E 业务旅程建模方法论（6大测试范式）

在任意业务项目中，推荐按照以下 **6 大通用旅程范式** 规划端到端自动化用例，形成完备的业务闭环：

| 旅程范式 | 建模目标与覆盖要点 | 通用断言重点 |
|---|---|---|
| **1. 鉴权与权限隔离旅程** | 阶梯多角色登录、JWT/Cookie 凭据流转、越权访问拒绝（403/401） | 菜单按权限动态渲染，禁止跨角色越权访问 API |
| **2. 核心正向交易/业务流** | 资源上架 $\rightarrow$ 列表筛选 $\rightarrow$ 表单提交 $\rightarrow$ 状态机流转 $\rightarrow$ 完成 | 真实数据库记录流转，事务一致性，状态机无跳步 |
| **3. 统一审批与流转闭环** | 经办人发起申请 $\rightarrow$ 待办池聚合 $\rightarrow$ 审核人通过/驳回 $\rightarrow$ 业务状态回调 | 审批历史留痕，审核回调不得抛出未处理异常 |
| **4. 逆向业务与资金/库存冲销** | 用户主动取消 $\rightarrow$ 申请退款/回滚 $\rightarrow$ 超时定时关闭 $\rightarrow$ 账本核销 | 资金与库存守恒，双向流水一致，防重复冲销 |
| **5. 高并发与防击穿验证** | 多并发抢占限流、防重复点击（Idempotency）、原子库存/资源扣减 | Redis Lua/分布式锁防超卖，排队友好降级提示 |
| **6. 多端交互与适老化/响应式** | 桌面端 vs 移动端断点适配、字体 rem 缩放切换、吸底浮动栏遮挡探测 | 界面无溢出截断，关键操作区域 100% 可点击 |

---

## 5. 常见测试故障排查手册 (Troubleshooting)

### Q1: 运行测试提示 `端口占用` 或 `EADDRINUSE`？
- **排因**: 先前测试被强行终止，后台仍有遗留的 PGlite 进程；
- **排查与解决**:
  ```bash
  # 检查 38847 或类似端口占用
  lsof -i :38847
  # 使用内置清理脚本强制回收测试实例
  npm run rules:check
  ```
  `run-with-pglite.ts` 内部已绑定 `process.on('exit')` 与清理逻辑，优先使用 `npm run test:pglite` 可自动避免该问题。

### Q2: Next.js SSR 页面报错 `ReferenceError: document is not defined`？
- **排因**: 在服务端组件（Server Component）或没有标记 `'use client'` 的组件中，直接访问了浏览器全局对象（如 `window`, `document`, `localStorage`）；
- **解决**: 将相关逻辑移至 `useEffect` 生命周期内部，或为组件添加 `'use client'` 指令并配合动态加载 `dynamic(() => import(...), { ssr: false })`。

### Q3: 悬浮元素在 Playwright 中报错 `Element is not clickable at point ... other element would receive the click`？
- **排因**: 浮动组件（如底部固定栏、悬浮购物车按钮）层级重叠挡住了下层按钮；
- **解决**:
  - 为下层内容容器添加底部内边距 `pb-28`；
  - 为悬浮容器非按钮区域添加 Tailwind 类 `pointer-events-none`，仅按钮本身设置 `pointer-events-auto`。

### Q4: 离线构建或脱机测试时无法连接外部网络？
- **排因**: 平台设计保证脱机可运行。如果第三方外部 SDK（高德地图、微信支付）在初始化时强求外网网络，会导致测试挂起；
- **解决**: 系统内置了沙箱 Mock 模式。在环境变量中指定 `LOGISTICS_MODE=mock`，第三方地图通过动态 mock 处理，避免网络不可达阻断测试流。

### 5.0 spec 真业务验收硬门禁 (Truth-in-Testing)

1. **必须 `status === 200 + success === true` 才算业务真完成**：
   - 严禁使用 `expect(res.status).toBeLessThan(500)` 这类假容错自我安慰；
   - 接口抛出 `400` 或 `422` 参数校验失败时必须追查服务端 Schema 漏配，严禁跳过。
2. **多媒体与图片真实可达性前置拦截**：
   - 涉及图片、课件或视频上传的，文件上传完成后必须通过 HTTP 探针确认 URL 可正常访问读取；
   - **不能访问的死图死链，必须在表单提交阶段直接拦截新增或保存动作**，不允许写“提交成功”假阳性。
3. **优先选稳定持久化会话验证真业务**：
   - 优先使用持久化 Cookie/Token 跑真业务 spec，避免临时 fixture 跨 test 失效导致的误判。

---

### 5.1 永久化重复踩坑清单（DS 强约束）

**核心原则**: 同一个错误碰到 1 次就应永久化。绝不允许第 2、3 次重复出现。本节按"已踩坑 → 永久规则"模式沉淀，每次部署/测试都对照检查。

| # | 错误 | 永久规则 | 来源 |
|---|---|---|---|
| 1 | `version-check?platform=android` 报 `Invalid option: expected one of "IOS"|"ANDROID"` | **枚举 query 参数必须大写**: `platform=ANDROID` 不是 `android`。写 e2e/手动 curl 时一律大写 | 2026-09-21 |
| 2 | `docker save/load` 失败后用 `docker tag r<old> r<new>` rename 假装新镜像（但 ID 没变） | **镜像 ID 必须真变**: `docker images r<new> --format "{{.ID}}"` ≠ 上一个 ID。假 build = 假部署 | 2026-09-21 |
| 3 | 本地 push 到 `github.com` 但远端 `{{DEPLOY_SERVER}}` 上 `origin` 指向 `gitee`（远端看不到新代码） | **远端必须 `git fetch github feat/<branch>:<branch>`** 拉 github 源 | 2026-09-21 |
| 4 | COS 默认域名对 APK 分发返回 `403 DownloadForbidden` | **必须用备案自定义域名**（如 `dl.{{APP_DOMAIN}}`）+ 设 `COS_APP_PUBLIC_BASE` | 2026-09-21 |
| 5 | NextAuth admin 登录密码明文被 `CredentialsSignin` 拒绝 | **必须 MD5 无盐哈希**: `printf '%s' "$PWD" | md5sum` | 2026-09-21 |
| 6 | API 响应是 AES 加密 `{payload: "..."}`，直接 jq 看不到数据 | **必须 openssl 解密**: `openssl enc -d -aes-256-cbc -md md5 -a -A -pass "pass:$API_ENCRYPTION_KEY"` | 2026-09-21 |
| 7 | `docker compose up -f <file>` 跳过 `docker-compose.override.yml` → NextAuth UntrustedHost → 全站会话挂 | **`docker compose up -d` 必须无 `-f`**（默认加载 override.yml） | 长期教训 |
| 8 | `docker build` 不加 `--no-cache` → ENV layer 命中旧空值 → 客户端 key 为空（静默解密失败） | **本地 build 必须 `--no-cache`**（远端 build 有 cache 可省） | 长期教训 |
| 9 | `git tag` 在 detached HEAD 上做 commit → push 不进分支 | **commit 前必须 `git checkout <branch>`** 然后 `git log <branch>` 确认 | 2026-09-21 |
| 10 | sed 在 ssh 双引号里嵌 `$VAR` → 字面量不展开 → nginx 出现字面 `$VAR` | **nginx sed 必须字面量，禁止 ssh 双引号嵌变量** | 长期教训 |
| 11 | `docker ps` 看 Up X hours 误以为是新容器（实际是累加） | **新容器标志: `Up <duration> (health: starting)`** 表示 seconds-old 是 running | 2026-09-21 |
| 12 | 远端 `docker images r<tag>` 看到旧 ID，build 卡在 step 24 久没新输出 | **Step 24 Next.js 编译需 5-10 min 不是 hang**，看 `docker stats <container>` 看 CPU 是否>0 验证真在跑 | 2026-09-21 |
| 13 | `adb install -r` arm64-only APK 到 x86_64 emulator → `dlopen failed: libflutter.so is for EM_AARCH64` | **emulator APK 必须含 x86_64**: 用 `flutter build apk --release`（universal）或 `--target-platform=android-x64 --android-arm64` 多架构 | 2026-09-21 |
| 14 | `flutter build apk --target-platform=android-arm64 --split-per-abi` 只生 arm64（37MB），emulator 装不上 | **默认 `flutter build apk --release`**（universal 多架构）| 2026-09-21 |
| 15 | 远端 `origin` 默认指向 gitee，pull 不到 github 最新代码 | **远端必须 `git fetch github` + `git reset --hard github/<branch>`** | 2026-09-21 |
| 16 | `subprocess.run(['cd', dir, '&&', 'cmd'])` 因 `'cd'` 是 shell builtin 找不到 | **Python 用 `workdir=` 参数**或 `cwd=` 或 `os.chdir`，不要把 `cd` 传进 argv | 2026-09-21 |
| 17 | `AppConfig.apiBaseUrl` 默认值 `'http://10.0.2.2:3000'` (emulator localhost) → 真机用户 version-check 永远打不通 → **永远不会触发 forceUpgrade 弹窗** | **默认必须为真测试域名 `http://{{TEST_SERVER_IP}}`**（保证未 dart-define 编译的老 APK 也能直连测试环境） | 2026-09-21 |
| 18 | `AppConfig.apiEncryptionKey` 默认值 `'qloapps_api_secret_key_2026_!@'` 与服务端真 64 字符 key 不匹配 → CryptoInterceptor 解密失败 → **version-check 响应静默解不出 data → 不弹窗** | **build 必须传 `--dart-define=API_ENCRYPTION_KEY=<真key>`**（脚本 `scripts/app-build.sh` line 102-104 已自动从容器取）。生产强制升级链路依赖此。 | 2026-09-21 |
| 19 | Flutter `String.fromEnvironment` 默认值在常量池，cache invalidation 不彻底 — 旧 build 的默认值字符串 (`10.0.2.2:3000`) 仍嵌在 APK 中 | **强制 flutter clean + 看 APK strings 验证 dart-define 真生效**（不应含旧默认值） | 2026-09-21 |
| 20 | `web_shell_page.dart` line 87/149 硬编码 `'http://{{TEST_SERVER_IP}}'` 而非 `AppConfig.webBaseUrl` | **不影响 version-check**，但容易让人误以为 app 已经 dart-define 化了。实际上 web 走硬编码，API 走 dart-define。 | 长期 (未修) |
| 21 | `subprocess.run(['cd', ...])` 跑脚本不传 `cwd=` → cwd 不对导致 `.env.test` source 失败 → `API_BASE_URL` 用错默认值 | **subprocess 必须显式传 `cwd=` + `env=...` + 把 env vars 显式 export**（不要依赖 shell 继承） | 2026-09-21 |

**踩坑入册流程**（主负责人亲自验证，不信子田蛙结论）:

1. **第一现场**: 子田蛙/雨蛙/玻璃蛙报告错误 → 主负责人亲自 grep + 验证根因（必须 verify_evidence 协议: PIL 像素 / git log / curl 实测）
2. **第二现场**: 写入 `.agents/skills/<relevant-skill>/learning/<YYYY-MM-DD>-<pattern>.md`
3. **第三现场**: `npm run workflow:learning:record -- --type failure --pattern <pattern> --scope <feature> --summary "<事实>" --prevention "<修复>"`
4. **永久化**: 累计 3 次同 pattern + 45 天内有活跃度 → 自动写入 `active-rules.md`，主负责人复审后人工合并到 SKILL.md §5.1 本表

**禁止**: 脚本、Hook 或 Agent 自动改写 SKILL.md / AGENTS.md。所有永久规则升级必须人工审批。

### 5.2 learning/ 自动化晋升机制（与 feature-development-workflow §0.2 联动）

`.agents/skills/feature-development-workflow/learning/` 提供 `npm run workflow:learning:record` 自动记录与晋升。同样的根因必须复用同一 `pattern`：

- 累计 3 条证据 + 45 天内有活跃度 → 自动写入 `active-rules.md`
- 用户/项目负责人明确批准 → 人工修改 SKILL.md（如本节 §5.1）

---

## 6. 跨 IDE 与 CI 协同操作指引
## 6. 跨 IDE 与 CI 协同操作指引

无论是在 **Claude Code**、**Cursor**、**VS Code** 还是 **WebStorm** 中开发：
- 随时运行 `npm run test:pglite` 验证当前单测；
- 修改完页面交互后运行 `npm run test:e2e:pglite` 进行脱机真机快照回归；
- 提交前运行 `npm run rules:check` 与 `npm test`，确保规则未退化且架构边界完好。

### 6.1 Multi-Arch 构建与移动端/移动 H5 全链路 E2E 验证（端到端构建验证规范）

凡涉及**移动端 App + 移动 H5**双端的功能闭环，必须按本节执行 Multi-Arch 构建 + 跨端一致性 E2E 验证。

#### 6.1.1 Flutter App Multi-Arch 构建强制规范

1. **emulator 与真机必须都能装** —— `libflutter.so` 必须包含 `arm64-v8a` + `x86_64` 双架构。`armeabi-v7a` (32位 ARM) 已过时，可不打包。
2. **构建产物形式**:
   - `flutter build apk --release` 默认 universal APK（含全部架构），**1 个 APK = emulator + 真机通用**。适合快速验证 + 灰度。
   - `flutter build apk --release --split-per-abi --target-platform=android-arm64` 单架构 (~37MB)，仅适合已知目标设备（如真机发版）。
   - **不推荐** 三 ABI 分架构（72MB），体积过大且 `armeabi-v7a` 无意义。
3. **构建验证命令**:
   ```bash
   # Universal APK（含 arm64 + x86_64，emulator + 真机通用）
   flutter clean
   flutter pub get
   flutter build apk --release
   
   # 验证 APK 含多架构
   unzip -l build/app/outputs/flutter-apk/app-release.apk | grep "lib/"
   # 必须看到 lib/arm64-v8a/libflutter.so 和 lib/x86_64/libflutter.so
   ```
4. **归档命名**: `大眼蛙-<version>-<feature>-<env>.apk`，例：`大眼蛙-0.1.71-release-直播声音+底部紧凑-多架构-测试环境.apk`

#### 6.1.2 Flutter ↔ 移动 H5 一致性 E2E 验证（DS + PRE 联合）

Flutter App 通过 `flutter_inappwebview` 加载移动 H5 (mobile-web 真域名)，双端共享同一后端 API。验证必须**双端对比**，不能只测一端。

**双端必跑清单**:

| 项目 | 移动 H5 (浏览器) | Flutter App (emulator) |
|---|---|---|
| sticky top-0 数量 | `getComputedStyle(el).position === 'sticky'` | PIL 像素验证 + getComputedStyle |
| video muted | `video.muted` | `am start` + 截图中央像素 (非黑屏) |
| 卡片跳转链接 | 抓所有 `<a>` href | 同样的 href (WebView 同源) |
| API 数据 | curl `/api/...` | 同样的 API |
| 真机视频声音 | 不可在浏览器验 | **必须真机 + Flutter App** |
| 真机底部 Tab 紧凑 | 不可在浏览器验 | **必须真机 + Flutter App** |

**Flutter 端特殊修复**:
- **直播静音**: 必须在 `flutter_inappwebview` 加 `mediaPlaybackRequiresUserGesture: false`（Android WebView 默认需要手势才能播放音频）。
- **status bar / safe-area**: 用 `SystemChrome.setSystemUIOverlayStyle` 让 SPA 真实感知 status bar 高度，不要在 SPA 内硬编码。
- **底部 Tab 紧凑**: Flutter 端 `_buildBottomBar` 直接调高度（不受 H5 影响），跟抖音对比 ~50dp。

#### 6.1.3 端到端部署链路 E2E 验证（PRE 强约束）

**完整链路**: `git push → 远端真 build → 镜像 tag 翻转 → 容器重建 → emulator 装 APK → Playwright 验证 H5`

每一步都有**镜像 ID 验证**（不能是 rename，必须是真正 build）:

```bash
# 1. git push
git push origin feat/expo-rewrite

# 2. 远端 git fetch github + 真 build（不是 docker save/load rename）
ssh {{DEPLOY_SERVER}} 'git fetch github feat/expo-rewrite:feat/expo-rewrite && \
  docker build --build-arg NEXT_PUBLIC_API_ENCRYPTION_KEY="$KEY" \
  -t {{APP_NAME}}:r<tag> .'

# 3. 验证新镜像 ID != 旧 ID（避免 rename 假 build）
docker images {{APP_NAME}}:r<tag> --format "{{.ID}}"
# 必须 != 上一个 tag 的 ID (如 5c648b9f6944)

# 4. tag 翻转 + 容器重建
docker tag {{APP_NAME}}:latest {{APP_NAME}}:rollback-pre-$(date -u +%Y%m%dT%H%M%SZ)
docker tag {{APP_NAME}}:r<tag> {{APP_NAME}}:latest
cd ~/workspace/{{PROJECT_NAME}} && docker compose up -d --force-recreate --no-deps app app-web

# 5. 等 8s health check
docker ps -a --filter "name=qloapps" --format "{{.Names}}\t{{.Image}}\t{{.Status}}"

# 6. emulator 装 APK（必须是 multi-arch）
adb -s emulator-5554 install -r ~/Desktop/<apk-name>.apk

# 7. Playwright 验证 H5 全部功能（参考本 skill §3.5 + §3.6 + §4）
```

**反向验证**: 任何一步假 build / 假部署都必须在运行前发现，禁止推进到下一步。

#### 6.1.4 验证通过后强制触发 App 增量更新（DS+PRE 强约束）

**链路完整闭环**: 上述 §6.1.3 验证 PASS 后，**必须**触发 App 增量更新发布，让真机用户立即收到新包。

**触发流程**:

1. **AppRelease 数据库登记新版本**（参考 {{PROJECT_NAME}} `docs/architecture/app-release.md`）：
   - `version`: `<major>.<minor>.<patch>`（如 `0.1.72`）
   - `versionCode`: 自增整数（`0.1.71+71` → `0.1.72+72`）
   - `environment`: `STAGING` / `PRODUCTION`
   - `platform`: `android`
   - `appType`: `cend` (C端) / `merchant` (商户后台) / `admin` (平台后台)
   - `releaseNotes`: 简明变更清单（中文，1-3 行）
   - `downloadUrl`: 桌面 APK 路径或 CDN 链接
   - `forceUpdate`: `false`（首次发布）/ `true`（强制升级，阻塞旧版本）
   - `minSupportedVersion`: 最低支持版本（如 `0.1.60`，低于此版本强制升级）
   - `enabled`: `true`
2. **AppRelease.publish / upsert**：通过 `prisma.appRelease.upsert()` 写库，保证幂等。
3. **version-check API 验证**:
   ```bash
   curl "http://{{TEST_SERVER_IP}}/api/app/version-check?platform=android&currentVersion=0.1.70&appType=cend&deviceId=test-device"
   ```
   应返回新版本信息（`latestVersion: 0.1.72`, `downloadUrl`, `forceUpdate` 等）。
4. **Flutter App 启动时主动检查**:
   - `main.dart` 或 `app_version_check.dart` 在 `AppLifecycleState.resumed` 时调用 `/api/app/version-check`
   - 解析响应，若 `latestVersion > currentVersion`：
     - `forceUpdate: true` → 阻塞显示强制升级弹窗（仅"立即更新"按钮，禁用关闭）
     - `forceUpdate: false` → 显示软提示（带"稍后"/"立即更新"按钮）
   - APK 下载走 `downloadUrl`，MD5 校验后启动安装
5. **CDN / 文件分发**（可选）:
   - 桌面 APK → 对象存储 (MinIO/S3/OSS) → `downloadUrl` 指向 CDN
   - 或本地：`file:///sdcard/Download/xxx.apk`（emulator 测试用）
6. **监控增量更新成功率**:
   - `version-check` API 的 QPS / 命中率
   - App 启动主动上报版本号 → `app_version_reports` 表
   - 灰度比例（10% → 50% → 100%）控制增量更新节奏

**反例（禁止）**:
- 验证 PASS 但忘了登记 AppRelease，用户拿不到更新
- 只在生产环境登记，staging 不测增量链路
- `downloadUrl` 写死桌面路径，不上 CDN
- 没有 `forceUpdate` 字段，关键修复无法强制升级

**与 §6.1.3 链路的关系**:
- §6.1.3 验证 PASS → §6.1.4 触发增量更新
- 缺一不可：只 build 不增量 → 用户拿不到包；只增量不验证 → 线上翻车

**来源**: 2026-09-21 {{PROJECT_NAME}} 0.1.71 部署 + 验证 PASS 后真实场景：用户已确认视觉，但真机用户仍在用旧版。

**来源**: 2026-09-21 {{PROJECT_NAME}} 真实部署经验（commit 3599bf2f + 4d32affc + 0.1.71 + 部署田蛙 r20260920-4）。

### 6.2 跨 IDE 与 CI 协同操作指引

无论是在 **Claude Code**、**Cursor**、**VS Code** 还是 **WebStorm** 中开发：
- 随时运行 `npm run test:pglite` 验证当前单测；
- 修改完页面交互后运行 `npm run test:e2e:pglite` 进行脱机真机快照回归；
- 提交前运行 `npm run rules:check` 与 `npm test`，确保规则未退化且架构边界完好。

---

## 7. 跨项目移植与复用指南 (Portability & Adoption Guide)

如何将本 Skill 及其测试基础设施快速复用到新项目？请根据协作场景选择以下三种途径之一：

### 方式一：全局共享模式（最省心，本机所有项目立刻生效）
若希望本机的任何项目都能直接让 Antigravity 识别该 Skill，可将其软链接或复制到用户的全局配置目录：
```bash
# 创建 Antigravity 全局 skills 目录
mkdir -p ~/.gemini/config/skills/comprehensive-testing-workflow/

# 将本 Skill 链接或拷贝至全局
cp .agents/skills/comprehensive-testing-workflow/SKILL.md ~/.gemini/config/skills/comprehensive-testing-workflow/
```
*生效机制*: Antigravity 会自动递归扫描 `~/.gemini/config/skills/`，在任何新工作区打开时，模型均可按需调用该 Skill。

---

### 方式二：项目独立集成（推荐，团队通过 Git 共享）
在新项目中只需完成极简的三步即可获得同等能力的脱机沙箱测试体验：

1. **复制核心文件**:
   - 复制 `.agents/skills/comprehensive-testing-workflow/` 目录至新项目的 `.agents/skills/`；
   - 复制测试执行器目录 `scripts/testing/`（包含 `pglite-server.ts`, `run-with-pglite.ts` 等）至新项目的 `scripts/testing/`。

2. **安装极轻依赖（纯本地/脱机开发依赖）**:
   ```bash
   npm install -D @electric-sql/pglite pg-gateway
   ```

3. **配置 `package.json` 测试脚本**:
   ```json
   {
     "scripts": {
       "test:pglite": "tsx scripts/testing/run-with-pglite.ts vitest run",
       "test:e2e:pglite": "tsx scripts/testing/run-e2e-pglite.ts",
       "db:pglite": "tsx scripts/testing/pglite-server.ts --standalone"
     }
   }
   ```
*适配说明*:
- 若新项目使用 **Prisma**：`pglite-server.ts` 会自动调用 `prisma db push`；
- 若新项目使用 **Drizzle** 或 **TypeORM**：只需将 `pglite-server.ts` 中的 schema 推送命令替换为 `drizzle-kit push` 或目标迁移命令即可。

---

### 方式三：Antigravity Plugin 插件分发包（标准化企业套件）
可将测试规范、守卫规则与 Skill 打包为独立的 Plugin，存放在单独的公共 Git 仓库或 Git Submodule 中：
```text
plugins/comprehensive-testing-suite/
├── plugin.json       # 声明 {"name": "comprehensive-testing-suite"}
├── skills/
│   └── comprehensive-testing-workflow/
│       └── SKILL.md
└── rules/
    └── AGENTS.md     # 测试通用红线（防造数、防遮挡、API契约等）
```
在新项目中只需在根目录声明 `.agents/plugins/` 引入，团队所有成员拉取代码后开箱即用。

