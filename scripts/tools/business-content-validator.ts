/**
 * 业务字段与内容合规全能校验器 (Business & Content Validator)
 * 
 * 核心目的：
 * 把踩过的坑（死链、404 图裂、广告法违禁词、非法负数、内网 SSRF 风险）
 * 固化为确定性、高效率的纯函数工具与守卫，支持数字员工自检与 CI 自动化拦截。
 */

// 1. 广告法违禁与绝对化用语库
const ABSOLUTE_WORDS = [
  "全网第一", "中国第一", "行业第一", "世界第一", "顶级", "国家级特供", 
  "军工特供", "绝无仅有", "万能", "包治百病", "绝对安全", "稳赚不赔", "零风险"
]

// 2. 违法违规与敏感词库
const ILLEGAL_SENSITIVE_WORDS = [
  "毒品", "枪支", "弹药", "爆炸物", "杀人", "自杀", "暴恐",
  "色情", "开房", "嫖娼", "三级片",
  "博彩", "六合彩", "高利贷", "套现", "刷单",
  "傻逼", "煞笔", "他妈的", "脑残"
]

// 3. 私网与 SSRF 阻断正则 (严禁指向内网地址)
const FORBIDDEN_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/, // Link-local / 云厂商元数据地址
  /^0\.0\.0\.0$/,
]

export interface ValidationIssue {
  field: string
  rule: "SENSITIVE_WORD" | "ABSOLUTE_WORD" | "INVALID_URL" | "SSRF_RISK" | "INVALID_NUMERIC" | "EMPTY_REQUIRED"
  message: string
  badValue?: unknown
}

export interface ProductPayloadToValidate {
  name?: string
  description?: string
  coverImage?: string
  images?: string[]
  price?: number
  stock?: number
  categoryId?: string
}

export class BusinessContentValidator {
  /**
   * 快速文本合规自检 (返回 passed 与 issue 消息列表)
   */
  public static validateText(text: string | undefined | null, field = "文本"): { passed: boolean; issues: string[] } {
    const issues = this.checkTextContent(field, text)
    return { passed: issues.length === 0, issues: issues.map((i) => i.message) }
  }

  /**
   * 快速图片 URL 安全性与可用性自检 (返回 passed 与 issue 消息列表)
   */
  public static validateImageUrl(url: string | undefined | null, field = "图片"): { passed: boolean; issues: string[] } {
    const issues = this.checkUrlSafety(field, url)
    return { passed: issues.length === 0, issues: issues.map((i) => i.message) }
  }

  /**
   * 检查文本是否包含敏感词或违规绝对化广告词
   */
  public static checkTextContent(field: string, text: string | undefined | null): ValidationIssue[] {
    const issues: ValidationIssue[] = []
    if (!text || typeof text !== "string") return issues

    const cleanText = text.toLowerCase()

    // 检查违法敏感词
    for (const word of ILLEGAL_SENSITIVE_WORDS) {
      if (cleanText.includes(word.toLowerCase())) {
        issues.push({
          field,
          rule: "SENSITIVE_WORD",
          message: `字段 [${field}] 包含国家违禁/敏感词汇: "${word}"`,
          badValue: word,
        })
      }
    }

    // 检查绝对化广告法用语
    for (const word of ABSOLUTE_WORDS) {
      if (cleanText.includes(word.toLowerCase())) {
        issues.push({
          field,
          rule: "ABSOLUTE_WORD",
          message: `字段 [${field}] 包含广告法禁用绝对化词汇: "${word}"`,
          badValue: word,
        })
      }
    }

    return issues
  }

  /**
   * 检查 URL 可用性与安全性（防 SSRF、防占位符死链）
   */
  public static checkUrlSafety(field: string, url: string | undefined | null): ValidationIssue[] {
    const issues: ValidationIssue[] = []
    if (!url || typeof url !== "string") {
      issues.push({
        field,
        rule: "EMPTY_REQUIRED",
        message: `字段 [${field}] 不能为空`,
      })
      return issues
    }

    // 检查未替换的模板字符串或伪造占位符
    if (url.includes("${") || url.includes("{url}") || url.includes("example.com/placeholder")) {
      issues.push({
        field,
        rule: "INVALID_URL",
        message: `字段 [${field}] 包含未解析的模板占位符或非法测试地址: ${url}`,
        badValue: url,
      })
      return issues
    }

    // 允许以 /images/ 或 /assets/ 开头的本地合法静态资源路径
    if (url.startsWith("/images/") || url.startsWith("/assets/") || url.startsWith("/uploads/")) {
      return issues
    }

    try {
      const parsed = new URL(url)
      // 必须是 http 或 https
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        issues.push({
          field,
          rule: "INVALID_URL",
          message: `字段 [${field}] 必须使用 http/https 协议: ${url}`,
          badValue: url,
        })
      }

      // SSRF 安全校验 (允许当前测试/开发环境的目标基址自身，或本地开发/测试环境下的回环)
      const allowedBaseHost = process.env.E2E_BASE_URL ? new URL(process.env.E2E_BASE_URL).hostname : ""
      const isDevOrTest = process.env.APP_ENVIRONMENT === "dev" || process.env.APP_ENVIRONMENT === "test"
      const isAllowedLocal = isDevOrTest && (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "172.21.0.1")
      if (parsed.hostname !== allowedBaseHost && !isAllowedLocal) {
        for (const pattern of FORBIDDEN_HOST_PATTERNS) {
          if (pattern.test(parsed.hostname)) {
            issues.push({
              field,
              rule: "SSRF_RISK",
              message: `字段 [${field}] 禁止指向本地或私网地址 (防 SSRF 攻击): ${parsed.hostname}`,
              badValue: parsed.hostname,
            })
            break
          }
        }
      }
    } catch {
      issues.push({
        field,
        rule: "INVALID_URL",
        message: `字段 [${field}] 格式不合法，不是合法的有效 URL: ${url}`,
        badValue: url,
      })
    }

    return issues
  }

  /**
   * 商品全量字段业务与合规完整性校验
   */
  public static validateProduct(payload: ProductPayloadToValidate): { valid: boolean; issues: ValidationIssue[] } {
    const issues: ValidationIssue[] = []

    // 1. 名称校验
    if (!payload.name || payload.name.trim().length === 0) {
      issues.push({ field: "name", rule: "EMPTY_REQUIRED", message: "商品名称不能为空" })
    } else {
      issues.push(...this.checkTextContent("name", payload.name))
    }

    // 2. 详情描述校验
    if (payload.description) {
      issues.push(...this.checkTextContent("description", payload.description))
    }

    // 3. 主图与图集校验
    issues.push(...this.checkUrlSafety("coverImage", payload.coverImage))
    if (!payload.images || !Array.isArray(payload.images) || payload.images.length === 0) {
      issues.push({ field: "images", rule: "EMPTY_REQUIRED", message: "商品图集 images 数组不能为空" })
    } else {
      payload.images.forEach((img, idx) => {
        issues.push(...this.checkUrlSafety(`images[${idx}]`, img))
      })
    }

    // 4. 价格数值校验
    if (payload.price !== undefined) {
      if (typeof payload.price !== "number" || isNaN(payload.price) || payload.price <= 0 || payload.price > 999999) {
        issues.push({
          field: "price",
          rule: "INVALID_NUMERIC",
          message: `商品售价必须为大于 0 且 <= 999999 的合理数值，当前值为: ${payload.price}`,
          badValue: payload.price,
        })
      }
    }

    // 5. 库存数值校验
    if (payload.stock !== undefined) {
      if (typeof payload.stock !== "number" || !Number.isInteger(payload.stock) || payload.stock < 0) {
        issues.push({
          field: "stock",
          rule: "INVALID_NUMERIC",
          message: `商品库存必须为非负整数，当前值为: ${payload.stock}`,
          badValue: payload.stock,
        })
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    }
  }
}
