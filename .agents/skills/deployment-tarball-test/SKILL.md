---
name: deployment-tarball-test
description: 测试环境 (dev/test) 部署 V4 SOP — 本地 next build + vite build → tar.gz → scp 到 {{DEPLOY_SERVER}} → systemctl restart qloapps-* (无 docker 业务容器). 触发场景: 用户说"测试部署"/"tarball 部署"/"无 docker 部署"/"dev 上线"/"test 发布". 注意: prod 仍走 deployment-workflow (docker 路径), 不要混用.
---

# 测试环境无 docker 部署 SOP（V4 / sprint 2026-10-01）

> **你是 🐸 雨蛙**（部署 + 数字员工运营 Job Owner）。本 SOP 是你的 dev/test 部署主链。
> **prod 仍走** `.agents/skills/deployment-workflow/SKILL.md`（docker 路径，本 SOP 仅 dev/test）。

## 0. 何时用 V4 vs V3

| 环境 | 链路 | SOP |
|---|---|---|
| dev (本机/远程 sandbox) | V4 tarball + systemd | **本文件** |
| test ({{DEPLOY_SERVER}} {{TEST_SERVER_IP}}) | V4 tarball + systemd | **本文件** |
| prod (线上) | V3 docker + tag 翻转 | `deployment-workflow/SKILL.md` |

**绝对不要**混用：
- ❌ 在 dev/test 上 `docker build`（速度慢 10 倍-回滚慢）
- ❌ 在 prod 上 `tarball + scp + systemctl restart`（prod 要求 docker 镜像可水平扩容）

## 1. 架构图 (V4.3 vs V3)

```
V3 (docker):
  本机 docker build -t {{APP_NAME}}:r<tag> .            (12-15 min)
  docker save | gzip | ssh | gunzip | docker load            (易截断)
  ssh docker tag + stop+rm+up

V4.3 (本机 docker run + 远端 systemd, sprint 2026-10-01):
  本机 docker run --rm {{APP_NAME}}:builder <build cmd>     (5-7 min, 复用现成 builder)
  本机 tar -czf web-image.tar.gz web-image                    (30s)
  scp web-image.tar.gz {{DEPLOY_SERVER}}:/opt/qloapps/staging/
  ssh /opt/qloapps/bin/unpack.sh <tarball> <env>             (白名单命令, 仅 unpack + systemctl restart)
  ssh systemctl restart qloapps-{core-server,mobile-web,cend-pc}
  ↓
  远端 /opt/qloapps/
  ├─ staging/<tarball>     # 持久 (最近 N 次部署)
  ├─ .previous/<unit>      # 上一版本软链 (回滚)
  ├─ core-server/          # mv 真目录 (不用软链) → systemctl 启的逻辑
  ├─ mobile-web/           # mv 真目录
  ├─ mobile-web/app-web/   # mv 真子目录
  ├─ cend-pc-dist/         # mv 真目录
  ├─ bin/unpack.sh         # publish-tarball.sh 触发的远端脚本 (白名单)
  └─ VERSION               # env + commit + ts
  ↓
  systemd unit (V4.3 保留 V4.2 设计):
  ├─ qloapps-core-server.service (WorkingDirectory=/opt/qloapps/core-server)
  ├─ qloapps-mobile-web.service (WorkingDirectory=/opt/qloapps/mobile-web/app-web)
  └─ qloapps-cend-pc.service (WorkingDirectory=/opt/qloapps/cend-pc-dist)
```

**核心提速**:
- V3 单次 deploy: 12-15 min (build) + 1-2 min (docker save/load/scp) = 13-17 min
- V4.3 单次 deploy: 5-7 min (docker run build) + 30s (tar/scp) = **6-8 min**, 提速 50%+

**前提**: 本机有 `{{APP_NAME}}:builder` 镜像 (一次性 docker build 12-15 min 跑 V3 §3.1)

## 2. 部署前检查 (5 大事故硬约束)

```bash
cd /home/beye/workspace/zhuangyuan/{{PROJECT_NAME}}
# 2.1 git working tree 干净 (publish-tarball.sh 会自动校验)
git status
# 2.2 双远端同步 (强制会失败 → 用户指令)
git fetch origin master && git fetch gitee master
git rev-parse HEAD origin/master gitee/master  # 三者必须一致
# 2.3 4 个 build-arg 必须有 (远端 .env 拿 KEY)
export AUTH_URL=http://{{TEST_SERVER_IP}}
export NEXTAUTH_URL=https://{{APP_DOMAIN}}
export APP_PUBLIC_URL=http://{{TEST_SERVER_IP}}
export NEXT_PUBLIC_API_ENCRYPTION_KEY=$(ssh {{DEPLOY_SERVER}} 'sudo cat /opt/qloapps/.env | grep NEXT_PUBLIC_API_ENCRYPTION_KEY | cut -d= -f2')
# 2.4 ssh 别名可达
ssh -o BatchMode=yes {{DEPLOY_SERVER}} true
```

**5 大事故复盘**(来自 build-and-publish.sh §1, 2026-09-23 教训):
- ⚠️ **A**: `docker compose up --force-recreate` 不重读 env → V4 走 systemctl restart 直接读新 env, 无此风险
- ⚠️ **B**: Dockerfile 没 baked AUTH_URL → V4 仍需 build-arg 注入
- ⚠️ **C**: compose interpolation 误改字面 → V4 无 compose, 无此风险
- ⚠️ **D**: 改完不推双远端 → V4 同样强制推双远端
- ⚠️ **E**: 容器 env 缺失但页面 200 蒙混 → V4 systemctl restart 后必须 `curl localhost:3000/api/health/ready` 校验

## 3. 本机构建 (V4.3: docker run --rm 临时 builder, 复用现成 builder 镜像)

### 3.0 前置: 本机必须有 builder 镜像 (一次性 V3 docker build)

```bash
# 首次或 builder 镜像变更时跑一次, 后续 deploy 只跑 §3.1+§3.2+§3.3
docker build -t {{APP_NAME}}:builder .
# 完成后本机 docker images | grep wenlv 应该看到 builder 镜像
```

### 3.1 core-server 主应用 (docker run --rm {{APP_NAME}}:builder)

```bash
cd /home/beye/workspace/zhuangyuan/{{PROJECT_NAME}}

NEXT_PUBLIC_API_ENCRYPTION_KEY="$NEXT_PUBLIC_API_ENCRYPTION_KEY" \
  AUTH_URL="$AUTH_URL" \
  NEXTAUTH_URL="$NEXTAUTH_URL" \
  APP_PUBLIC_URL="$APP_PUBLIC_URL" \
  GIT_COMMIT="$(git rev-parse HEAD)" \
  docker run --rm \
    -v "$PWD:/src" -w /src \
    -e NEXT_PUBLIC_API_ENCRYPTION_KEY \
    -e AUTH_URL -e NEXTAUTH_URL -e APP_PUBLIC_URL -e GIT_COMMIT \
    {{APP_NAME}}:builder \
    sh -c "npm run build 2>&1 | tail -10"
```

### 3.2 mobile-web SPA (docker run --rm {{APP_NAME}}:builder)

```bash
APP_WEB_BASE_PATH=/app \
  PORTAL_ASSET_PREFIX=/app/_assets/cend-app-next \
  PORTAL_DIST_DIR=.next-app-web \
  NEXT_PUBLIC_API_ENCRYPTION_KEY="$NEXT_PUBLIC_API_ENCRYPTION_KEY" \
  AUTH_URL="$AUTH_URL" \
  NEXTAUTH_URL="$NEXTAUTH_URL" \
  APP_PUBLIC_URL="$APP_PUBLIC_URL" \
  GIT_COMMIT="$(git rev-parse HEAD)" \
  docker run --rm \
    -v "$PWD:/src" -w /src \
    -e NEXT_PUBLIC_API_ENCRYPTION_KEY \
    -e AUTH_URL -e NEXTAUTH_URL -e APP_PUBLIC_URL -e GIT_COMMIT \
    -e APP_WEB_BASE_PATH -e PORTAL_ASSET_PREFIX -e PORTAL_DIST_DIR \
    {{APP_NAME}}:builder \
    sh -c "npm run build:cend-app-next 2>&1 | tail -5"
```

### 3.3 cend-pc-portal (vite static, 本机直接跑)

cend-pc 不走 docker run (因为 vite 跑通且 deps 已在 host, 无需 builder 镜像):
```bash
cd apps/cend-pc
VITE_RELEASE_ID="dev-$(date -u +%Y%m%d)" \
NODE_ENV=production \
  npm run build 2>&1 | tail -5
cd ../..
```

### 3.4 验证 build 产物

```bash
ls .next/standalone | head -3              # 应该有 server.js 等
ls .next-app-web/standalone | head -3      # 应该有 server.js 等
ls apps/cend-pc/dist | head -3            # 应该有 index.html 等
```

**构建禁忌** (V4.3):
- ❌ 跳过 4 个 build-arg (B 类事故)
- ❌ `docker build` V4.3 改用 `docker run --rm <builder>` (复用现有 builder 镜像, 不重新 build)
- ❌ 直接 `npm run build` 在 host (跳过 docker run, 但 V4.3 默认就是 docker run)
- ❌ 接口没变也重建 core-server (V3 §6.0 决策表 — V4 简化: 只要 next build 成功了 core-server 就重建, 因为 systemd restart 0 业务中断)

**预计构建时间**: core 3-5 + mobile-web 1-2 + cend-pc 30 秒 ≈ **5-7 分钟** (V3 docker build + load 需 10-15 分钟, **提速 50%**)

## 4. 一键部署 (主入口)

```bash
# 4.1 本机打 tarball + 远端 restart (一条命令)
./scripts/deploy/publish-tarball.sh test "修复首页底部空白"
./scripts/deploy/publish-tarball.sh dev "新增商品编辑 spec"
```

**publish-tarball.sh 内部流程** (供你 debug):
1. git 门禁 (5 大事故硬约束)
2. 本地 build (上述 §3 三步)
3. tar.gz 打包 (data/data-cleanup/webtobuild-test-YYYYMMDDTHHMMSSZ.tar.gz)
4. scp 到远端 `/opt/qloapps/staging/`
5. ssh 调用 `/opt/qloapps/bin/unpack.sh` (白名单命令, **不允许任意 ssh exec**)
6. 远端解包 + mv 旧版本到 `.previous/` + 链接新版本 + systemctl restart 3 个 unit
7. health check (systemctl is-active + curl :3000/api/health/ready)

**预计总时间**: build 5-7 分钟 + scp 30 秒 + 远端 restart 5 秒 + health check 5 秒 ≈ **6-8 分钟端到端**

## 5. 验证 (§7)

```bash
# 5.1 远端 systemd 状态 (3 个 unit)
ssh {{DEPLOY_SERVER}} 'sudo systemctl is-active qloapps-{core-server,mobile-web,cend-pc}'

# 5.2 远端 health check (3 个 endpoint)
ssh {{DEPLOY_SERVER}} 'for path in /api/health/ready /api/setup /; do
  echo "  $path -> $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000$path)"
done'
# 期望: /api/health/ready 200, /api/setup 200, / 200

# 5.3 远端实时拉日志 (出问题时)
ssh {{DEPLOY_SERVER}} 'sudo journalctl -u qloapps-core-server -n 50 -f'
```

## 6. 回滚 (§8)

```bash
# 6.1 查 VERSION 找上一版本
ssh {{DEPLOY_SERVER}} 'cat /opt/qloapps/VERSION'  # 当前 env + commit + ts

# 6.2 用上一 tarball 回滚 (publish-tarball.sh 跑过的都留在 /opt/qloapps/staging/)
ssh {{DEPLOY_SERVER}} 'ls /opt/qloapps/staging/'  # 查 webtobuild-test-*.tar.gz 列表
ssh {{DEPLOY_SERVER}} 'sudo /opt/qloapps/bin/unpack.sh /opt/qloapps/staging/webtobuild-test-20261001T142000Z.tar.gz test'

# 6.3 紧急回滚 (使用上一符号链接)
ssh {{DEPLOY_SERVER}} 'cd /opt/qloapps && \
  sudo rm core-server mobile-web cend-pc && \
  sudo mv .previous/core-server .previous/mobile-web .previous/cend-pc . && \
  sudo systemctl restart qloapps-{core-server,mobile-web,cend-pc}.service'
```

## 7. cend-pc PC 门户 (§9 完全保留 V3)

V4 tarball 已包含 cend-pc (本机 vite build → dist 进 tarball → 远端 systemctl 拉)。**不再走 §9 静态制品链 + nginx**。

**为什么**: V3 §9 用 nginx 服务 `/var/www/cend-pc/dist/`, 但 nginx 仍 docker 在跑. V4 改成 systemd unit (`qloapps-cend-pc.service`) 用 `http-server` 跑 dist, 完全脱离 nginx。

**核心差异**: 部署前确认 nginx 配置里**不再 proxy_pass 到 cend-pc** (否则 systemd unit 端口冲突). 雨蛙需要跟运维确认。

## 8. Flutter APK (§10 完全保留 V3)

APK 与本次 V4 无关, 仍走:
```bash
bash scripts/app-build.sh cend android release  # 雨蛙工作流
# 或 scripts/app-build.sh merchant android release
```

## 9. 一次性初始化 (远端, 1 次性, 你首次跑 V4 前必做)

远端当前仍是 docker 业务容器 (qloapps-core-server + qloapps-mobile-web). 切换到 V4 需要:

```bash
# 9.1 本机打包物料
bash scripts/deploy/remote/pack-remote-fixes.sh
# 产物: data/data-cleanup/qloapps-fixes.tar.gz (永久目录, 重启不丢)

# 9.2 scp 到远端永久目录
scp data/data-cleanup/qloapps-fixes.tar.gz \
  {{DEPLOY_SERVER}}:/opt/qloapps/.bootstrap/qloapps-fixes.tar.gz

# 9.3 ssh 远端 (一次性, 装 Node 20 + 3 个 systemd unit + bin/unpack.sh)
ssh {{DEPLOY_SERVER}}
mkdir -p /opt/qloapps/.bootstrap
tar -xzf /opt/qloapps/.bootstrap/qloapps-fixes.tar.gz -C /opt/qloapps/.bootstrap
sudo bash /opt/qloapps/.bootstrap/bootstrap-test-env.sh
# 完成后会自动 rm -rf /opt/qloapps/.bootstrap

# 9.4 验证 systemd 已装
ssh {{DEPLOY_SERVER}} 'systemctl status qloapps-core-server'  # inactive (dead), 等首次 V4 部署
```

**bootstrap-test-env.sh 做什么**:
- 装 Node.js 20 (用 nodesource 仓库, 与 Dockerfile 一致)
- 创建 /opt/qloapps/{bin,staging,.previous,.staging-extract} 目录
- 装 3 个 systemd unit 到 /etc/systemd/system/
- 拷 qloapps-unpack.sh 到 /opt/qloapps/bin/
- systemctl daemon-reload (但不 start)
- **不启动任何 unit** (等 publish-tarball.sh 首次跑)

## 10. ⚠️ 关键事故硬约束 (继承 V3 §11)

- **D 类** #1 #2: commit → 推双远端 → publish-tarball.sh, **不能跳过 git push**
- **D 类** #15: 本机 sandbox build (远端禁止 build, 见 §3.2 ❌)
- **D 类** #24: emulator 验证后再 publish-tarball (节省错误部署时间)
- **D 类** #28: 接口没变别动 — V4 简化, **next build 成功了 core-server 就重建** (systemd restart 0 业务中断, 但部署脚本必须严格按 SOP 走, 不能跳 health check)

## 11. 与 V3 的差异矩阵 (雨蛙决策点)

| 维度 | V3 docker (deployment-workflow) | V4 tarball (本 SOP) |
|---|---|---|
| 适用 | prod (强制), dev/test (可选) | **dev/test (强制)**, prod 禁用 |
| 构建 | `docker build` 5-10 分钟 | `next build` 3-5 分钟 |
| 传输 | `docker save\|gzip\|ssh\|gunz\|docker load` | `tar.gz` + `scp` |
| 启动 | `docker tag + stop+rm+up` | `systemctl restart` |
| 回滚点 | `{{APP_NAME}}:rollback-pre-XXX` | `/opt/qloapps/.previous/` + tarball 留存 |
| 跨实例 | docker 网络 (同 compose) | systemd 独立, 跨实例需额外编排 |
| 镜像缓存 | docker build 命中 (数秒) | next build 全量 (无缓存) |
| 监控 | docker stats | journalctl + curl |

## 12. 故障排除 (雨蛙 on-call)

| 症状 | 排查 | 修复 |
|---|---|---|
| systemctl restart 后 is-active=failed | `journalctl -u qloapps-core-server -n 50` | 多数是 env 缺失, 回滚到上一 tarball |
| /api/health/ready 503 | curl `/api/setup` 看返回 | proxy.ts fetch 未初始化, 检查 .env AUTH_URL |
| 下一页 500 | curl 远端 `/opt/qloapps/core-server/.env` | DATABASE_URL 配错 (容器名 vs 主机 IP) |
| tarball 太大 (>2GB) | du -sh staging/webtobuild-*.tar.gz | next build cache 没清, `rm -rf .next/cache` |
| 远端 ssh 拒绝 | ssh {{DEPLOY_SERVER}} true | 检查 ssh config 别名 |

## 13. 你 (雨蛙) 的固定 SOP

| 周期 | 动作 |
|---|---|
| 用户说"部署"/"发布"/"上线" | §4 一键: `./scripts/deploy/publish-tarball.sh <env> "<desc>"` |
| 用户说"回滚" | §6.2: `ssh ... sudo /opt/qloapps/bin/unpack.sh /opt/qloapps/staging/<old>.tar.gz <env>` |
| 用户说"远端运维"/"远端 ssh" | §5 验证 (你的边界, 别越过 systemd 重启) |
| 用户说"prod 部署" | **走** .agents/skills/deployment-workflow/SKILL.md (V3 docker, 不要走 V4) |
| 巡检 cron | `monitor/check-frog-activity.sh` (其他 6 只蛙活跃度, 跟 V4 无关) |

## 14. 与其他 skill 的衔接

- `wenlv/operator-runbook/SKILL.md` — 你是数字员工运营 Job Owner, 但**部署 V4 是你的工作** (operator-runbook 是数字员工脚本上线)
- `deployment-workflow/SKILL.md` — **prod 路径**, 不要混用 V4
- `docker-compose-env-discipline/SKILL.md` — 中间件 docker 仍受此约束, 你**不动** qloapps-postgres 等容器
- `rollback-discipline/SKILL.md` — V4 走 §6 而不是 V3 §8
- `commit-discipline-cross-session/SKILL.md` — 你 deploy 前必须 git 推双远端 (D 类硬约束)

## 附录 A: publish-tarball.sh 关键参数

```bash
readonly ENV VAR='test'                  # dev | test (prod 禁止)
readonly CHANGED_DESC='<必填>'           # commit message + 回滚定位
readonly BUNDLE_NAME=webtobuild-${ENV}-$(date -u +%Y%m%dT%H%M%SZ).tar.gz
readonly REMOTE_TARGET_HOST='{{DEPLOY_SERVER}}'   # ssh 别名, ~/.ssh/config
readonly REMOTE_WHITELIST_REGEX='^(sudo systemctl ...|ls /opt/qloapps/...|cat /opt/qloapps/VERSION|/opt/qloapps/bin/unpack\.sh)$'
```

**退出码** (供你 debug):
- 1 = git dirty
- 2 = 远端分支未同步
- 3 = env 不合法 或 缺 build-arg
- 4 = build 失败
- 5 = tarball 校验失败 (size < 1MB)
- 6 = scp 失败
- 7 = ssh 白名单拒绝 (非白名单命令, 极高严重)
- 8 = 远端 health check 失败
- 9 = core-server 智能重建违规 (未来)

## 附录 B: 雨蛙工作流总入口

```bash
# 1. 部署 dev/test
./scripts/deploy/publish-tarball.sh <env> "<desc>"

# 2. 部署 prod (走 V3 docker)
./scripts/deploy/build-and-publish.sh prod "<desc>"

# 3. 数字员工运营 (独立)
bash scripts/digital-employee/v0.5/INDEX.ts

# 4. cron 调度
bash scripts/digital-employee/cron-runner.ts --config schedules/default-cron.json

# 5. e2e 回归 (V4 部署后必跑, 雨蛙负责)
npm run test:e2e -- e2e/journey/

# 6. 故障定位
ssh {{DEPLOY_SERVER}} 'sudo journalctl -u qloapps-core-server -n 200 --no-pager'
```

**核心**: 你**部署** + **跑回归** + **上线监控** + **incident 响应**, 不写代码 (田蛙) 不审代码 (牛蛙).