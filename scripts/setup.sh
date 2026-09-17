#!/usr/bin/env bash
# Palantir Agent Workflow Template — 交互式初始化脚本
# 用法: bash scripts/setup.sh [--target /path/to/your-project]
set -euo pipefail

TARGET="${1:-$(pwd)}"
TEMPLATE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "======================================================"
echo " Palantir Agent Workflow Template — 初始化向导"
echo "======================================================"
echo ""
echo "请依次输入你的项目环境信息（直接回车使用括号内默认值）："
echo ""

read -rp "Docker 镜像名         (如 my-app):           " APP_IMAGE_NAME
read -rp "核心服务容器名         (如 myapp-core-server): " CORE_CONTAINER_NAME
read -rp "服务器上的项目路径     (如 ~/workspace/my-app): " WORKSPACE_PATH
echo ""
echo "--- 开发环境 ---"
read -rp "开发服务器 IP         (如 100.101.22.109):   " DEV_SERVER_IP
read -rp "开发服务器 SSH 别名    (如 dev-server):       " DEV_SSH_ALIAS
echo ""
echo "--- 测试环境 ---"
read -rp "测试服务器 IP         (如 192.168.1.100):    " TEST_SERVER_IP
read -rp "测试服务器 SSH 别名    (如 test-server):      " TEST_SSH_ALIAS
echo ""

# 验证必填项
for var in APP_IMAGE_NAME CORE_CONTAINER_NAME WORKSPACE_PATH DEV_SERVER_IP DEV_SSH_ALIAS TEST_SERVER_IP TEST_SSH_ALIAS; do
  if [[ -z "${!var}" ]]; then
    echo "❌ 错误: $var 不能为空，请重新运行脚本"
    exit 1
  fi
done

echo ""
echo "--- 即将写入目标目录: $TARGET ---"
echo "APP_IMAGE_NAME=$APP_IMAGE_NAME"
echo "CORE_CONTAINER_NAME=$CORE_CONTAINER_NAME"
echo "WORKSPACE_PATH=$WORKSPACE_PATH"
echo "DEV_SERVER_IP=$DEV_SERVER_IP  DEV_SSH_ALIAS=$DEV_SSH_ALIAS"
echo "TEST_SERVER_IP=$TEST_SERVER_IP  TEST_SSH_ALIAS=$TEST_SSH_ALIAS"
echo ""
read -rp "确认写入？(y/N) " CONFIRM
[[ "$CONFIRM" =~ ^[Yy]$ ]] || { echo "已取消"; exit 0; }

# 复制目录结构
echo ""
echo "📁 复制文件..."
mkdir -p "$TARGET/.agents/skills" "$TARGET/.claude/commands"
cp -r "$TEMPLATE_DIR/.agents/" "$TARGET/"
cp -r "$TEMPLATE_DIR/.claude/" "$TARGET/"

# 占位符替换函数
replace_placeholders() {
  local file="$1"
  sed -i \
    -e "s|{{APP_IMAGE_NAME}}|$APP_IMAGE_NAME|g" \
    -e "s|{{CORE_CONTAINER_NAME}}|$CORE_CONTAINER_NAME|g" \
    -e "s|{{WORKSPACE_PATH}}|$WORKSPACE_PATH|g" \
    -e "s|{{DEV_SERVER_IP}}|$DEV_SERVER_IP|g" \
    -e "s|{{DEV_SSH_ALIAS}}|$DEV_SSH_ALIAS|g" \
    -e "s|{{TEST_SERVER_IP}}|$TEST_SERVER_IP|g" \
    -e "s|{{TEST_SSH_ALIAS}}|$TEST_SSH_ALIAS|g" \
    "$file"
}

# 对部署命令文件执行替换
for f in "$TARGET/.claude/commands/deploy-dev.md" \
         "$TARGET/.claude/commands/deploy-test.md" \
         "$TARGET/.claude/commands/deploy-prod.md"; do
  [[ -f "$f" ]] && replace_placeholders "$f"
done

echo ""
echo "✅ 完成！以下文件已写入 $TARGET ："
echo "   .agents/skills/palantir-foundry-roles-workflow/SKILL.md"
echo "   .agents/skills/comprehensive-testing-workflow/SKILL.md"
echo "   .claude/commands/fdse.md  ds.md  pre.md"
echo "   .claude/commands/deploy-dev.md  deploy-test.md  deploy-prod.md"
echo ""
echo "📌 下一步："
echo "   1. 在项目的 CLAUDE.md / AGENTS.md 中引入角色体系说明（参考 README.md）"
echo "   2. 补全 .claude/commands/deploy-prod.md 中的生产环境锚点（§0）"
echo "   3. 在 Claude CLI 中输入 /fdse、/ds、/pre 激活对应角色"
