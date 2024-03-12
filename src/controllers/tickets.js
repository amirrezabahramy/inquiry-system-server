const { StatusCodes } = require("http-status-codes");

const User = require("../models/User");
const Ticket = require("../models/Ticket");
const { decodeToken } = require("../services/auth");
const { default: mongoose } = require("mongoose");

/** @type {import("express").RequestHandler} */
exports.getTicketsList = async function (req, res) {
  try {
    const user = req.user;

    let tickets;

    if (user.role === "admin") {
      tickets = await Ticket.find({ sender: user._id }).select(
        "-receiverUsers -sender"
      );
    } else {
      tickets = await Ticket.find({ "receiverUsers.user": user._id })
        .select("-receiverUsers")
        .populate("sender", "firstName lastName username");
    }

    res.status(StatusCodes.OK).send(tickets);
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};

/** @type {import("express").RequestHandler} */
exports.getTicketReceiverUsers = async function (req, res) {
  try {
    const ticket = await Ticket.findById(req.params.ticketId)
      .select("-title -desc -sender -receiverUsers.replies")
      .populate("receiverUsers.user", "-password");

    if (!ticket) {
      throw new Error("Ticket not found.");
    }

    res.status(StatusCodes.OK).send(ticket.receiverUsers);
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};

/** @type {import("express").RequestHandler} */
exports.getTicketReceiverUserReplies = async function (req, res) {
  try {
    const user = req.user;

    let answerToCheck = "receiverUserAnswer";
    let finishAnswers = ["rejected"];
    let receiverUserId = user._id;

    if (user.role === "admin") {
      finishAnswers.push("accepted");
      answerToCheck = "senderAnswer";
      receiverUserId = req.params.receiverUserId;
    }

    const [ticket] = await Ticket.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId.createFromHexString(req.params.ticketId),
        },
      },
      {
        $unwind: "$receiverUsers",
      },
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

    if (!ticket) {
      throw new Error("Ticket not found.");
    }

    const receiverUser = ticket.receiverUsers[0];

    let replyStatus = {
      value: true,
    };

    const canReplyFirstMessage =
      user.role === "admin"
        ? receiverUser.receiverUserAnswer !== "not-answered"
        : true;

    if (!canReplyFirstMessage) {
      replyStatus.value = false;
      replyStatus.reason = "wait-for-first-reply";
    }

    const isConversationClosed = finishAnswers.includes(
      receiverUser[answerToCheck]
    );

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
exports.createAndBroadcastTicket = async function (req, res) {
  try {
    const { title, desc, from, receiverUsersIds } = req.body;

    const user = req.user;

    const users = await User.find({
      _id: { $in: receiverUsersIds },
      role: "user",
    }).select("_id");

    const ticket = new Ticket({
      title,
      desc,
      from,
      sender: user,
      receiverUsers: users.map((user) => ({
        user: user._id,
      })),
    });

    if (receiverUsersIds.includes(user._id)) {
      throw new Error("You can't broadcast ticket to yourself.");
    }

    await ticket.save();

    res
      .status(StatusCodes.CREATED)
      .send("Ticket added and broadcasted successfully.");
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};

/** @type {import("express").RequestHandler} */
exports.answerTicket = async function (req, res) {
  try {
    const { replyMessage, answer } = req.body;

    const token = req.headers["authorization"].split(" ")[1];
    const user = decodeToken(token);

    const ticket = await Ticket.findById(req.params.ticketId);

    if (!ticket) {
      throw new Error("Ticket not found.");
    }

    let receiverUserId = user._id;
    let answerToChange = "receiverUserAnswer";
    let finishAnswers = ["rejected"];

    if (user.role === "admin") {
      if (req.body.receiverUserId) {
        receiverUserId = req.body.receiverUserId;
        answerToChange = "senderAnswer";
        finishAnswers.push("accepted");
      } else {
        throw new Error("Fields required: receiverUserId");
      }
    }

    const receiverUser = ticket.receiverUsers.find(
      (receiverUser) => receiverUser.user._id.toString() === receiverUserId
    );

    if (!receiverUser) {
      throw new Error("User is not a receiver of this ticket.");
    }

    if (
      receiverUser.receiverUserAnswer === "not-answered" &&
      user.role === "admin"
    ) {
      throw new Error("You have to wait until receiverUser user replies.");
    }

    if (finishAnswers.includes(receiverUser[answerToChange])) {
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

    await ticket.save();

    res.status(StatusCodes.OK).send("Submitted answer successfully.");
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};
