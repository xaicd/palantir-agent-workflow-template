#!/usr/bin/env bash
# ==============================================================================
# Palantir Agent Workflow Template — 通用 Skills 自动同步脚本
#
# 作用:
#   从业务主工程 (如 wenlv-next) 自动检测并同步通用、脱敏的优质 Skills 到模板仓库，
#   自动保持两端优质方法论、工具链与最佳实践持续对齐。
#
# 用法:
#   bash scripts/sync-skills.sh [--source /path/to/source-repo] [--push]
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_DIR="${1:-/root/workspace/wenlv-next}"
AUTO_PUSH=false

for arg in "$@"; do
  case "$arg" in
    --push)
      AUTO_PUSH=true
      ;;
    --source=*)
      SOURCE_DIR="${arg#*=}"
      ;;
  esac
done

if [[ ! -d "$SOURCE_DIR/.agents/skills" ]]; then
  echo "❌ 错误: 源目录不存在 Skills: $SOURCE_DIR/.agents/skills"
  exit 1
fi

echo "======================================================"
echo " 🔄 开始同步通用 Skills 到 Palantir 模板仓库"
echo " 源工程:   $SOURCE_DIR"
echo " 模板工程: $TEMPLATE_DIR"
echo "======================================================"
echo ""

# 定义允许同步的通用 Skills 白名单清单（排除包含特定单项目业务硬编码的私有技能）
SYNC_SKILLS=(
  "palantir-foundry-roles-workflow"
  "comprehensive-testing-workflow"
  "proxy-network-workflow"
  "ui-ux-pro-max"
  "video-to-transcript"
  "lecture-lesson-plan"
  "course-deck"
  "course-commerce-generation"
)

SYNC_COUNT=0

for skill in "${SYNC_SKILLS[@]}"; do
  SRC_PATH="$SOURCE_DIR/.agents/skills/$skill"
  DEST_PATH="$TEMPLATE_DIR/.agents/skills/$skill"

  if [[ -d "$SRC_PATH" ]]; then
    echo "📦 同步 Skill: $skill ..."
    mkdir -p "$DEST_PATH"
    cp -r "$SRC_PATH"/* "$DEST_PATH"/
    ((SYNC_COUNT++))
  else
    echo "⚠️ 跳过: 源仓库未找到 Skill [$skill]"
  fi
done

echo ""
echo "✅ 成功检查并同步了 $SYNC_COUNT 个通用技能！"
echo ""

# 检查模板仓库 Git 状态
cd "$TEMPLATE_DIR"
CHANGES=$(git status --short)

if [[ -z "$CHANGES" ]]; then
  echo "✨ 模板仓库中的所有 Skills 已是最新状态，无差异变更。"
  exit 0
fi

echo "📝 检测到以下变更文件:"
echo "$CHANGES"
echo ""

if [[ "$AUTO_PUSH" == true ]]; then
  echo "🚀 执行自动 Commit 与 Push..."
  git add .agents/skills/
  git commit -m "feat(skills): sync latest reusable skills from wenlv-next"
  git push origin master
  echo "🎉 已成功推送到远端模板仓库: origin/master"
else
  echo "💡 提示: 您可以进入 $TEMPLATE_DIR 查看 diff，并手动执行 git commit & push；或者带上 --push 参数自动提交推送。"
fi
