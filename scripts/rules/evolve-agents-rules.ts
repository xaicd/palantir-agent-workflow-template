import { promises as fs } from "node:fs"
import path from "node:path"
import { RULES_LIFECYCLE_REGISTRY, RuleLifecycleEntry } from "./rules-lifecycle.config"

const ROOT = process.cwd()
const AGENTS_PATH = path.join(ROOT, "AGENTS.md")
const MAX_RECOMMENDED_SIZE_BYTES = 36 * 1024 // 推荐上限 36KB (约 11,000 tokens)

export function renderRulesMatrix(entries: RuleLifecycleEntry[]): string {
  const archived = entries.filter((e) => e.status === "ARCHIVED")
  const lines: string[] = [
    "| 规则编号 | 业务域与主题 | 核心红线与禁令（强制遵守） | 守护测试 / 静态拦截 | 权威规范与归档指针 |",
    "|---|---|---|---|---|",
  ]

  for (const item of archived) {
    const docLinks = item.archiveDoc 
      ? `[归档细则](${item.archiveDoc})<br>[权威规范](${item.specDoc})`
      : `[权威规范](${item.specDoc})`
    lines.push(
      `| \`${item.id}\` | **${item.domain}**<br>${item.title} | ${item.coreRedline} | \`${item.guardrail}\` | ${docLinks} |`
    )
  }

  return lines.join("\n")
}

async function verifyEntryPaths(entries: RuleLifecycleEntry[]): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []
  for (const item of entries) {
    if (item.archiveDoc) {
      const archivePath = path.join(ROOT, item.archiveDoc)
      try {
        await fs.access(archivePath)
      } catch {
        errors.push(`[${item.id}] 归档文档不存在: ${item.archiveDoc}`)
      }
    }

    if (item.specDoc) {
      const specPath = path.join(ROOT, item.specDoc)
      try {
        await fs.access(specPath)
      } catch {
        errors.push(`[${item.id}] 规范文档不存在: ${item.specDoc}`)
      }
    }

    if (item.guardrail) {
      const guardPath = path.join(ROOT, item.guardrail)
      try {
        await fs.access(guardPath)
      } catch {
        errors.push(`[${item.id}] 守卫/测试路径不存在: ${item.guardrail}`)
      }
    }
  }
  return { valid: errors.length === 0, errors }
}

async function auditAgentsFile() {
  const stat = await fs.stat(AGENTS_PATH)
  const content = await fs.readFile(AGENTS_PATH, "utf-8")
  const lines = content.split(/\r?\n/).length
  const bytes = stat.size
  const approxTokens = Math.round(content.length / 2.2) // 中英混排约 2.2 字符/token

  process.stdout.write("\n=======================================================\n")
  process.stdout.write("  AGENTS.md 规则生命周期与健康度审计报告\n")
  process.stdout.write("=======================================================\n")
  process.stdout.write(`- 文件路径: ${path.relative(ROOT, AGENTS_PATH)}\n`)
  process.stdout.write(`- 总行数: ${lines} 行\n`)
  process.stdout.write(`- 总字节: ${(bytes / 1024).toFixed(2)} KB (${bytes} 字节)\n`)
  process.stdout.write(`- 预估上下文 Token 消耗: ~${approxTokens.toLocaleString()} tokens\n`)

  const statusColor = bytes <= MAX_RECOMMENDED_SIZE_BYTES ? "PASS [健康]" : "WARN [偏重]"
  process.stdout.write(`- 体积健康评级: ${statusColor} (上限目标: ≤ 32 KB)\n`)

  process.stdout.write("\n-------------------------------------------------------\n")
  process.stdout.write("  规则生命周期库验证 (Rule Lifecycle Registry)\n")
  process.stdout.write("-------------------------------------------------------\n")

  const archivedCount = RULES_LIFECYCLE_REGISTRY.filter((e) => e.status === "ARCHIVED").length
  const guardedCount = RULES_LIFECYCLE_REGISTRY.filter((e) => e.status === "GUARDED").length
  const hotfixCount = RULES_LIFECYCLE_REGISTRY.filter((e) => e.status === "HOT_FIX").length

  process.stdout.write(`- 已稳定归档 (ARCHIVED): ${archivedCount} 条\n`)
  process.stdout.write(`- 守卫固化中 (GUARDED):  ${guardedCount} 条\n`)
  process.stdout.write(`- 近期观察期 (HOT_FIX):  ${hotfixCount} 条\n`)

  const verification = await verifyEntryPaths(RULES_LIFECYCLE_REGISTRY)
  if (!verification.valid) {
    process.stderr.write("\n[发现路径异常]:\n")
    for (const err of verification.errors) {
      process.stderr.write(`  ❌ ${err}\n`)
    }
  } else {
    process.stdout.write("  ✅ 所有规则归档与规范指针路径 100% 有效！\n")
  }

  // 检查 AGENTS.md 中是否包含了归档索引矩阵标识
  const hasMatrix = content.includes("已稳定规则归档与业务专项索引矩阵") || content.includes("RULE-MKT-CONCURRENCY")
  if (hasMatrix) {
    process.stdout.write("  ✅ AGENTS.md 已成功挂载归档索引矩阵，常青进化机制已生效！\n")
  } else {
    process.stdout.write("  ℹ️ AGENTS.md 尚未包含归档索引矩阵，可运行 --render-matrix 查看生成块。\n")
  }
  process.stdout.write("=======================================================\n\n")

  if (!verification.valid) {
    process.exit(1)
  }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes("--render-matrix")) {
    process.stdout.write(renderRulesMatrix(RULES_LIFECYCLE_REGISTRY) + "\n")
    return
  }

  await auditAgentsFile()
}

main().catch((err) => {
  process.stderr.write(`审计失败: ${String(err)}\n`)
  process.exit(1)
})
