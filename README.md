# Palantir Agent Workflow Template

> 一套完整的 **AI 代理角色工程与质保工作流**模板，基于 Palantir Foundry 五大角色体系提炼，可直接迁移到任意全栈项目。

## 包含内容

| 组件 | 路径 | 说明 |
|:---|:---|:---|
| 五大角色技能 | `.agents/skills/palantir-foundry-roles-workflow/` | FDA/FDSE/DS/Core SWE/PRE 角色定义、职责分工、审查清单与六大红线 |
| 综合测试工作流 | `.agents/skills/comprehensive-testing-workflow/` | PGlite 脱机沙箱、E2E Tab 遍历、死穴嗅探、环境握手、物理遮挡检测 |
| FDSE 斜杠命令 | `.claude/commands/fdse.md` | Claude CLI `/fdse` 角色激活 |
| DS 斜杠命令 | `.claude/commands/ds.md` | Claude CLI `/ds` 角色激活 |
| PRE 斜杠命令 | `.claude/commands/pre.md` | Claude CLI `/pre` 角色激活 |

> **部署 SOP 不在本模板中**，各项目按自身基础设施自行维护 `.claude/commands/deploy-*.md`。

## 五大角色分工

```
         ┌──────────────────────────────────────┐
         │  FDA (Forward Deployed Architect)    │  顶层数据模型 / RBAC / 多租户边界
         └────────────────┬─────────────────────┘
                          │
         ┌────────────────┴─────────────────────┐
         │  Core SWE          │  PRE / SRE       │
         │  编译守卫/边界门禁  │  环境对齐/发布治理 │
         └────────────────┬─────────────────────┘
                          │
         ┌────────────────┴─────────────────────┐
         │  FDSE  全栈实现 + 防御性测试 (交付责任人) │
         └────────────────┬─────────────────────┘
                          │
         ┌────────────────┴─────────────────────┐
         │  DS  业务旅程探路 + UAT 验收 (用户视角) │
         └──────────────────────────────────────┘
```

## 快速上手

```bash
# 克隆模板
git clone git@github.com:xaicd/palantir-agent-workflow-template.git

# 将 .agents 和 .claude 目录复制到你的项目
cp -r palantir-agent-workflow-template/.agents YOUR_PROJECT/
cp -r palantir-agent-workflow-template/.claude YOUR_PROJECT/

# 在项目的 CLAUDE.md / AGENTS.md 中引入角色说明（参考本仓库 CLAUDE.md）
```

## 与 AI 工具集成

- **Antigravity**: `.agents/skills/` 放入项目根目录，运行时自动发现 Skills
- **Claude CLI**: `.claude/commands/` 放入项目根目录，斜杠命令自动生效

斜杠命令速查：`/fdse` / `/ds` / `/pre`

## 六大交付红线

1. ❌ 严禁测试"仅截图不点击"
2. ❌ 严禁只测默认 Tab，横向 Tab 必须 100% 遍历
3. ❌ 严禁提交含未声明变量的代码（tsc 0 报错）
4. ❌ 严禁在未对齐版本的测试环境上出具验收结论
5. ❌ 严禁发布无点击响应的假按钮
6. ❌ 严禁忽略控制台未捕获异常

## License

MIT
