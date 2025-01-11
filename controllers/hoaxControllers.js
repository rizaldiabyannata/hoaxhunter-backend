const Article = require("../models/hoaxModel");

const createArticle = async (req, res) => {
  try {
    // Ambil ID pengguna dari token JWT
    const userId = req.user.id; // Asumsi req.user.id telah di-set di middleware autentikasi

    // Validasi file
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Files are required" });
    }

    // Cek apakah ada file yang gagal di-upload
    const invalidFiles = req.files.filter((file) => !file.filename);
    if (invalidFiles.length > 0) {
      return res
        .status(400)
        .json({ error: "Some files failed to upload", invalidFiles });
    }

    const { title, description } = req.body;

    // Validasi input
    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Title and description are required" });
    }

    // Proses file untuk disimpan di database
    const files = req.files.map((file) => ({
      url: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
      fileType: file.mimetype,
    }));

    // Simpan artikel ke database
    const article = new Article({
      title,
      description,
      files,
      createdBy: userId, // Tambahkan createdBy dari ID pengguna yang terautentikasi
    });

    await article.save();

    res.status(201).json({ message: "Article created successfully", article });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createArticle };
