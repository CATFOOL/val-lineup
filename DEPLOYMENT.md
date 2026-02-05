# Val-Lineup 生产部署指南

## 目录

1. [服务器要求](#服务器要求)
2. [Supabase 部署](#supabase-部署)
3. [OAuth 配置（Discord/Google）](#oauth-配置discordgoogle)
4. [项目部署](#项目部署)
5. [Git 更新流程](#git-更新流程)
6. [常用命令](#常用命令)
7. [故障排查](#故障排查)

---

## 服务器要求

- **CPU**: 2 核+
- **内存**: 4GB+（Supabase 需要约 2-3GB）
- **硬盘**: 40GB+ SSD
- **系统**: Ubuntu 22.04 / Debian 12
- **软件**: Docker, Docker Compose

### 安装 Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# 重新登录 SSH 生效
```

---

## Supabase 部署

### 1. 克隆 Supabase

```bash
git clone --depth 1 https://github.com/supabase/supabase ~/supabase
cd ~/supabase/docker
cp .env.example .env
```

### 2. 修改配置

编辑 `~/supabase/docker/.env`，修改以下内容：

```env
############
# 必须修改 - 安全密钥
############
POSTGRES_PASSWORD=你的数据库强密码
JWT_SECRET=至少32位的随机字符串
ANON_KEY=基于JWT_SECRET生成的key
SERVICE_ROLE_KEY=基于JWT_SECRET生成的key
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=你的管理面板密码

############
# 必须修改 - URL 配置
############
SITE_URL=http://你的服务器IP:3000
API_EXTERNAL_URL=http://你的服务器IP:8000

############
# 可选 - 邮件服务（用于注册验证、密码重置）
############
SMTP_ADMIN_EMAIL=发件邮箱
SMTP_HOST=smtp.qcloudmail.com
SMTP_PORT=465
SMTP_USER=SecretKey (API key)
SMTP_PASS=SMTP 服务器的登录账号
SMTP_SENDER_NAME=发件人名称
```

### 3. 生成 API Keys

访问：https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys

或用命令生成 JWT_SECRET：
```bash
openssl rand -base64 32
```

### 4. 启动 Supabase

```bash
cd ~/supabase/docker
docker-compose up -d
```

### 5. 验证运行

```bash
# 检查服务状态
docker ps | grep supabase

# 测试 API
curl http://127.0.0.1:8000/rest/v1/
```

### Supabase 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| Kong API | 8000 | Supabase API 入口 |
| Studio | 3000 | 管理面板（建议改为 3001） |
| PostgreSQL | 5432 | 数据库 |

---

## OAuth 配置（Discord/Google）

### 1. 创建 Discord 应用

1. 访问 [Discord Developer Portal](https://discord.com/developers/applications)
2. 点击 **New Application**，输入应用名称
3. 进入 **OAuth2 > General**
4. 添加 Redirect URL：
   ```
   http://你的服务器IP:8000/auth/v1/callback
   ```
   > 如果使用域名：`https://api.你的域名/auth/v1/callback`
5. 复制 **Client ID** 和 **Client Secret**

### 2. 创建 Google 应用

1. 访问 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. 创建项目（如果没有）
3. 点击 **创建凭据 > OAuth 客户端 ID**
4. 应用类型选择 **Web 应用**
5. 添加授权重定向 URI：
   ```
   http://你的服务器IP:8000/auth/v1/callback
   ```
   > 如果使用域名：`https://api.你的域名/auth/v1/callback`
6. 复制 **客户端 ID** 和 **客户端密钥**

### 3. 配置 Supabase

编辑 `~/supabase/docker/docker-compose.yml`，找到 `auth` 服务，在 `environment` 部分添加：

```yaml
  auth:
    # ... 其他配置 ...
    environment:
      # ... 现有环境变量 ...

      # Discord OAuth
      GOTRUE_EXTERNAL_DISCORD_ENABLED: "true"
      GOTRUE_EXTERNAL_DISCORD_CLIENT_ID: ${DISCORD_CLIENT_ID}
      GOTRUE_EXTERNAL_DISCORD_SECRET: ${DISCORD_CLIENT_SECRET}
      GOTRUE_EXTERNAL_DISCORD_REDIRECT_URI: ${API_EXTERNAL_URL}/auth/v1/callback

      # Google OAuth
      GOTRUE_EXTERNAL_GOOGLE_ENABLED: "true"
      GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOTRUE_EXTERNAL_GOOGLE_SECRET: ${GOOGLE_CLIENT_SECRET}
      GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: ${API_EXTERNAL_URL}/auth/v1/callback
```

### 4. 添加环境变量

编辑 `~/supabase/docker/.env`，添加：

```env
############
# OAuth 配置
############
# Discord
DISCORD_CLIENT_ID=你的Discord_Client_ID
DISCORD_CLIENT_SECRET=你的Discord_Client_Secret

# Google
GOOGLE_CLIENT_ID=你的Google_Client_ID
GOOGLE_CLIENT_SECRET=你的Google_Client_Secret
```

### 5. 重启 Supabase

```bash
cd ~/supabase/docker
docker-compose down
docker-compose up -d
```

### 6. 验证配置

```bash
# 检查 auth 容器环境变量
docker exec supabase-auth env | grep -E "DISCORD|GOOGLE"

# 应该看到类似输出：
# GOTRUE_EXTERNAL_DISCORD_ENABLED=true
# GOTRUE_EXTERNAL_DISCORD_CLIENT_ID=xxxxx
# ...
```

### 常见问题

**"Unsupported provider: provider is not enabled"**
- 检查 `docker-compose.yml` 中是否正确添加了 `GOTRUE_EXTERNAL_xxx_ENABLED: "true"`
- 确保重启了 Supabase

**"OAuth2 redirect_uri 无效"**
- 检查 Discord/Google 后台配置的回调地址是否与 `API_EXTERNAL_URL` 一致
- 回调地址必须完全匹配，包括协议（http/https）和端口

**登录后卡在 "Confirming your account..."**
- 检查 `SITE_URL` 是否正确指向前端地址
- 检查 `GOTRUE_URI_ALLOW_LIST` 是否包含前端地址

---

## 项目部署

### 1. 克隆项目

```bash
git clone https://github.com/你的用户名/val-lineup.git /www/wwwroot/val-lineup
cd /www/wwwroot/val-lineup
```

### 2. 创建环境变量

```bash
cat > .env << 'EOF'
SUPABASE_URL=http://127.0.0.1:8000
SUPABASE_KEY=你的ANON_KEY
EOF
```

> `SUPABASE_KEY` 就是 Supabase `.env` 里的 `ANON_KEY`

### 3. 执行数据库迁移

```bash
# 方法 1：逐个执行迁移文件
for f in supabase/migrations/*.sql; do
  docker exec -i supabase-db psql -U postgres < "$f"
done

# 方法 2：一次性执行所有
cat supabase/migrations/*.sql | docker exec -i supabase-db psql -U postgres
```

### 4. 构建并启动

```bash
docker-compose up -d --build
```

### 5. 验证部署

```bash
# 检查容器状态
docker ps | grep val-lineup

# 查看日志
docker-compose logs -f

# 测试访问
curl http://127.0.0.1:3000
```

### 6. 开放防火墙端口

在宝塔或服务器防火墙中放行：
- `3000` - Nuxt 应用
- `8000` - Supabase API

---

## Git 更新流程

### 日常更新（本地修改后）

**本地操作：**
```bash
git add .
git commit -m "更新内容"
git push
```

**服务器操作：**
```bash
cd /www/wwwroot/val-lineup
git pull
docker-compose up -d --build
```

### 一键更新脚本

在服务器创建 `deploy.sh`：

```bash
#!/bin/bash
set -e

cd /www/wwwroot/val-lineup

echo ">>> 拉取最新代码..."
git pull origin main

echo ">>> 重新构建并启动..."
docker-compose up -d --build

echo ">>> 清理旧镜像..."
docker image prune -f

echo ">>> 部署完成！"
docker ps | grep val-lineup
```

赋予执行权限：
```bash
chmod +x deploy.sh
```

之后更新只需：
```bash
./deploy.sh
```

### 数据库迁移更新

如果有新的迁移文件：
```bash
docker exec -i supabase-db psql -U postgres < supabase/migrations/新文件.sql
```

---

## 常用命令

### Docker 管理

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括停止的）
docker ps -a

# 停止项目
docker-compose down

# 重启项目
docker-compose restart

# 查看日志
docker-compose logs -f

# 重新构建
docker-compose up -d --build

# 清理无用镜像
docker image prune -f
```

### Supabase 管理

```bash
# 重启 Supabase
cd ~/supabase/docker && docker-compose restart

# 查看 Supabase 日志
cd ~/supabase/docker && docker-compose logs -f

# 进入 PostgreSQL
docker exec -it supabase-db psql -U postgres

# 备份数据库
docker exec supabase-db pg_dump -U postgres > backup_$(date +%Y%m%d).sql

# 恢复数据库
cat backup.sql | docker exec -i supabase-db psql -U postgres
```

---

## 故障排查

### 500 错误：Supabase URL/Key 问题

```bash
# 检查 .env 文件
cat /www/wwwroot/val-lineup/.env

# 确保格式正确（无空格、无引号）
SUPABASE_URL=http://127.0.0.1:8000
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 重新构建
docker-compose up -d --build
```

### 容器无法启动

```bash
# 查看日志
docker-compose logs

# 检查端口占用
netstat -tlnp | grep 3000
```

### Supabase 连接失败

```bash
# 检查 Supabase 是否运行
docker ps | grep supabase

# 测试数据库连接
docker exec -it supabase-db psql -U postgres -c "SELECT 1"

# 测试 API
curl http://127.0.0.1:8000/rest/v1/
```

### 页面打开但功能异常

```bash
# 检查浏览器控制台错误
# 确认 Supabase API 可以从外部访问
curl http://服务器IP:8000/rest/v1/
```

---

## 架构图

```
用户浏览器
    │
    ▼
┌─────────────────────────────────────┐
│           服务器                     │
│                                     │
│  ┌─────────────┐  ┌──────────────┐  │
│  │ Nuxt App    │  │  Supabase    │  │
│  │ (Port 3000) │◄─│  (Port 8000) │  │
│  └─────────────┘  └──────────────┘  │
│                          │          │
│                   ┌──────┴──────┐   │
│                   │ PostgreSQL  │   │
│                   │ (Port 5432) │   │
│                   └─────────────┘   │
└─────────────────────────────────────┘
```
