const { StatusCodes } = require("http-status-codes");

const User = require("../models/User");
const Ticket = require("../models/Ticket");
const { decodeToken } = require("../services/auth");
const { default: mongoose } = require("mongoose");

/** @type {import("express").RequestHandler} */
exports.getTickets = async function (req, res) {
  try {
    const token = req.headers["authorization"].split(" ")[1];
    const user = decodeToken(token);

    const tickets = await Ticket.find({ sender: user._id }).select(
      "-receivers"
    );

    res.status(StatusCodes.OK).send(tickets);
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};

/** @type {import("express").RequestHandler} */
exports.getTicketReceivers = async function (req, res) {
  try {
    const ticket = await Ticket.findById(req.params.ticketId).select(
      "-title -desc -sender -receivers.replies"
    );

    if (!ticket) {
      throw new Error("Ticket not found.");
    }

    res.status(StatusCodes.OK).send(ticket.receivers);
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};
/** @type {import("express").RequestHandler} */
exports.getTicketReceiverReplies = async function (req, res) {
  try {
    const [ticket] = await Ticket.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId.createFromHexString(req.params.ticketId),
        },
      },
      {
        $unwind: "$receivers",
      },
      {
        $match: {
          "receivers.user": mongoose.Types.ObjectId.createFromHexString(
            req.params.receiverUserId
          ),
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
          receivers: { $push: "$receivers" },
        },
      },
    ]);
    res.status(StatusCodes.OK).send(ticket.receivers[0].replies);
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};

/** @type {import("express").RequestHandler} */
exports.createAndBroadcastTicket = async function (req, res) {
  try {
    const { title, desc, from, receiverUsersIds } = req.body;

    const token = req.headers["authorization"].split(" ")[1];
    const user = decodeToken(token);

    const users = await User.find({
      _id: { $in: receiverUsersIds },
      role: "user",
    }).select("_id");

    const ticket = new Ticket({
      title,
      desc,
      from,
      sender: user,
      receivers: users.map((user) => ({
        user: user._id,
      })),
    });

    if (receiverUsersIds.includes(user._id)) {
      throw new Error("You can't broadcast ticket to yourself.");
    }

    await ticket.save();

    res.status(StatusCodes.CREATED).send(ticket);
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
    let answerToChange = "receiverAnswer";
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

    const receiver = ticket.receivers.find(
      (receiver) => receiver.user._id.toString() === receiverUserId
    );

    if (!receiver) {
      throw new Error("User is not a receiver of this ticket.");
    }

    if (receiver.receiverAnswer === "not-answered" && user.role === "admin") {
      throw new Error("You have to wait until receiver user replies.");
    }

    if (finishAnswers.includes(receiver[answerToChange])) {
      throw new Error("This conversation is closed.");
    }

    receiver[answerToChange] = answer;
    if (replyMessage) {
      receiver.replies.push({
        from: user._id,
        message: replyMessage,
      });
    }

    await ticket.save();

    res.status(StatusCodes.OK).send(ticket);
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};
