export type RuleStatus = "HOT_FIX" | "GUARDED" | "ARCHIVED"

export interface RuleLifecycleEntry {
  /** 唯一规则编号 */
  id: string
  /** 业务领域或所属模块 */
  domain: string
  /** 简明标题 */
  title: string
  /** 当前生命周期状态: HOT_FIX(观察纠偏中) | GUARDED(已具备守卫) | ARCHIVED(已稳定归档留索引) */
  status: RuleStatus
  /** 一句话常青核心禁令/红线 (留在 AGENTS.md 的浓缩表述) */
  coreRedline: string
  /** 对应的静态守卫或自动化测试验证路径 */
  guardrail: string
  /** 权威规范或技能文档指针 (点击查阅完整排错细节) */
  specDoc: string
  /** 归档文档指针 (可选) */
  archiveDoc?: string
}

/**
 * 通用 Agent 工程规则生命周期注册表
 * 用于自动驱动 AGENTS.md 精简、健康度审计与归档同步
 */
export const RULES_LIFECYCLE_REGISTRY: RuleLifecycleEntry[] = [
  {
    id: "RULE-NO-DIRECT-DB",
    domain: "数据隔离与拟人测试",
    title: "严禁脚本与智能体直连数据库",
    status: "ARCHIVED",
    coreRedline: "数字员工与拟人测试必须 100% 走真实 HTTP API，严禁直接 import ORM 或执行原始 SQL 写库",
    guardrail: "scripts/guardrails/no-direct-db-in-personas.guard.ts",
    specDoc: "AGENTS.md",
  },
  {
    id: "RULE-ROLLBACK-5MIN",
    domain: "发布治理与高可用",
    title: "5分钟快速回滚承诺",
    status: "ARCHIVED",
    coreRedline: "任何发布动作前必须保留 rollback-pre-<TIMESTAMP> 回滚快照，故障 5 分钟内执行单行回滚",
    guardrail: ".agents/skills/rollback-discipline/SKILL.md",
    specDoc: "AGENTS.md",
  },
  {
    id: "RULE-ENV-INJECTION",
    domain: "容器与部署环境",
    title: "Docker Compose 环境变量严格注入",
    status: "ARCHIVED",
    coreRedline: "严格区分镜像构建期 (baked env) 与容器运行期 (runtime env)，防 force-recreate 不读环境变量陷阱",
    guardrail: ".agents/skills/docker-compose-env-discipline/SKILL.md",
    specDoc: ".agents/skills/docker-compose-env-discipline/SKILL.md",
  },
  {
    id: "RULE-ANTI-FAKE-DATA",
    domain: "数据真实性与风控",
    title: "禁装饰性造数与死图死链",
    status: "ARCHIVED",
    coreRedline: "严禁在页面写死假数字与英文占位符；图片必须实施三级防御策略，业务必须跑通真实资金与状态机闭环",
    guardrail: "scripts/tools/business-content-validator.ts",
    specDoc: "AGENTS.md",
  },
  {
    id: "RULE-COMMIT-CROSS-SESSION",
    domain: "智能体协同与版本同步",
    title: "跨会话 Commit 与双远端同步纪律",
    status: "ARCHIVED",
    coreRedline: "涉及 SOP、Skill 或部署配置变动，必须双远端推送 (origin + 镜像仓)，防止跨智能体会话脱节",
    guardrail: ".agents/skills/commit-discipline-cross-session/SKILL.md",
    specDoc: ".agents/skills/commit-discipline-cross-session/SKILL.md",
  },
  {
    id: "RULE-INCIDENT-POSTMORTEM",
    domain: "质量事故与归档",
    title: "破坏性事故复盘 4 件套",
    status: "ARCHIVED",
    coreRedline: "发生破坏性故障后 30 分钟内必须产出：根因 + 检测信号 + 拦截门禁 + 沉淀路径",
    guardrail: ".agents/skills/incident-postmortem/SKILL.md",
    specDoc: ".agents/skills/incident-postmortem/SKILL.md",
  }
]
