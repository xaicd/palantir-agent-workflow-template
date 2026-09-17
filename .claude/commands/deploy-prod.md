---
description: 生产环境部署 —— 【待配置】构建镜像并发布到生产服务器（需先完善 §0 环境锚点）
argument-hint: [改动说明 | 回滚]
---

# 生产环境部署 SOP（prod — 待配置）

> ⚠️ **本文件为占位模板**。生产服务器尚未正式接入，禁止使用本命令进行实际部署，直到补全 §0 所有空缺项并经授权发布人审批。

## 0. 环境锚点（🔲 待填写）

| 项目 | 当前值 | 说明 |
|:---|:---|:---|
| 生产服务器 IP | `TODO` | 填入实际公网 IP |
| SSH 别名 | `TODO` | 补充 `~/.ssh/config` 条目 |
| 访问入口 | `https://TODO` | www / admin / merchant / api 域名 |
| Traefik 证书方案 | `TODO` | ACME Let's Encrypt / 手动证书 |
| 对象存储 Bucket | `TODO` | S3/MinIO/OSS Bucket 名称及 Endpoint |
| Redis | `TODO` | Redis URL / Sentinel 地址 |

> 填完后删除本 ⚠️ 警告段，并更新 `docs/operations/environment-anchors.md`。

---

## 额外门禁（生产专属，缺一不过）

在执行下方与测试环境相同的 SOP 之前，**必须全部确认**：

- [ ] master 分支通过所有 CI 检查，无 TS 报错，无未合并 PR
- [ ] 授权发布人已口头/文字审批本次发布内容（禁止自行发布）
- [ ] `API_ENCRYPTION_KEY`、`NEXTAUTH_SECRET`、支付密钥等均已在生产容器 env 中设置，且长度符合规范（64 位 HEX / ≥32 字符）
- [ ] 存储驱动 `STORAGE_DRIVER` ≠ `local`（必须 `s3`/`minio`/`aliyun`/`tencent`）
- [ ] 已在生产 DB 执行 `prisma migrate deploy`，无 pending migration
- [ ] 回滚点 tag 已在服务器上打好并记录，可 5 分钟内完成回滚
- [ ] 冷却期：发布后观察 15 分钟，无 5xx 告警才关闭本次发布窗口

---

## SOP（与测试/开发环境相同流程，靶机换为生产服务器）

### 1. 部署前检查
- `git fetch --all`，确认 `git rev-parse HEAD origin/master gitee/master` 三者一致。
- 本次发布内容已写入 changelog / 任务卡。

### 2. 取加密 key ⚠️
```bash
KEY=$(ssh <prod-server> 'sudo docker exec qloapps-core-server printenv API_ENCRYPTION_KEY' | tr -d '\n')
[ "${#KEY}" -ne 64 ] && { echo "❌ key 长度 ${#KEY}，应为 64"; exit 1; }
```

### 3. 本地构建镜像 ⚠️
```bash
docker build --no-cache --build-arg NEXT_PUBLIC_API_ENCRYPTION_KEY="$KEY" -t wenlv-next-app:r<tag> .
```

### 4. 传输镜像
```bash
docker save wenlv-next-app:r<tag> | gzip -1 | ssh <prod-server> "gunzip | docker load"
```

### 5. tag 翻转（留回滚点）
```bash
ssh <prod-server> 'sudo docker tag wenlv-next-app:latest wenlv-next-app:rollback-pre-$(date -u +%Y%m%dT%H%M%SZ) && sudo docker tag wenlv-next-app:r<tag> wenlv-next-app:latest'
```

### 6. 重建容器 ⚠️
```bash
ssh <prod-server> 'cd ~/workspace/wenlv-next && sudo docker compose up -d --no-deps app app-web'
```

### 7. 验证
- 容器 healthy + 页面 200；grep 新版文案确认。
- 关键路径冒烟：登录 → 下单 → 支付（沙盒/模拟）。

### 8. 回滚（需要时）
```bash
ssh <prod-server> 'sudo docker tag wenlv-next-app:rollback-pre-<时间戳> wenlv-next-app:latest && cd ~/workspace/wenlv-next && sudo docker compose up -d --no-deps app app-web'
```

### 收尾
- 通知授权发布人发布完成；记录镜像 tag、回滚点 tag。
- 踩了新坑 → 追加到 memory `deploy-sop`。
