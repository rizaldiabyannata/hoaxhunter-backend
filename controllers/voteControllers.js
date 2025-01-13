const Hoax = require("../models/hoaxModel");
const { addHistory } = require("../utils/history");
const { logActivity } = require("../utils/logService");

const addVote = async (req, res) => {
  try {
    const { hoaxId, isHoax } = req.body;

    console.log(req);

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
    const existingVote = hoax.votes.find(
      (vote) => vote.user.toString() === req.user.id
    );

    if (existingVote) {
      return res
        .status(400)
        .json({ error: "You have already voted on this hoax" });
    }

    const newVote = {
      user: req.user.id, // Ambil user ID dari middleware autentikasi
      isHoax,
    };

    hoax.votes.push(newVote);

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
      message: "Vote added successfully",
      totalVotes: hoax.totalVotes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while adding the vote" });
  }
};

module.exports = { addVote };
