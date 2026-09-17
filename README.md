# Palantir Agent Workflow Template

> 一套完整的 **AI 代理角色工程与质保工作流**模板，基于 Palantir Foundry 五大角色体系提炼，可直接迁移到任意全栈项目。

## 快速上手

```bash
git clone https://github.com/YOUR_ORG/palantir-agent-workflow-template.git
cd palantir-agent-workflow-template
bash scripts/setup.sh   # 交互式填写环境占位符
cp -r .agents .claude YOUR_PROJECT_ROOT/
```

## 环境占位符

| 占位符 | 说明 |
|:---|:---|
| `{{DEV_SERVER_IP}}` | 开发环境服务器 IP |
| `{{DEV_SSH_ALIAS}}` | 开发环境 SSH 别名 |
| `{{TEST_SERVER_IP}}` | 测试环境服务器 IP |
| `{{TEST_SSH_ALIAS}}` | 测试环境 SSH 别名 |
| `{{APP_IMAGE_NAME}}` | Docker 镜像名 |
| `{{CORE_CONTAINER_NAME}}` | 核心服务容器名 |
| `{{WORKSPACE_PATH}}` | 服务器上的项目路径 |

## 与 AI 工具集成

- **Antigravity**: `.agents/skills/` 放入项目根目录，运行时自动发现 Skills
- **Claude CLI**: `.claude/commands/` 放入项目根目录，斜杠命令自动生效

斜杠命令速查：`/fdse` / `/ds` / `/pre` / `/deploy-dev` / `/deploy-test` / `/deploy-prod`
