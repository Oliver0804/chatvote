# 使用官方 Node.js 18 Alpine 映像
FROM node:18-alpine

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 安裝依賴套件
RUN npm install --only=production

# 複製應用程式原始碼
COPY . .

# 建立非 root 用戶
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 更改檔案所有者
RUN chown -R nodejs:nodejs /app
USER nodejs

# 暴露端口
EXPOSE 3000

# 設定環境變數
ENV NODE_ENV=production

# 啟動應用程式
CMD ["node", "server.js"]