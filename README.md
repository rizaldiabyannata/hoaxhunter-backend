# Hoax Detection API

API untuk mendeteksi hoax, memungkinkan pengguna untuk mengunggah artikel, memberikan komentar, memberikan suara (vote), dan mengikuti topik tertentu berdasarkan tag. Proyek ini dirancang menggunakan Node.js, Express, dan MongoDB.

## Fitur Utama

- **CRUD Artikel Hoax**: Buat, baca, perbarui, dan hapus artikel hoax.
- **Sistem Voting**: Pengguna dapat memberikan suara untuk menentukan apakah artikel adalah hoax atau bukan.
- **Komentar**: Pengguna dapat menambahkan komentar pada artikel.
- **Tag**: Artikel dapat memiliki banyak tag, dengan default tag adalah `all`.
- **Autentikasi**: Sistem menggunakan JWT untuk autentikasi pengguna.
- **Manajemen Pengguna**: Pengguna dapat mengikuti tag tertentu.

---

## Teknologi yang Digunakan

- **Backend**: Node.js, Express.js
- **Database**: MongoDB dengan Mongoose
- **Autentikasi**: JSON Web Token (JWT)
- **File Upload**: Multer untuk mengunggah file

---

## Instalasi

### Prasyarat

1. **Node.js/Bun.js**
2. **MongoDB**: Pastikan MongoDB berjalan di lokal Anda atau gunakan layanan cloud seperti MongoDB Atlas.
3. **Postman**: Untuk menguji API.

### Langkah Instalasi

1. Clone repositori ini:

   ```bash
   git clone https://github.com/rizaldiabyannata/hoaxhunter-backend
   cd hoaxhunter-backend
   ```

2. Instal dependensi:

   ```bash
   npm install
   ```

3. Buat file `.env` di root proyek dan tambahkan konfigurasi berikut:

   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/hoax-detection
   JWT_SECRET=your_secret_key
   ```

4. Jalankan server:

   ```bash
   npm start
   ```

5. Server akan berjalan di `http://localhost:5000`.

---

## Dokumentasi API

### **1. Endpoint Autentikasi**

#### **Register**

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "example",
    "email": "example@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "id": "64b23456789012345cde6789",
      "username": "example",
      "email": "example@example.com"
    }
  }
  ```

#### **Login**

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "example@example.com",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "token": "your_jwt_token",
    "user": {
      "id": "64b23456789012345cde6789",
      "username": "example",
      "email": "example@example.com"
    }
  }
  ```

---

### **2. Endpoint Artikel Hoax**

#### **Buat Artikel**

- **URL**: `/api/hoaxes`
- **Method**: `POST`
- **Headers**:
  - `Authorization`: Bearer `your_jwt_token`
- **Body (form-data)**:
  - `title`: Judul artikel
  - `description`: Deskripsi artikel
  - `files`: File (PDF/Gambar)
- **Response**:
  ```json
  {
    "message": "Article created successfully",
    "article": {
      "id": "64b23456789012345cde6789",
      "title": "Berita Hoax",
      "description": "Deskripsi berita hoax",
      "files": [
        {
          "url": "http://localhost:5000/uploads/file1.pdf",
          "fileType": "application/pdf"
        }
      ],
      "tags": ["all"]
    }
  }
  ```

#### **Dapatkan Semua Artikel**

- **URL**: `/api/hoaxes`
- **Method**: `GET`
- **Response**:
  ```json
  [
    {
      "id": "64b23456789012345cde6789",
      "title": "Berita Hoax",
      "description": "Deskripsi berita hoax",
      "tags": ["all"]
    }
  ]
  ```

---

### **3. Endpoint Voting**

#### **Berikan Suara**

- **URL**: `/api/hoaxes/:id/vote`
- **Method**: `POST`
- **Headers**:
  - `Authorization`: Bearer `your_jwt_token`
- **Body**:
  ```json
  {
    "isHoax": true
  }
  ```
- **Response**:
  ```json
  {
    "message": "Vote added successfully",
    "totalVotes": {
      "hoax": 1,
      "notHoax": 0
    }
  }
  ```

---

## Struktur Folder

```
hoax-detection-api/
├── controllers/     # Berisi logika controller
├── middleware/      # Middleware untuk autentikasi
├── models/          # Definisi schema Mongoose
├── routes/          # Definisi route API
├── uploads/         # Folder untuk menyimpan file yang diunggah
├── .env             # File konfigurasi environment
├── server.js        # Entry point server
└── README.md        # Dokumentasi proyek
```

---

## Kontribusi

Jika Anda ingin berkontribusi, silakan fork repositori ini dan buat pull request dengan perubahan yang Anda inginkan.

---

## Lisensi

Proyek ini menggunakan lisensi **MIT**.

---

## Catatan Tambahan

- Pastikan `UPLOADS_DIR` di `.env` sesuai dengan konfigurasi di proyek Anda.
- Gunakan Postman atau aplikasi lain untuk mengetes endpoint.
- Tambahkan middleware tambahan jika diperlukan, seperti rate-limiting atau validasi input lebih lanjut.

---

Terima kasih telah menggunakan API ini! 🚀
