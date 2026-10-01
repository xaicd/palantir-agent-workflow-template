/**
 * 守卫：严禁数字员工与拟人测试脚本直连数据库 (no-direct-db-in-personas)
 * 
 * 核心法则：
 * 数字员工 (Claude Code CLI / Codex / Hermes) 以及 E2E 拟人测试必须 100% 模拟真实用户、
 * 商户主理人、平台审核员的真实 HTTP/Session 交互。
 * 
 * 严禁在 scripts/digital-employee/ 和 e2e/personas/ 下直接 import prisma / PrismaClient 
 * 或执行原始 SQL 写库！
 * 直连数据库会绕过：
 *   1. API 路由与 Zod 参数校验
 *   2. RBAC 鉴权与 DataScope 组织数据隔离
 *   3. 敏感词与合规风控拦截
 *   4. 业务状态机前置约束与事件通知 (EventBus / AuditLog)
 *   5. 缓存更新 (Redis Cache-Aside)
 * 导致"脚本测试全绿，线上真实用户一用就崩"的假拟人灾难。
 */

import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const TARGET_DIRS = [
  "scripts/digital-employee",
  "e2e/personas",
]

// 历史遗留底层基础设施脚本豁免 (待通过 API 改造收敛，禁止新增)
const EXEMPTIONS = new Set([
  // 历史底层异步视频任务落库管道 (待迁移为 /api/merchant/videos 内部调用)
  "scripts/digital-employee/shared/video-persister.ts",
  "scripts/digital-employee/video/sync-video-url.ts",
])

interface Violation {
  file: string
  line: number
  matchedPattern: string
  context: string
}

const FORBIDDEN_PATTERNS = [
  /@prisma\/client/,
  /@\/modules\/platform\/backend\/prisma/,
  /new\s+PrismaClient/,
  /\$executeRaw/,
  /\$queryRaw/,
]

function scanDirectory(dir: string, violations: Violation[]) {
  const fullPath = join(process.cwd(), dir)
  let entries: string[] = []
  try {
    entries = readdirSync(fullPath)
  } catch {
    return
  }

  for (const entry of entries) {
    const entryPath = join(fullPath, entry)
    const relPath = join(dir, entry)
    const stat = statSync(entryPath)

    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue
      scanDirectory(relPath, violations)
    } else if (stat.isFile() && (entry.endsWith(".ts") || entry.endsWith(".tsx") || entry.endsWith(".js"))) {
      if (EXEMPTIONS.has(relPath)) continue
      checkFile(entryPath, relPath, violations)
    }
  }
}

function checkFile(absPath: string, relPath: string, violations: Violation[]) {
  const content = readFileSync(absPath, "utf-8")
  const lines = content.split("\n")

  lines.forEach((line, idx) => {
    // 忽略纯注释行
    const trimmed = line.trim()
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) return

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(line)) {
        violations.push({
          file: relPath,
          line: idx + 1,
          matchedPattern: pattern.toString(),
          context: trimmed.slice(0, 100),
        })
      }
    }
  })
}

export function runNoDirectDbGuard(): { success: boolean; violations: Violation[] } {
  const violations: Violation[] = []
  for (const dir of TARGET_DIRS) {
    scanDirectory(dir, violations)
  }
  return {
    success: violations.length === 0,
    violations,
  }
}

// CLI 执行入口
if (process.argv[1]?.includes("no-direct-db-in-personas.guard")) {
  console.log("🔍 正在扫描数字员工与拟人测试脚本中的直连 DB 偷渡行为...")
  const { success, violations } = runNoDirectDbGuard()

  if (!success) {
    console.error(`\n❌ [GUARD_FAILED] 发现 ${violations.length} 处违规直连数据库行为！`)
    console.error("拟人测试与数字员工脚本严禁直连 Prisma / DB，必须 100% 走真实 HTTP API 链路：\n")
    for (const v of violations) {
      console.error(`  - ${v.file}:${v.line} 触发规则: ${v.matchedPattern}`)
      console.error(`    代码: ${v.context}`)
    }
    console.error("\n治理建议：使用 scripts/digital-employee/shared/http-session.ts 的 apiPost/apiGet 模拟真实网络请求。")
    process.exit(1)
  }

  console.log("✅ [GUARD_PASSED] 守卫通过：所有拟人测试与数字员工脚本均严格遵守 HTTP-first 协议，未发现直连数据库作弊行为。")
}
