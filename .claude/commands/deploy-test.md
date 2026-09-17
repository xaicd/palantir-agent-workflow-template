---
description: 测试环境部署 —— 本地构建镜像并发布到测试服务器（App-Web + 根 Next，不打包 APK）
argument-hint: [改动说明 | 回滚]
---

# 测试环境部署 SOP（{{TEST_SSH_ALIAS}} / {{TEST_SERVER_IP}}）

每次「部署 / 打包发布」走这条链。⚠️ = 历史事故硬约束，跳过必出故障。
详细坑位见项目 memory：`deploy-sop`、`tc-robin-claw-test-server-ops`、`test-env-api-encryption-key`、`commit-discipline-for-test-env`。

## 0. 判断部署类型
- Web 代码（`src/app/**`、`src/modules/**/frontend/**`）→ 走本链（App-Web 与根 Next 共用同一镜像）。
- Flutter APK（`apps/mobile-c-end/**`）→ 走 `scripts/app-build.sh` + COS，不在本命令范围。

## 1. 部署前检查（必须 git pull）⚠️
- `git fetch --all`，确认 `git rev-parse HEAD origin/master gitee/master` 三者一致；本地落后则 `git pull --ff-only`（分叉用 rebase/merge 收敛，切勿跳过）。
- 部署依赖必须先提交并推双远端（origin + gitee）。

## 2. 取加密 key ⚠️
```bash
KEY=$(ssh {{TEST_SSH_ALIAS}} 'sudo docker exec {{CORE_CONTAINER_NAME}} printenv API_ENCRYPTION_KEY' | tr -d '\n')
[ "${#KEY}" -ne 64 ] && { echo "❌ key 长度 ${#KEY}，应为 64"; exit 1; }
```
- 容器名是 `{{CORE_CONTAINER_NAME}}`（**不是** `qloapps-app`）。
- key 禁打印、禁落盘，只经 `$(...)` 传递。

## 3. 本地构建镜像 ⚠️
- 定 tag：先看当天最大序号 `docker images {{APP_IMAGE_NAME}} --format '{{.Tag}}' | grep "^r$(date +%Y%m%d)"`。
- tag = `r<YYYYMMDD>-<NN>`；**必须 `--no-cache`**（否则 ENV layer 命中旧空值 → 客户端 key 为空，静默失败）。
```bash
docker build --no-cache --build-arg NEXT_PUBLIC_API_ENCRYPTION_KEY="$KEY" -t {{APP_IMAGE_NAME}}:r<tag> .
```
- 构建耗时数分钟（两次 next build），后台跑并等 `Successfully tagged`。⚠️ **禁止在服务器上构建**。

## 4. 传输镜像
```bash
docker save {{APP_IMAGE_NAME}}:r<tag> | gzip -1 | ssh {{TEST_SSH_ALIAS}} "gunzip | docker load"
```

## 5. tag 翻转（留回滚点）
```bash
ssh {{TEST_SSH_ALIAS}} 'sudo docker tag {{APP_IMAGE_NAME}}:latest {{APP_IMAGE_NAME}}:rollback-pre-$(date -u +%Y%m%dT%H%M%SZ) && sudo docker tag {{APP_IMAGE_NAME}}:r<tag> {{APP_IMAGE_NAME}}:latest'
```

## 6. 重建容器 ⚠️
```bash
ssh {{TEST_SSH_ALIAS}} 'cd {{WORKSPACE_PATH}} && sudo docker compose up -d --no-deps app app-web'
```
- 必须 `cd` 后**无 `-f`** 执行（否则跳过 docker-compose.override.yml → NextAuth UntrustedHost，全站会话挂）。

## 7. 验证
- 容器 healthy（等 ~8s）：`sudo docker ps --filter name={{CORE_CONTAINER_NAME}} --filter name=qloapps-mobile-web --format '{{.Names}} {{.Status}}'`
- 页面 200：App-Web basePath `/app`（容器内 3201），根 Next `/`（容器内 3000）。curl 命中本次改动页面，grep 新版文案/组件名确认已渲染。

## 8. 回滚（需要时）
```bash
ssh {{TEST_SSH_ALIAS}} 'sudo docker tag {{APP_IMAGE_NAME}}:rollback-pre-<时间戳> {{APP_IMAGE_NAME}}:latest && cd {{WORKSPACE_PATH}} && sudo docker compose up -d --no-deps app app-web'
```

## 收尾
- 汇报：发布内容、镜像 tag、回滚点 tag、验证结果。
- 踩了新坑 → 追加到 memory `deploy-sop`（或对应坑记忆文件）。
