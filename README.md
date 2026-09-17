# Palantir Agent Workflow Template

> 一套完整的 **AI 代理角色工程与质保工作流**模板，基于 Palantir Foundry 五大角色体系提炼，可直接迁移到任意全栈项目。

## 包含 Skills

### 核心体系（自研）

| Skill | 路径 | 角色 | 说明 |
|:---|:---|:---|:---|
| `palantir-foundry-roles-workflow` | `.agents/skills/palantir-foundry-roles-workflow/` | 全部 | FDA/FDSE/DS/Core SWE/PRE 角色定义、职责、审查清单、六大红线 |
| `comprehensive-testing-workflow` | `.agents/skills/comprehensive-testing-workflow/` | DS + FDSE | PGlite 脱机沙箱、E2E Tab 遍历、死穴嗅探、环境握手、物理遮挡检测 |

### 图表可视化（来自 [archify](https://github.com/tt-a1i/archify)）

| Skill | 路径 | 角色 | 说明 |
|:---|:---|:---|:---|
| `archify` | `.agents/skills/archify/` | FDA + Core SWE | 生成架构图/工作流/时序图/数据流/生命周期图，独立 HTML，可交互导出 |

### 工程最佳实践（来自 [mattpocock/skills](https://github.com/mattpocock/skills)）

| Skill | 路径 | 角色 | 说明 |
|:---|:---|:---|:---|
| `tdd` | `.agents/skills/tdd/` | FDSE | 测试驱动开发，red-green-refactor 循环 |
| `code-review` | `.agents/skills/code-review/` | Core SWE + FDSE | 双轴代码审查（Standards + Spec），并行子代理 |
| `domain-modeling` | `.agents/skills/domain-modeling/` | FDA | 领域建模、CONTEXT.md、ADR 记录 |
| `diagnosing-bugs` | `.agents/skills/diagnosing-bugs/` | FDSE | 硬 Bug 与性能回归诊断循环 |

### 斜杠命令（Claude CLI）

| 命令 | 角色 | 场景 |
|:---|:---|:---|
| `/fdse` | FDSE 前线部署工程师 | 全栈功能开发、死穴消除、防御性测试 |
| `/ds` | DS 部署战略专家 | 业务旅程探路、UAT 验收、死穴嗅探 |
| `/pre` | PRE 产品可靠性工程师 | 环境版本握手、镜像发布治理 |

> **部署 SOP**（`/deploy-dev`、`/deploy-test`、`/deploy-prod`）由各项目按自身基础设施自行维护。

---

## 五大角色分工

```
         ┌──────────────────────────────────────┐
         │  FDA (Forward Deployed Architect)    │  顶层数据模型 / RBAC / 多租户边界
         │  → archify, domain-modeling          │
         └────────────────┬─────────────────────┘
                          │
         ┌────────────────┴─────────────────────┐
         │  Core SWE          │  PRE / SRE       │
         │  → code-review     │  → comprehensive  │
         │    archify         │    -testing       │
         └────────────────┬─────────────────────┘
                          │
         ┌────────────────┴─────────────────────┐
         │  FDSE  (交付责任人)                    │
         │  → tdd, diagnosing-bugs, code-review  │
         │    comprehensive-testing-workflow      │
         └────────────────┬─────────────────────┘
                          │
         ┌────────────────┴─────────────────────┐
         │  DS  (用户视角主审官)                  │
         │  → comprehensive-testing-workflow      │
         └──────────────────────────────────────┘
```

---

## 快速上手

```bash
# 克隆模板
git clone git@github.com:xaicd/palantir-agent-workflow-template.git

# 将 .agents 和 .claude 目录复制到你的项目
cp -r palantir-agent-workflow-template/.agents YOUR_PROJECT/
cp -r palantir-agent-workflow-template/.claude YOUR_PROJECT/

# 在项目的 CLAUDE.md / AGENTS.md 中引入角色说明（参考本仓库 CLAUDE.md）
```

## 使用 archify 生成架构图

需先安装 archify 运行时（一次性）：
```bash
npx skills add tt-a1i/archify -g
```

之后在 Agent 对话中描述系统，即可生成可交互架构图 HTML。

---

## 六大交付红线

1. ❌ 严禁测试"仅截图不点击"
2. ❌ 严禁只测默认 Tab，横向 Tab 必须 100% 遍历
3. ❌ 严禁提交含未声明变量的代码（tsc 0 报错）
4. ❌ 严禁在未对齐版本的测试环境上出具验收结论
5. ❌ 严禁发布无点击响应的假按钮
6. ❌ 严禁忽略控制台未捕获异常

## License

MIT
