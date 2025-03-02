const logger = require("../utils/logger"); // Import logger dari file logger.js
const Hoax = require("../models/hoaxModel");
const { addHistory } = require("../utils/history");

const addVote = async (req, res) => {
  try {
    logger.info("Received vote request", { body: req.body, user: req.user.id });

    const { hoaxId, isHoax } = req.body;

    if (typeof isHoax === "undefined" || !hoaxId) {
      logger.warn("Validation failed: Hoax ID or vote decision missing");
      return res
        .status(400)
        .json({ error: "Hoax ID and vote decision are required" });
    }

    const hoax = await Hoax.findById(hoaxId);

    if (!hoax) {
      logger.warn(`Hoax not found: ${hoaxId}`);
      return res.status(404).json({ error: "Hoax not found" });
    }

    logger.info(`Hoax found: ${hoax.title} (ID: ${hoaxId})`);

    // Cek apakah user sudah vote sebelumnya
    const existingVoteIndex = hoax.votes.findIndex(
      (vote) => vote.user.toString() === req.user.id
    );

    if (existingVoteIndex !== -1) {
      logger.info(`User ${req.user.id} has already voted. Updating vote...`);
      const previousVote = hoax.votes[existingVoteIndex];

      if (previousVote.isHoax) {
        hoax.totalVotes.hoax -= 1;
      } else {
        hoax.totalVotes.notHoax -= 1;
      }

      hoax.votes[existingVoteIndex].isHoax = isHoax;
    } else {
      logger.info(`User ${req.user.id} is voting for the first time.`);
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

    logger.info(
      `Vote updated: ${hoax.totalVotes.hoax} hoax votes, ${hoax.totalVotes.notHoax} not hoax votes`
    );

    await hoax.save();

    logger.info("Vote saved successfully to database");

    await addHistory(
      req.user.id,
      "vote",
      hoaxId,
      `Voted ${isHoax ? "Hoax" : "Not Hoax"} on article: ${hoax.title}`
    );

    logger.info("Vote history recorded");

    res.status(201).json({
      message: "Vote added/updated successfully",
      totalVotes: hoax.totalVotes,
    });
  } catch (error) {
    logger.error("Error in addVote", {
      error: error.message,
      stack: error.stack,
    });
    res
      .status(500)
      .json({ error: "An error occurred while adding/updating the vote" });
  }
};

module.exports = { addVote };
