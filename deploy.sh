#!/bin/bash
set -e

# ============================================
# Val-Lineup 一键部署/更新脚本
# ============================================

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

echo "============================================"
echo "  Val-Lineup 部署脚本"
echo "============================================"

# ---- 1. 拉取最新代码 ----
echo ""
echo ">>> [1/5] 拉取最新代码..."
git pull origin main

# ---- 2. 检查并执行新的数据库迁移 ----
echo ""
echo ">>> [2/5] 检查数据库迁移..."

# 记录文件放在项目目录下（持久化，不受重启影响）
MIGRATION_RECORD="$APP_DIR/.migrations_applied"
touch "$MIGRATION_RECORD"

MIGRATION_FILES=$(ls -1 supabase/migrations/*.sql 2>/dev/null)
NEW_COUNT=0

if [ -n "$MIGRATION_FILES" ]; then
  for f in supabase/migrations/*.sql; do
    FNAME=$(basename "$f")
    # 检查该迁移是否已执行过
    if ! grep -qxF "$FNAME" "$MIGRATION_RECORD"; then
      echo "    - 执行新迁移: $FNAME"
      docker exec -i supabase-db psql -U postgres < "$f" 2>&1 | tail -3
      # 执行成功后才记录
      echo "$FNAME" >> "$MIGRATION_RECORD"
      NEW_COUNT=$((NEW_COUNT + 1))
    fi
  done

  if [ "$NEW_COUNT" -eq 0 ]; then
    echo "    数据库已是最新，跳过迁移"
  else
    echo "    已执行 $NEW_COUNT 个新迁移"
  fi
else
  echo "    未找到迁移文件"
fi

# ---- 3. 重新构建并启动前端 ----
echo ""
echo ">>> [3/5] 构建并启动前端容器..."
docker compose up -d --build

# ---- 4. 重启 Supabase Edge Functions（如有更新） ----
echo ""
echo ">>> [4/5] 重启 Edge Functions runtime..."
EDGE_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i 'supabase-edge-functions' || true)
if [ -n "$EDGE_CONTAINER" ]; then
  docker restart "$EDGE_CONTAINER"
  echo "    Edge runtime 已重启: $EDGE_CONTAINER"
else
  echo "    未找到 supabase-edge-functions 容器，跳过"
fi

# ---- 5. 清理 ----
echo ""
echo ">>> [5/5] 清理旧镜像..."
docker image prune -f

echo ""
echo "============================================"
echo "  部署完成！"
echo "============================================"
echo ""
echo "前端:     http://localhost:3000"
echo "Supabase: http://localhost:8000"
echo ""
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E 'val-lineup|supabase' || true
