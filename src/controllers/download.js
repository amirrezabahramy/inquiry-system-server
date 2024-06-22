const { StatusCodes } = require("http-status-codes");

const Inquiry = require("../models/Inquiry");

/** @type {import("express").RequestHandler} */
exports.downloadInquiryFile = async function (req, res) {
  try {
    const user = req.user;
    const { inquiryId } = req.params;
    const { type } = req.query;

    const filter = Object.assign(
      {
        _id: inquiryId,
      },
      user.role === "admin"
        ? { sender: user._id }
        : { "receiverUsers.user": user._id }
    );

    const inquiry = await Inquiry.findOne(filter);

    if (!inquiry) {
      throw new Error("Inquiry not found.");
    }

    let fileToSend;
    if (type === "pic") {
      fileToSend = inquiry.pic;
    } else if (type === "doc") {
      fileToSend = inquiry.doc;
    }

    if (!fileToSend) {
      throw new Error("This type of file does not exist on this inquiry.");
    }

    res.status(StatusCodes.OK).send({ file: fileToSend });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};

/** @type {import("express").RequestHandler} */
exports.downloadReplyFile = async function (req, res) {
  try {
    const user = req.user;

    const { replyId } = req.params;
    const { type } = req.query;

    const filter = Object.assign(
      {
        "receiverUsers.replies._id": replyId,
      },
      user.role === "admin"
        ? { sender: user._id }
        : { "receiverUsers.user": user._id }
    );

    const inquiry = await Inquiry.findOne(filter);

    if (!inquiry) {
      throw new Error("Inquiry not found.");
    }

    let reply;
    if (user.role === "admin") {
      for (const receiverUser of inquiry.receiverUsers) {
        reply = receiverUser.replies.find(
          (reply) => reply._id.toString() === replyId.toString()
        );
        if (reply) {
          break;
        }
      }
    } else {
      reply = inquiry.receiverUsers
        .find(
          (receiverUser) => receiverUser.user.toString() === user._id.toString()
        )
        .replies.find((reply) => reply._id.toString() === replyId.toString());
    }

    let fileToSend;

    if (type === "pic") {
      fileToSend = reply.pic;
    } else if (type === "doc") {
      fileToSend = reply.doc;
    }

    if (!fileToSend) {
      throw new Error("This type of file does not exist on this reply.");
    }

    res.status(StatusCodes.OK).send({ file: fileToSend });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};
