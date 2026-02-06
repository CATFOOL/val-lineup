#!/bin/bash
echo ">>> 拉取最新代码..."
git pull origin main

echo ">>> 重新构建并启动..."
docker-compose up -d --build

echo ">>> 清理旧镜像..."
docker image prune -f

echo ">>> 部署完成！"
docker ps | grep val-lineup
