# Palantir Agent Workflow — Claude CLI 集成说明

本文件为模板示例，展示如何在项目的 CLAUDE.md 中集成 Palantir 角色体系。
复制以下内容到你的项目 CLAUDE.md 中，按项目实际情况修改。

---

## Palantir Foundry 全角色工程与质保体系

详见 `.agents/skills/palantir-foundry-roles-workflow/SKILL.md`。

### 斜杠命令速查

| 命令 | 角色 | 场景 |
|:---|:---|:---|
| `/fdse` | FDSE 前线部署工程师 | 全栈功能开发、死穴消除、防御性测试 |
| `/ds` | DS 部署战略专家 | 业务旅程探路、UAT 验收、死穴嗅探 |
| `/pre` | PRE 产品可靠性工程师 | 环境版本握手、镜像发布治理 |

> 部署 SOP 命令（`/deploy-dev`、`/deploy-test`、`/deploy-prod`）由各项目自行维护，
> 不在本模板中提供，请参考项目 `docs/operations/` 目录。

### 六大交付红线（全角色共守）

1. ❌ 严禁测试"仅截图不点击"
2. ❌ 严禁只测默认 Tab，横向 Tab 必须 100% 遍历
3. ❌ 严禁提交含未声明变量的代码（tsc 0 报错强制要求）
4. ❌ 严禁在未对齐版本的测试环境上出具验收结论
5. ❌ 严禁发布无点击响应的假按钮
6. ❌ 严禁忽略控制台未捕获异常
