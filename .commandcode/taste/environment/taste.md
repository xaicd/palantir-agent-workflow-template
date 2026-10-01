# Environment & deployment topology preferences

- Test environment should be served over plain HTTP on port 80 / IP, NOT HTTPS; domains are not ICP-filed ("我不想要用https，现在只是测试环境", "你继续80端口啊"). Confidence: 0.8
- Root path `/` should serve the PC portal, while the C-end mobile APP runs under the `/app` basePath. Confidence: 0.8
- Domain/topology is shared across all surfaces (PC, app-web, admin, merchant, miniapp); avoid per-surface domain conflicts. Confidence: 0.7
- Docker images must be built locally and only shipped to the test server via save/load; building on the remote server is not acceptable ("你不会是 去 远程服务器 构建了吧"). Confidence: 0.75
- Next-app Docker image tags follow a dated daily-sequence convention (`r<YYYYMMDD>-NN`, e.g. `r20260918-01`), separate from the timestamped `rollback-pre-...` tag kept as the rollback point. Confidence: 0.6
- Before heavy local builds (docker `--no-cache`, `next build`), free memory by killing idle Gradle/Kotlin compile daemons left over from APK builds (each `-Xmx8G`, they auto-restart on next Gradle build); leave Android emulators alone (they may be the user's agent-device sessions). Confidence: 0.65
- Data-boundary first: for tools that would otherwise upload source code or data to a vendor cloud, prefers self-hosted / local-only modes; cloud mode is disabled by default and only allowed with explicit per-use approval (源码不出机). Confidence: 0.7
- Credentials must never be persisted to disk or committed — API/LLM keys are injected only via env vars or a secret store, and CI secrets are created by a human rather than auto-filled by the agent. Confidence: 0.7
- Docker disk pressure is a known recurring hotspot: reclaim by deleting quarantined dead build snapshots (`.runtime/quarantine/*`) and pruning DANGLING images only — and only after any in-flight `docker build` finishes (its intermediate layers look dangling); tagged rollback/`latest`/infra images must be preserved and verified. Confidence: 0.6
- The agent's `/tmp` may be read-only (curl -o fails with exit 23); workaround is to redirect `TMPDIR` to a writable HOME path (e.g. `~/.cache/<tool>-tmp`). Confidence: 0.5
- For LLM-driven tooling, prefers to reuse the project's OWN model providers — the MiniMax and GLM keys/config already present on the machine (e.g. `~/.hermes/.env`, `~/.claude/settings.json`) — instead of a vendor's default/proprietary models ("用咱们 mini Max, GLM 的"). Confidence: 0.6
