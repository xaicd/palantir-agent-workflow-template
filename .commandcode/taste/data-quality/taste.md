# Data quality & seed preferences

- Requires high-quality seeded/demo data: natural Chinese names, real images, complete fields — no English placeholder text, no missing images/fields ("E2E测试数据，质量也要高一些，不能各种英文，各种少图片，少字段啥的"). Confidence: 0.9
- Fixes must be permanent and at the source (seed/init script), not temporary DB patching; documentation and behavior must stay consistent ("不要临时改乱七八糟的，要固定，说明要一致"). Confidence: 0.9
- Wants root-cause / durable fixes so the same class of bug does not recur on every deploy ("不能每次修理这么多次bug"). Confidence: 0.85
- Seed layering principle: system-init data (orgs, accounts, rules, product categories, data dictionaries) is universal across dev/test/prod; business test data is created by E2E and disposable. Confidence: 0.85
- No fabricated/decorative data or made-up numbers in user-facing surfaces (AGENTS §27 禁装饰造数). Confidence: 0.8
- Prefers avoiding brand-specific keywords in generated/seed data (e.g. avoid "齐鲁"). Confidence: 0.6
