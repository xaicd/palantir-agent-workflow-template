#!/usr/bin/env bash
# AI Agent Workflow - 宿主机双端全自动验收脚本 (agent-browser + agent-device)
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$SCRIPT_DIR"

export PATH="$PATH:${ANDROID_HOME:-$HOME/android-sdk}/platform-tools"
RESULTS_DIR="${SCRIPT_DIR}/test-results/screenshots/host-dual-acceptance"
mkdir -p "$RESULTS_DIR"

# 参数解析: --env=dev|test (默认 dev), --domain=all|main (默认 all)
TARGET_ENV="dev"
DOMAIN="all"

for arg in "$@"; do
  case "$arg" in
    --env=*)
      TARGET_ENV="${arg#*=}"
      ;;
    --domain=*)
      DOMAIN="${arg#*=}"
      ;;
  esac
done

if [[ "$TARGET_ENV" == "dev" ]]; then
  BASE_WEB_URL="${DEV_BASE_URL:-http://127.0.0.1:80}"
else
  BASE_WEB_URL="${TEST_BASE_URL:-http://127.0.0.1:8080}"
fi

echo "======================================================================"
echo "🚀 [Host Dual Acceptance] 启动宿主机端到端全链路验收"
echo "======================================================================"
echo "目标环境: $TARGET_ENV ($BASE_WEB_URL)"
echo "执行业务域: $DOMAIN"
echo "产物存储目录: $RESULTS_DIR"
echo "Node 版本: $(node -v)"
echo "ADB 状态: $(adb devices | grep -E 'emulator|device' || echo '未检测到设备')"
echo "======================================================================"

# -----------------------------------------------------------------------------
# Part 1: 执行黄金业务全链路真实上架与交易闭环 (Agent Ops 引擎)
# -----------------------------------------------------------------------------
echo ""
echo "▶ 步骤 1/3: 执行业务黄金全链路自动化运营与反查门禁 ($DOMAIN @ $TARGET_ENV)..."
if [[ -f "scripts/agent-ops/cli.ts" ]]; then
  APP_ENVIRONMENT="$TARGET_ENV" E2E_BASE_URL="$BASE_WEB_URL" npx tsx scripts/agent-ops/cli.ts --domain="$DOMAIN" --env="$TARGET_ENV" --base-url="$BASE_WEB_URL"
else
  echo "  ℹ️ 未找到 scripts/agent-ops/cli.ts，跳过 Agent Ops 业务流执行"
fi

# -----------------------------------------------------------------------------
# Part 2: Desktop 桌面端商户与管理后台验收 (agent-browser)
# -----------------------------------------------------------------------------
echo ""
echo "▶ 步骤 2/3: 启动 agent-browser 进行桌面商户与管理端视觉快照验收 ($BASE_WEB_URL)..."

# 2.1 访问管理后台登录并截图
echo "  → [agent-browser] 访问管理后台并截图..."
npx agent-browser open "${BASE_WEB_URL}/login"
sleep 2
npx agent-browser screenshot "${RESULTS_DIR}/host-agent-browser-login.png"
echo "    ✓ 管理后台截屏已生成: ${RESULTS_DIR}/host-agent-browser-login.png"
npx agent-browser close || true

# -----------------------------------------------------------------------------
# Part 3: Android 移动端 App 真实视觉验收 (agent-device)
# -----------------------------------------------------------------------------
echo ""
echo "▶ 步骤 3/3: 启动 agent-device 进行 Android 真机/模拟器视觉快照验收..."

APP_PKG="${APP_PACKAGE_NAME:-com.example.app}"
if adb devices | grep -q "emulator-5554"; then
  echo "  → [agent-device] 检测到 emulator-5554 在线，唤起移动端客户端 ($APP_PKG)..."
  adb -s emulator-5554 shell am force-stop "$APP_PKG" || true
  sleep 1
  adb -s emulator-5554 shell am start -n "${APP_PKG}/.MainActivity" || true
  sleep 8

  SESSION_NAME="app-host-verify-$(date +%s)"
  echo "  → [agent-device] 建立会话 ${SESSION_NAME}..."
  npx agent-device open "$APP_PKG" --foreground --session "${SESSION_NAME}" || true
  sleep 2

  echo "  → [agent-device] 捕获 Android 客户端首页真机快照..."
  npx agent-device screenshot "${RESULTS_DIR}/host-agent-device-app-home.png" --session "${SESSION_NAME}" || adb -s emulator-5554 exec-out screencap -p > "${RESULTS_DIR}/host-agent-device-app-home.png"
  echo "    ✓ 客户端首页截屏已生成: ${RESULTS_DIR}/host-agent-device-app-home.png"

  echo "  → [agent-device] 获取当前界面无障碍语义树摘要..."
  npx agent-device snapshot -i --session "${SESSION_NAME}" > "${RESULTS_DIR}/host-agent-device-snapshot.txt" 2>&1 || true
  head -n 25 "${RESULTS_DIR}/host-agent-device-snapshot.txt" || true

  npx agent-device close --session "${SESSION_NAME}" || true
else
  echo "  ⚠️ 未检测到运行中的 Android 模拟器，跳过真机交互"
fi

echo ""
echo "======================================================================"
echo "🎉 [Host Dual Acceptance] 宿主机双端全自动验收完毕！"
echo "验收产物已归档至 ${RESULTS_DIR}/:"
ls -lh "${RESULTS_DIR}"/host-* || true
echo "======================================================================"
