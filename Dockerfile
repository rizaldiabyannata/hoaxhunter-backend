# Gunakan image Node.js terbaru
FROM node:latest

# Set working directory di dalam container
WORKDIR /app

# Copy file package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy semua file ke dalam container
COPY . .

# Pastikan port sesuai dengan yang ada di .env
EXPOSE 5000

# Jalankan aplikasi
CMD ["npm", "run", "backend"]
