const logger = require("../utils/logger"); // Import logger
const User = require("../models/userModel");
const Tag = require("../models/tagModel");

const createTag = async (req, res) => {
  try {
    const { name } = req.body;
    logger.info("Received createTag request", { name });

    if (!name) {
      logger.warn("Validation failed: Tag name is required");
      return res.status(400).json({ error: "Tag name is required" });
    }

    const existingTag = await Tag.findOne({ name: name.toLowerCase() });
    if (existingTag) {
      logger.warn(`Tag already exists: ${name}`);
      return res
        .status(400)
        .json({ error: "Tag with this name already exists" });
    }

    const tag = new Tag({ name: name.toLowerCase() });
    await tag.save();

    logger.info(`Tag created successfully: ${tag.name}`);
    res.status(201).json({ message: "Tag created successfully", tag });
  } catch (error) {
    logger.error("Error in createTag", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

const followTag = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tagId } = req.body;

    logger.info(`User ${userId} is trying to follow tag ${tagId}`);

    const tag = await Tag.findById(tagId);
    if (!tag) {
      logger.warn(`Tag not found: ${tagId}`);
      return res.status(404).json({ error: "Tag not found" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { followedTags: tagId } },
      { new: true }
    ).populate("followedTags");

    logger.info(`User ${userId} followed tag ${tagId}`);
    res.status(200).json({ message: "Tag followed successfully", user });
  } catch (error) {
    logger.error("Error in followTag", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

const unfollowTag = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tagId } = req.body;

    logger.info(`User ${userId} is trying to unfollow tag ${tagId}`);

    const tag = await Tag.findById(tagId);
    if (!tag) {
      logger.warn(`Tag not found: ${tagId}`);
      return res.status(404).json({ error: "Tag not found" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { followedTags: tagId } },
      { new: true }
    ).populate("followedTags");

    logger.info(`User ${userId} unfollowed tag ${tagId}`);
    res.status(200).json({ message: "Tag unfollowed successfully", user });
  } catch (error) {
    logger.error("Error in unfollowTag", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

const editTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    logger.info(`Received editTag request`, { id, name });

    if (!name) {
      logger.warn("Validation failed: Tag name is required");
      return res.status(400).json({ error: "Tag name is required" });
    }

    const existingTag = await Tag.findOne({ name: name.toLowerCase() });
    if (existingTag && existingTag._id.toString() !== id) {
      logger.warn(`Tag name conflict: ${name}`);
      return res
        .status(400)
        .json({ error: "Tag with this name already exists" });
    }

    const updatedTag = await Tag.findByIdAndUpdate(
      id,
      { name: name.toLowerCase() },
      { new: true }
    );

    if (!updatedTag) {
      logger.warn(`Tag not found: ${id}`);
      return res.status(404).json({ error: "Tag not found" });
    }

    logger.info(`Tag updated successfully: ${updatedTag.name}`);
    res
      .status(200)
      .json({ message: "Tag updated successfully", tag: updatedTag });
  } catch (error) {
    logger.error("Error in editTag", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    logger.info(`Received deleteTag request`, { id });

    const tag = await Tag.findByIdAndDelete(id);
    if (!tag) {
      logger.warn(`Tag not found: ${id}`);
      return res.status(404).json({ error: "Tag not found" });
    }

    logger.info(`Tag deleted successfully: ${id}`);
    res.status(200).json({ message: "Tag deleted successfully" });
  } catch (error) {
    logger.error("Error in deleteTag", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

module.exports = { followTag, unfollowTag, createTag, deleteTag, editTag };
