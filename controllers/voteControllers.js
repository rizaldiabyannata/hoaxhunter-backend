const Hoax = require("../models/hoaxModel");
const { addHistory } = require("../utils/history");

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

    await addHistory(
      req.user.id,
      "vote",
      hoaxId,
      `Voted ${isHoax ? "Hoax" : "Not Hoax"} on article: ${hoax.title}`
    );

    if (isHoax) {
      hoax.totalVotes.hoax += 1;
    } else {
      hoax.totalVotes.notHoax += 1;
    }

    await hoax.save();

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
