# cc-agent-work

基于 [TencentCloud/Octop](https://github.com/TencentCloud/Octop) 的二次开发工作仓库。

自托管 AI 助手平台：多用户、多 Agent，单进程启动 Web 控制台 / CLI / IM 通道。本仓库在 Octop 基础上做业务定制，上游为 MIT 协议开源项目。

## 基于

| 项目 | 说明 |
|------|------|
| [TencentCloud/Octop](https://github.com/TencentCloud/Octop) | 上游开源仓库（MIT） |
| Python 3.12+ · FastAPI · harness-agent | 后端与 Agent 运行时 |
| React 18 · TypeScript · Vite | Web 控制台 |

上游变更请对照 `TencentCloud/Octop` 同步；本仓库仅保留二次开发所需改动。

## 启动

### 环境

- macOS / Linux / Windows
- Python 3.12+（推荐用 [uv](https://docs.astral.sh/uv/)）
- Node.js 20+（构建控制台时需要）

### 从源码运行

```bash
# 安装依赖
make install-hooks   # 启用 pre-commit（首次）
uv sync

# 初始化（数据库、JWT 密钥、首个管理员）
uv run octop init

# 启动 API + Web 控制台
uv run octop run
```

打开 `http://127.0.0.1:8088`，默认账号 `admin / octop`（首次登录后请立刻改密）。

### 生产 / Docker

```bash
docker compose -f deploy/docker-compose.yml up -d
```

### 一键安装脚本（上游）

```bash
# macOS / Linux
curl -fsSL https://finnie-1258344699.cos.ap-guangzhou.myqcloud.com/octop/install.sh | bash
```

## 开发指南

### 常用命令

```bash
make install-hooks     # 启用 git hooks（提交前跑 make all）
make all               # format + lint + typecheck + test（提交门禁）
make format            # 后端 Ruff 自动格式化
make typecheck         # mypy --strict
uv run pytest -m "not live"
cd dashboard && npx tsc -b   # 前端类型检查
make build-frontend    # dashboard/ → src/octop/dashboard/
```

### 目录结构

```
src/octop/
  config.py            # 环境配置
  launch.py            # 启动编排
  infra/               # 领域逻辑（agents / gateway / db / connectors …）
  api/                 # FastAPI 路由
  cli/                 # Click 命令行
  i18n/                # 后端文案
dashboard/             # React 控制台源码
docs/                  # 说明与站点
tests/                 # pytest（unit / integration）
```

依赖方向：`api/`、`cli/` 调用 `infra/`，`infra/` 不依赖 `api/`、`cli/`。

### 二次开发建议

1. 业务改动放在 `infra/` 或 `api/routers/` 对应模块，避免改启动与鉴权骨架。
2. 新增 API 时补 `summary` / `response_model`，并在 `api/openapi_meta.py` 维护标签。
3. 用户可见文案走 `src/octop/i18n/`（`zh` / `en`），不要在逻辑层写死英文。
4. 数据库变更成对提供 SQLite / PostgreSQL 迁移，并更新 schema 版本测试。
5. 提交前确保 `make all` 通过；CI 在 Linux 与 Windows 上都会跑。

更细的模块边界与规范见 [AGENTS.md](AGENTS.md)。

## 许可

二次开发基于 Octop（MIT）。保留上游 [LICENSE](LICENSE) 与版权声明。
