# Stage 1: Build
FROM node:latest AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --only=production
COPY . .

# Stage 2: Runtime
FROM node:latest
WORKDIR /app
COPY --from=builder /app /app
EXPOSE 3000

# Jalankan aplikasi
CMD ["npm", "run", "backend"]
