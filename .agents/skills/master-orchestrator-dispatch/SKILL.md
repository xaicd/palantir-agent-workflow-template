---
name: master-orchestrator-dispatch
description: 主智能体 (Master Orchestrator / 总监) 派活与团队调度黄金 SOP。教主 Agent 如何拆解任务、选配五大角色 (FDA/FDSE/DS/PRE/Core SWE)、底座工位解耦、严查反谎报与反幻觉，提供标准 10 段式派活任务书与 4 项真改证据核验协议。适用于“派活给子智能体”“调度 Agent”“总监角色”“任务书模板”等场景。
---

# 主智能体 (Master Orchestrator) 派活与团队调度黄金 SOP

> **核心哲学**：**会派活的主 Agent，才能用好五大角色智能体员工。**
>
> 无论是 Hermes、Claude Code 还是 AGY 作为主持大局的总监（Orchestrator），严禁直接把未消化的模糊需求丢给子 Agent，也严禁轻信子 Agent 的“文字汇报”。必须严格遵守**“底座解耦、产物落盘、信息中转、真凭实据”**四大铁律。

---

## 一、 团队协同三大底层法制

```
                  用户 / 负责人（提出原始需求 / 架构拍板）
                                    │
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │   主智能体 / 总监 (Master Orchestrator)                  │
       │   - 拆解需求为原子任务                                    │
       │   - 撰写标准 10 段式任务书 (绝对路径 + 必读文件)           │
       │   - 绑定最适合的底座并派发                                │
       │   - 执行 verify_evidence 协议（查真 commit / 真改动）     │
       └────────────────────────────┬───────────────────────────┘
                                    │ 派发任务书（不传闲话）
                ┌───────────────────┴───────────────────┐
                ▼                                       ▼
       【下游施工队 / 专家角色】                 【质保守卫 / 验收角色】
       FDA 架构师 / FDSE 全栈工程师              Core SWE 静态门禁 / DS 业务验收
       (读仓库规范文件，按任务书执行)              (跑真实测试沙箱，出具四态结论)
                │                                       │
                └───────────────────┬───────────────────┘
                                    │ 交付物全量落盘（代码 / 截图 / 报告）
                                    ▼
                          仓库 Git 代码与测试报告
```

1. **角色与底座分离（Role vs Runtime Decoupling）**：
   * **角色与岗位是永久的**（如 FDSE 负责全栈交付，DS 负责业务真实验收）；
   * **CLI 与模型底座只是工位**（如 AGY、Claude Code CLI、CommandCode、Hermes 等）；
   * 任何底座遭遇额度受限、风控或上下文拥堵时，**总监只需换绑调用命令重新派发，角色职责与规范纹丝不动**。
2. **产物全量落盘（Filesystem Truth）**：
   * 任何交付成果必须体现在仓库真实文件中（Git Commit、测试用例、截图文件、审计报告）；
   * **凡是留在会话上下文里、未落盘到文件系统的产物，一律视为未交付**。
3. **信息走总监中转（No Peer-to-Peer Agent Chatting）**：
   * 智能体之间**严禁无序自由聊天**，防止上下文指数级膨胀与幻觉传递；
   * 上游产物落盘为文件，总监提取文件路径作为任务书输入派给下游；下游只读文件，不读上游长会话。

---

## 二、 派活前必查：总监 10 问自检清单

在主 Agent 组装任务命令、调用 `invoke_subagent` 或通过终端唤起子 Agent 之前，**必须在内心逐一确认以下 10 项**：

```
[ ] 1. WORKDIR 明确：是否指定了 cd <绝对工程路径>？
[ ] 2. SYNC 先行：是否要求子 Agent 动工前先 git pull / git status 确认分支干净？
[ ] 3. BRANCH 对齐：是否指定了目标操作分支（如 master / dev）与当前最新 Commit？
[ ] 4. PATH 绝对化：任务涉及的所有文件是否全部使用绝对路径（禁止相对路径）？
[ ] 5. READ FIRST 强制：是否强制要求“改动前必须先完整 read_file，严禁盲目覆写”？
[ ] 6. 1 COMMIT 原则：一次任务涉及的关联文件修改，是否要求合并为 1 个原子规范 Commit？
[ ] 7. VERIFY 证据协议：是否明确要求输出 4 项真实证据（Commit Hash + diff + 截图 + 报告）？
[ ] 8. REPORT 规范：报告落盘路径是否明确，大小是否要求 > 1KB？
[ ] 9. NO HALLUCINATION 禁令：是否明确警告“没改就说没改，严禁伪造 Hash 或路径”？
[ ] 10. SCOPE 边界锁死：是否明确指出了“禁止越界操作的范围”（如不要碰部署、不要私自改构建）？
```

---

## 三、 标准 10 段式派活任务书模板 (Task Spec)

当主 Agent 准备向子 Agent 派发任务时，推荐使用此模板组装 Prompt（可直接写入临时文件传递，防止转义乱码）：

```markdown
你是 [角色名]（如：FDSE 全栈工程师 / 岗位代号）.
任务目标：[一句话讲清本次任务核心目标，不拖泥带水].

一、 业务上下文背景：
[3~5 行简述需求来源、涉及模块与技术背景]

二、 前置操作（动工前必跑）：
1. WORKDIR: cd {{PROJECT_ROOT}}
2. SYNC: git pull --rebase origin {{TARGET_BRANCH}}
3. STATUS: git status 确认工作区无脏文件
4. BRANCH: 确认当前处于 {{TARGET_BRANCH}}，记录最新 HEAD Commit

三、 必须参考的规范与 Skill（必读）：
- AGENTS.md (最高常青宪法与六大交付红线)
- .agents/skills/[对应技能名]/SKILL.md (本领域的权威规程)
- [涉及的架构或设计文档路径]

四、 涉及文件绝对路径清单：
- {{PROJECT_ROOT}}/src/path/to/target1.ts
- {{PROJECT_ROOT}}/src/path/to/target2.tsx

五、 具体执行步骤（5 步闭环）：
1. read_file：完整读取上述目标文件，理解现有架构与上下文；
2. patch：针对性修改，禁止大面积盲目覆盖已有无关代码；
3. git diff：运行 git diff --stat 自行检查改动幅度与准确性；
4. test：运行对应的单测/沙箱测试/Playwright 验证；
5. commit：完成修改后提交规范的 Git Commit。

六、 验收门禁 (Verify Evidence 4 项必输证据，缺一不可)：
1. 真实 Commit Hash：`git log -1 --format=%H` 输出值（必须真实可查）；
2. 真实 Diff 摘要：`git diff HEAD~1 HEAD --stat` 输出；
3. 真实截图或输出日志路径：如 `ls -lh test-results/screenshots/[name].png`（必须文件真实存在）；
4. 真实报告路径：`docs/audit/[date]/[task-name]-report.md`（必须落盘且 > 1KB）。

七、 严禁违规红线 (Anti-Hallucination)：
- ❌ 严禁编造任何 Commit Hash、文件路径或测试结果；
- ❌ 遇到测试未跑通或接口报错，据实汇报失败原因与堆栈，禁止使用伪造数据谎报全绿；
- ❌ 严禁直连数据库写库绕过业务 API；
- ❌ 严禁提交包含 TypeScript 编译报错的代码。
```

---

## 四、 派活后核验：`verify_evidence` 协议 (防谎报与幻觉)

> **惨痛教训**：子 Agent 在高压或长链路上极易产生汇报幻觉——声称“已全部修复、测试全绿、提交了 Commit `2e4719ce`”，但主 Agent 去查时发现没有该 Commit、截图文件不存在、代码甚至根本没改动。

**主 Agent 收到完成汇报后的第一件事：绝不直接向用户报捷，必须立刻执行机器验证！**

```bash
# 1. 验证 Commit 是否真存在
git log -1 --format="%H %s" | grep "<子Agent汇报的Hash前缀>" || { echo "❌ 谎报：Commit 不存在！"; exit 1; }

# 2. 验证代码是否真有实质改动
git diff HEAD~1 HEAD --stat | grep -q "files changed" || { echo "❌ 谎报：无实质代码改动！"; exit 1; }

# 3. 验证截图与测试报告是否真实落盘且非空
ls -lh <子Agent汇报的截图路径> || { echo "❌ 谎报：截图文件不存在！"; exit 1; }
test -s <子Agent汇报的报告路径> || { echo "❌ 谎报：报告文件为空！"; exit 1; }

# 4. 跑自动化守卫复查
npm run guard:no-direct-db
```

**结论**：上述 4 项检查全部为真（Green），总监才可合并代码并向用户/上层汇报。任一失败，立即打回并定位根因返修。

---

## 五、 测试与运营智能体核心验收硬门禁 (Testing & Operations)

在调度 **DS（部署战略专家）** 与 **数字员工运营（Hermes / Agent Ops）** 时，必须牢记三大真实验收铁律：

### 1. 拒绝自我安慰：`status === 200 + success === true`
- 业务测试与 E2E 验证必须严格断言业务返回成功（`status === 200` 且 JSON 体内 `success === true`）；
- 严禁用 `expect(res.status).toBeLessThan(500)`（只要不崩就算过）自我安慰；
- 接口抛出 `400` 或 `422` 参数校验失败时必须追查服务端 Schema 漏配，严禁跳过。

### 2. 多媒体与附件真实可访问性拦截
- 凡是表单涉及图片、视频、课件上传的，上传完成后**必须通过 HTTP 真实探针访问其 URL**；
- 若资源返回 404、死链或尺寸为 0，**必须在保存阶段直接拦截提交**，坚决杜绝带有假图、死图的脏数据入库。

### 3. 零空白与真实闭环
- **零空白**：页面不得裸露灰底空占位，强制三级防御图池兜底；
- **全链路走通**：从前台选品、算价、下单、审核到核销，状态机推进必须 100% 闭环。
