const { StatusCodes } = require("http-status-codes");

const User = require("../models/User");
const Inquiry = require("../models/Inquiry");
const { decodeToken } = require("../services/auth");
const { default: mongoose } = require("mongoose");

/** @type {import("express").RequestHandler} */
exports.getInquiries = async function (req, res) {
  try {
    const user = req.user;
    const clientFilter = req.clientFilter;

    let inquiries;

    if (user.role === "admin") {
      inquiries = await Inquiry.find({
        ...clientFilter,
        sender: user._id,
      }).select("-receiverUsers -sender");
    } else {
      inquiries = await Inquiry.aggregate([
        {
          $match: {
            ...clientFilter,
            "receiverUsers.user": mongoose.Types.ObjectId.createFromHexString(
              user._id
            ),
          },
        },
        {
          $addFields: {
            receiverUsers: {
              $filter: {
                input: "$receiverUsers",
                as: "receiverUser",
                cond: {
                  $eq: [
                    "$$receiverUser.user",
                    mongoose.Types.ObjectId.createFromHexString(user._id),
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            contract: { $arrayElemAt: ["$receiverUsers", 0] },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "sender",
            foreignField: "_id",
            as: "sender",
          },
        },
        {
          $addFields: {
            sender: { $arrayElemAt: ["$sender", 0] },
          },
        },
        {
          $project: {
            title: 1,
            desc: 1,
            "sender.firstName": 1,
            "sender.lastName": 1,
            "sender.username": 1,
            "contract.contractStatus": 1,
            "contract.senderAnswer": 1,
            "contract.receiverUserAnswer": 1,
          },
        },
      ]);
    }

    res.status(StatusCodes.OK).send(inquiries);
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};

/** @type {import("express").RequestHandler} */
exports.getInquiryReceiverUsers = async function (req, res) {
  try {
    const inquiry = await Inquiry.findOne({ _id: req.params.inquiryId })
      .select("-title -desc -sender -receiverUsers.replies")
      .populate("receiverUsers.user", "-password");

    if (!inquiry) {
      throw new Error("Inquiry not found.");
    }

    res.status(StatusCodes.OK).send(inquiry.receiverUsers);
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};

/** @type {import("express").RequestHandler} */
exports.getInquiryReceiverUserReplies = async function (req, res) {
  try {
    const user = req.user;

    let receiverUserId = user._id;

    if (user.role === "admin") {
      receiverUserId = req.params.receiverUserId;
    }

    const [inquiry] = await Inquiry.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId.createFromHexString(
            req.params.inquiryId
          ),
        },
      },
      { $unwind: "$receiverUsers" },
      {
        $match: {
          "receiverUsers.user":
            mongoose.Types.ObjectId.createFromHexString(receiverUserId),
        },
      },
      {
        $group: {
          _id: "$_id",
          title: { $first: "$title" },
          desc: { $first: "$desc" },
          sender: { $first: "$sender" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          receiverUsers: { $push: "$receiverUsers" },
        },
      },
    ]);

    if (!inquiry) {
      throw new Error("Inquiry not found.");
    }

    const receiverUser = inquiry.receiverUsers[0];

    let replyStatus = {
      value: true,
    };

    const canOnlyRejectOrContinue =
      user.role === "admin" &&
      receiverUser.receiverUserAnswer === "additional-info-required";

    if (canOnlyRejectOrContinue) {
      replyStatus.value = "limited";
    }

    const canReplyFirstMessage =
      user.role === "admin"
        ? receiverUser.receiverUserAnswer !== "not-answered"
        : true;

    if (!canReplyFirstMessage) {
      replyStatus.value = false;
      replyStatus.reason = "wait-for-first-reply";
    }

    const isConversationClosed =
      receiverUser.senderAnswer === "rejected" ||
      receiverUser.senderAnswer === "accepted" ||
      receiverUser.receiverUserAnswer === "rejected";

    if (isConversationClosed) {
      replyStatus.value = false;
      replyStatus.reason = "conversation-is-closed";
    }

    res.status(StatusCodes.OK).send({
      replyStatus,
      replies: receiverUser.replies,
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};

/** @type {import("express").RequestHandler} */
exports.enquiry = async function (req, res) {
  try {
    const { title, desc, from, receiverUsersIds } = req.body;

    const user = req.user;

    const users = await User.find({
      _id: { $in: receiverUsersIds },
      role: "user",
    }).select("_id");

    const inquiry = new Inquiry({
      title,
      desc,
      from,
      sender: user,
      receiverUsers: users.map((user) => ({
        user: user._id,
      })),
    });

    if (receiverUsersIds.includes(user._id)) {
      throw new Error("You can't broadcast inquiry to yourself.");
    }

    await inquiry.save();

    res
      .status(StatusCodes.CREATED)
      .send("Inquiry added and broadcasted successfully.");
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};

/** @type {import("express").RequestHandler} */
exports.answerInquiry = async function (req, res) {
  try {
    const { replyMessage, answer } = req.body;

    const token = req.headers["authorization"].split(" ")[1];
    const user = decodeToken(token);

    const inquiry = await Inquiry.findById(req.params.inquiryId);

    if (!inquiry) {
      throw new Error("Inquiry not found.");
    }

    let receiverUserId = user._id;
    let answerToChange = "receiverUserAnswer";

    if (user.role === "admin") {
      if (req.body.receiverUserId) {
        receiverUserId = req.body.receiverUserId;
        answerToChange = "senderAnswer";
      } else {
        throw new Error("Fields required: receiverUserId");
      }
    }

    const receiverUser = inquiry.receiverUsers.find(
      (receiverUser) => receiverUser.user._id.toString() === receiverUserId
    );

    if (!receiverUser) {
      throw new Error("User is not a receiver of this inquiry.");
    }

    if (
      receiverUser.receiverUserAnswer === "not-answered" &&
      user.role === "admin"
    ) {
      throw new Error("You have to wait until receiver user user replies.");
    }

    if (
      receiverUser.receiverUserAnswer === "additional-info-required" &&
      user.role === "admin" &&
      answer === "accepted"
    ) {
      throw new Error(
        "Admins can't accept requests until receiver users accept."
      );
    }

    if (
      receiverUser.senderAnswer === "rejected" ||
      receiverUser.senderAnswer === "accepted" ||
      receiverUser.receiverUserAnswer === "rejected"
    ) {
      throw new Error("This conversation is closed.");
    }

    const progressAnswers = ["offer-in-progress", "additional-info-required"];
    if (
      !progressAnswers.includes(receiverUser[answerToChange]) &&
      receiverUser[answerToChange] === answer
    ) {
      throw new Error("This answer is already submitted.");
    }

    receiverUser[answerToChange] = answer;
    if (replyMessage) {
      receiverUser.replies.push({
        from: user._id,
        message: replyMessage,
      });
    }

    await inquiry.save();

    res.status(StatusCodes.OK).send("Submitted answer successfully.");
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};
