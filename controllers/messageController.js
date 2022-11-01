const Messages = require("../models/message");
require("dotenv").config();
const s3 = require("../utils/s3");
const crypto = require("crypto");
const { promisify } = require("util");
var mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
module.exports.addMessage = async (req, res, next) => {
  try {
    const { sender, conversation, text, type, media } = req.body;
    const data = await Messages.create({
      conversation: conversation._id,
      sender: sender,
      text: text,
      type: type,
      media: media,
    }).then((data) => data.populate("sender", "_id avatarURL username"));
    await Conversation.findOneAndUpdate(
      { _id: mongoose.Types.ObjectId(conversation._id)},
      { lastMessage: data._id }
    )
    if (data) {
      return res.json({
        data: data,
      });
    }
    return res.status(200).json({ msg: "failed to add message " });
  } catch (error) {
    next(error);
  }
};

// module.exports.updateLastMessage = async (req, res) => {
//   const {messId,conversationId} = req.body;
//   try {
//     const conversation = await Conversation.findOneAndUpdate(
//       { _id: mongoose.Types.ObjectId(conversationId)},
//       { lastMessage: messId }
//     )
//       .select("-updatedAt")
//       .populate("member", "profilePicture username phoneNumber");
//     res.status(200).json(conversation);
//   } catch (error) {
//     res.status(500).json({ msg: error });
//   }
// };


module.exports.getAllMessage = async (req, res, next) => {
  try {
    const { conversation } = req.body;
    const messages = await Messages.find({
      conversation: conversation,
    })
      .select("-updatedAt")
      .sort({ createAt: 1 })
      .populate("sender", "_id avatarURL");

    return res.json({ data: messages });
  } catch (error) {
    next(error);
  }
};

module.exports.uploadFile = async (req, res, next) => {
  try {
    const randomBytes = promisify(crypto.randomBytes);
    const rawBytes = await randomBytes(16);
    const imageName = rawBytes.toString("hex");
    const file = req.file
    const code = await s3.generateUploadURL(file, imageName);
    return res.json({
      data: "https://cmn-savefile.s3.ap-northeast-1.amazonaws.com/" + code,
    });
  } catch (error) {
    next(error);
  }
};


module.exports.deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.body;
    const data = await Messages.findByIdAndUpdate({
      _id: mongoose.Types.ObjectId(id)
    },{isDelete:true}).then((data) => data.populate("sender", "_id avatarURL"));
    if (data) {
      return res.status(200).json({
        data: data});
    }
    return res.status(500).json({ msg: "failed to update message " });
  } catch (error) {
    next(error);
  }
};
