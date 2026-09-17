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
| `/deploy-dev` | — | 开发环境 Docker 部署 SOP |
| `/deploy-test` | — | 测试环境 Docker 部署 SOP |
| `/deploy-prod` | — | 生产环境部署（须先完善锚点）|

### 六大交付红线（全角色共守）

1. ❌ 严禁测试"仅截图不点击"
2. ❌ 严禁只测默认 Tab，横向 Tab 必须 100% 遍历
3. ❌ 严禁提交含未声明变量的代码（tsc 0 报错强制要求）
4. ❌ 严禁在未对齐版本的测试环境上出具验收结论
5. ❌ 严禁发布无点击响应的假按钮
6. ❌ 严禁忽略控制台未捕获异常

---

## 部署 SOP（三套环境）

按目标环境选择斜杠命令，坑位详见项目 memory: `deploy-sop`。

**硬约束**（历史事故沉淀，跳过必出故障）：
- 禁止在服务器上构建镜像；一律本地 docker build → 传输。
- 加密 key 取容器运行时，禁打印/落盘，只经 $(...) 传递。
- 构建必须 --no-cache（否则 ENV layer 命中旧空值）。
- 重建容器必须 cd 到项目目录后无 -f 执行 docker compose up。
