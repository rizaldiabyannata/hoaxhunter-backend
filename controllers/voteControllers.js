const Hoax = require("../models/hoaxModel");
const { addHistory } = require("../utils/history");
const { logActivity } = require("../utils/logService");

const addVote = async (req, res) => {
  try {
    const { hoaxId, isHoax } = req.body;

    if (typeof isHoax === "undefined" || !hoaxId) {
      return res
        .status(400)
        .json({ error: "Hoax ID and vote decision are required" });
    }

    const hoax = await Hoax.findById(hoaxId);

    if (!hoax) {
      return res.status(404).json({ error: "Hoax not found" });
    }

    // Cek apakah user sudah vote
    const existingVoteIndex = hoax.votes.findIndex(
      (vote) => vote.user.toString() === req.user.id
    );

    if (existingVoteIndex !== -1) {
      // Jika user sudah vote, kurangi jumlah vote sebelumnya
      const previousVote = hoax.votes[existingVoteIndex];
      if (previousVote.isHoax) {
        hoax.totalVotes.hoax -= 1;
      } else {
        hoax.totalVotes.notHoax -= 1;
      }
      // Ganti vote dengan yang baru
      hoax.votes[existingVoteIndex].isHoax = isHoax;
    } else {
      // Jika belum vote, tambahkan vote baru
      hoax.votes.push({
        user: req.user.id,
        isHoax,
      });
    }

    // Tambahkan vote baru ke total
    if (isHoax) {
      hoax.totalVotes.hoax += 1;
    } else {
      hoax.totalVotes.notHoax += 1;
    }

    await hoax.save();

    await addHistory(
      req.user.id,
      "vote",
      hoaxId,
      `Voted ${isHoax ? "Hoax" : "Not Hoax"} on article: ${hoax.title}`
    );

    await logActivity(
      req.user.id,
      hoax.id,
      "vote",
      hoax.tags,
      `Say Article is ${isHoax}`
    );

    res.status(201).json({
      message: "Vote added/updated successfully",
      totalVotes: hoax.totalVotes,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while adding/updating the vote" });
  }
};

module.exports = { addVote };
