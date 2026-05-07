#!/bin/bash

# Metricgram 後端安裝腳本
# 自動化部署 setup.sh

set -e

echo "🚀 Installing Metricgram Backend..."

# 1. 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version must be 20 or higher. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# 2. 安裝依賴
echo "📦 Installing dependencies..."
npm install

# 3. 安裝共享類型包
echo "📦 Installing shared types..."
cd ../metricgram-shared-types
npm install
npm run build
cd ../metricgram-backend

# 4. 檢查 .env
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env and add your BOT_TOKEN, DATABASE_URL, JWT_SECRET"
fi

# 5. 生成 Prisma Client
echo "🔧 Generating Prisma client..."
npx prisma generate

# 6. 運行數據庫遷移
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

# 7. 導入種子數據
echo "🌱 Seeding database..."
npx prisma db seed

# 8. 創建必要目錄
mkdir -p uploads logs

echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start Docker containers: docker-compose up -d"
echo "3. Run development server: npm run dev"
echo ""
echo "🌐 API will be available at: http://localhost:3001"
echo "🤖 Bot will start automatically"
