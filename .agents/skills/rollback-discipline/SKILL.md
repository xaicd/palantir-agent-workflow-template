---
name: rollback-discipline
description: 任何 docker 镜像发布 / cend-pc 静态发布 / APK 发布强制留回滚点 + 回滚 SOP。覆盖 3 类发布链路 + 5 分钟回滚承诺。触发：deployment-workflow §5 tag 翻转 / cend-pc 静态发布 / APK build。
license: project-internal
---

# 回滚纪律 — 5 分钟内必回滚

> **Why**: deployment-workflow §8 回滚 SOP 只有 1 行字, 实际环境出问题时根本不知道回哪、怎么回。

## 0. 强制回滚承诺（写在 §0 顶部）

**任何发布动作必须在 5 分钟内可完成回滚**。做不到 = 不允许发布。

## 1. 3 类发布链路的回滚路径

### 1.1 Docker 镜像（deployment-workflow §5-§8）

```bash
# 部署时强制留点
ssh {{DEPLOY_SERVER}} 'sudo docker tag {{APP_NAME}}:latest {{APP_NAME}}:rollback-pre-$(date -u +%Y%m%dT%H%M%SZ)'

# 回滚（5 分钟内）
ssh {{DEPLOY_SERVER}} 'sudo docker tag {{APP_NAME}}:rollback-pre-<TIMESTAMP> {{APP_NAME}}:latest \
  && cd ~/workspace/{{PROJECT_NAME}} \
  && sudo docker compose stop app-web app 2>&1 \
  && sudo docker rm -f qloapps-mobile-web qloapps-core-server 2>&1 \
  && sudo docker compose up -d --no-deps app-web app 2>&1'

# 验证（路由 + env 3 var + 镜像 ID）
ssh {{DEPLOY_SERVER}} 'sudo docker inspect qloapps-mobile-web --format "{{.Id}}" | head -c 12'
# 必须等于 rollback-pre-<TIMESTAMP> tag 的 image ID
```

### 1.2 cend-pc 静态（deployment-workflow §9）

```bash
# nginx conf 备份（部署时强制）
ssh {{DEPLOY_SERVER}} 'sudo cp /etc/nginx/sites-enabled/{{APP_DOMAIN}}.conf \
  /etc/nginx/sites-enabled/{{APP_DOMAIN}}.conf.bak.$(date -u +%Y%m%dT%H%M%SZ)'

# 回滚（5 分钟内, 改 nginx root 即可, 不需要 tar/scp）
ssh {{DEPLOY_SERVER}} "sudo sed -i 's|/var/www/cend-pc/<新release>|/var/www/cend-pc/<旧release>|g' \
  /etc/nginx/sites-enabled/{{APP_DOMAIN}}.conf \
  && sudo nginx -t && sudo systemctl reload nginx"

# ⚠️ 必须 grep 验证 (防止 sed 转义失败 - 见 deployment-workflow §9.3 字面量铁律)
ssh {{DEPLOY_SERVER}} 'grep -n "root /var/www/cend-pc\|alias /var/www/cend-pc/[0-9]" /etc/nginx/sites-enabled/{{APP_DOMAIN}}.conf'
```

### 1.3 Flutter APK（scripts/app-build.sh）

```bash
# 部署时强制: APK 上 COS 前先 cp 到 /var/www/dl-backup/<version>/
sudo cp build/app/outputs/flutter-apk/app-release.apk \
  /var/www/dl-backup/cend-app-v<version>-$BACKUP_TS.apk

# COS AppRelease 是版本号数组, 回滚 = 把旧版本号移到数组头
# 见 dl.{{APP_DOMAIN}} 香港桶配置 (apk-distribution-cloud-policy memory)
```

## 2. 回滚点查找 SOP（用户视角）

```bash
# 1. 列出所有 rollback-pre tag
ssh {{DEPLOY_SERVER}} 'sudo docker images {{APP_NAME}} --format "{{.Tag}} {{.CreatedSince}}" | grep "rollback-pre" | head -10'

# 2. 看当前 latest tag 是哪个 (出问题往往在 latest, 上一个就是 rollback-pre)
ssh {{DEPLOY_SERVER}} 'sudo docker inspect {{APP_NAME}}:latest --format "{{.Id}}" | head -c 12'

# 3. 看远端 git log, 对比回滚点 commit
ssh {{DEPLOY_SERVER}} 'cd ~/workspace/{{PROJECT_NAME}} && git log --oneline -10'

# 4. 验证 rollback-pre tag 还能起 (image 完整, 没被 docker image prune 清掉)
ssh {{DEPLOY_SERVER}} 'sudo docker run --rm {{APP_NAME}}:rollback-pre-<TIMESTAMP> echo OK'
```

## 3. 自动回滚触发条件（4 选 1）

| 条件 | 触发动作 |
|---|---|
| `/api/health/ready` 持续 5xx > 1 min | 自动 rollback to previous tag |
| `/app/explore` 路由 307（非预期）| 立即 rollback + 触发 incident-postmortem |
| 容器 env 3 var 校验失败 | 立即 stop+rm+up rollback + 触发 docker-compose-env-discipline |
| 用户手动说 "回滚" | 立刻执行 §1.1 |

## 4. 与其他 skill 协同

- `deployment-workflow/` §5-§8 — 本 skill 是其细化
- `incident-postmortem/` — 回滚后强制 4 件套沉淀
- `docker-compose-env-discipline/` — env 错配回滚路径