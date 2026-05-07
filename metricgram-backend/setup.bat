@echo off
chcp 65001 > nul
echo 🚀 安裝 Metricgram 後端...

REM 檢查 Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js 未安裝，請先安裝 Node.js 20+
    exit /b 1
)

echo ✅ Node.js 已安裝

REM 安裝依賴
echo 📦 安裝依賴...
call npm install

REM 安裝共享類型包
echo 📦 安裝共享類型包...
cd ..\metricgram-shared-types
call npm install
call npm run build
cd ..\metricgram-backend

REM 檢查 .env
if not exist .env (
    echo ⚠️  .env 文件不存在，正在複製模板...
    copy .env.example .env
    echo 📝 請編輯 .env 文件，填寫 BOT_TOKEN、DATABASE_URL、JWT_SECRET
)

REM 生成 Prisma
echo 🔧 生成 Prisma Client...
call npx prisma generate

REM 數據庫遷移
echo 🗄️  執行數據庫遷移...
call npx prisma migrate dev --name init

REM 導入種子數據
echo 🌱 導入種子數據...
call npx prisma db seed

REM 創建目錄
if not exist uploads mkdir uploads
if not exist logs mkdir logs

echo ✅ 安裝完成！
echo.
echo 📋 下一步：
echo 1. 編輯 .env 文件填寫配置
echo 2. 啟動 Docker：docker-compose up -d
echo 3. 啟動開發服務器：npm run dev
echo.
echo 🌐 API 地址：http://localhost:3001

pause
