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
      inquiries = await Inquiry.aggregate([
        {
          $match: {
            ...clientFilter,
            sender: new mongoose.Types.ObjectId(user._id),
          },
        },
        {
          $addFields: {
            hasPic: {
              $cond: {
                if: { $ifNull: ["$pic", false] },
                then: true,
                else: false,
              },
            },
            hasDoc: {
              $cond: {
                if: { $ifNull: ["$doc", false] },
                then: true,
                else: false,
              },
            },
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },
        {
          $project: {
            receiverUsers: 0,
            sender: 0,
            updatedAt: 0,
            pic: 0,
            doc: 0,
          },
        },
      ]);
    } else {
      inquiries = await Inquiry.aggregate([
        {
          $match: {
            ...clientFilter,
            "receiverUsers.user": new mongoose.Types.ObjectId(user._id),
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
                    new mongoose.Types.ObjectId(user._id),
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
          $sort: {
            _id: -1,
          },
        },
        {
          $project: {
            title: 1,
            desc: 1,
            segmentName: 1,
            price: 1,
            count: 1,
            hasPic: {
              $cond: {
                if: { $ifNull: ["$pic", false] },
                then: true,
                else: false,
              },
            },
            hasDoc: {
              $cond: {
                if: { $ifNull: ["$doc", false] },
                then: true,
                else: false,
              },
            },
            deliveryDate: 1,
            deliveryPlace: 1,
            uniqueId: 1,
            "sender.firstName": 1,
            "sender.lastName": 1,
            "sender.username": 1,
            "contract.contractStatus": 1,
            "contract.senderAnswer": 1,
            "contract.receiverUserAnswer": 1,
            createdAt: 1,
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
    const [inquiry] = await Inquiry.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.inquiryId),
        },
      },
      {
        $unwind: "$receiverUsers",
      },
      {
        $lookup: {
          from: "users",
          foreignField: "_id",
          localField: "receiverUsers.user",
          as: "receiverUsers.user",
        },
      },
      {
        $unwind: "$receiverUsers.user",
      },
      {
        $group: {
          _id: "$_id",
          receiverUsers: { $push: "$receiverUsers" },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$$ROOT", { receiverUsers: "$receiverUsers" }],
          },
        },
      },
      ...(req.query.search
        ? [
            {
              $project: {
                receiverUsers: {
                  $filter: {
                    input: "$receiverUsers",
                    as: "receiverUser",
                    cond: {
                      $or: [
                        {
                          $regexMatch: {
                            input: "$$receiverUser.user.firstName",
                            regex: req.query.search,
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$$receiverUser.user.lastName",
                            regex: req.query.search,
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$$receiverUser.user.username",
                            regex: req.query.search,
                          },
                        },
                        {
                          $regexMatch: {
                            input: "$$receiverUser.user.email",
                            regex: req.query.search,
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          ]
        : []),
      {
        $project: {
          receiverUsers: {
            $map: {
              input: "$receiverUsers",
              as: "receiverUser",
              in: {
                user: {
                  _id: "$$receiverUser.user._id",
                  firstName: "$$receiverUser.user.firstName",
                  lastName: "$$receiverUser.user.lastName",
                  username: "$$receiverUser.user.username",
                  email: "$$receiverUser.user.email",
                },
                contractStatus: "$$receiverUser.contractStatus",
                senderAnswer: "$$receiverUser.senderAnswer",
                receiverUserAnswer: "$$receiverUser.receiverUserAnswer",
              },
            },
          },
        },
      },
    ]).limit(1);

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

    const [receiverUser] = await Inquiry.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.params.inquiryId),
        },
      },
      {
        $unwind: "$receiverUsers",
      },
      {
        $match: {
          "receiverUsers.user": new mongoose.Types.ObjectId(receiverUserId),
        },
      },
      {
        $unwind: {
          path: "$receiverUsers.replies",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          let: { fromId: "$receiverUsers.replies.from" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$fromId"] },
              },
            },
            {
              $project: {
                firstName: 1,
                lastName: 1,
              },
            },
          ],
          as: "receiverUsers.replies.from",
        },
      },
      {
        $unwind: {
          path: "$receiverUsers.replies.from",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: {
            _id: "$_id",
            receiverUser: "$receiverUsers.user",
          },
          senderAnswer: { $first: "$receiverUsers.senderAnswer" },
          receiverUserAnswer: {
            $first: "$receiverUsers.receiverUserAnswer",
          },
          replies: { $push: "$receiverUsers.replies" },
        },
      },
      {
        $project: {
          _id: "$_id._id",
          receiverUser: "$_id.receiverUser",
          senderAnswer: 1,
          receiverUserAnswer: 1,
          replies: {
            $map: {
              input: {
                $filter: {
                  input: "$replies",
                  as: "reply",
                  cond: {
                    $and: [
                      { $ne: ["$$reply", {}] },
                      ...(req.query.search
                        ? [
                            {
                              $regexMatch: {
                                input: "$$reply.message",
                                regex: req.query.search,
                              },
                            },
                          ]
                        : []),
                    ],
                  },
                },
              },
              as: "reply",
              in: {
                _id: "$$reply._id",
                from: "$$reply.from",
                message: "$$reply.message",
                createdAt: "$$reply.createdAt",
                hasPic: {
                  $cond: {
                    if: { $ifNull: ["$$reply.pic", false] },
                    then: true,
                    else: false,
                  },
                },
                hasDoc: {
                  $cond: {
                    if: { $ifNull: ["$$reply.doc", false] },
                    then: true,
                    else: false,
                  },
                },
              },
            },
          },
        },
      },
    ]).limit(1);

    if (!receiverUser) {
      throw new Error("Replies for this user not found.");
    }

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

    const isWaitingForAdminResponse =
      user.role === "user" && receiverUser.receiverUserAnswer === "accepted";

    if (isWaitingForAdminResponse) {
      replyStatus.value = false;
      replyStatus.reason = "wait-for-admin-response";
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
    const {
      title,
      desc,
      segmentName,
      pic,
      doc,
      price,
      count,
      producer,
      deliveryDate,
      deliveryPlace,
      from,
      receiverUsersIds,
    } = req.body;

    const user = req.user;

    const users = await User.find({
      _id: { $in: receiverUsersIds },
      role: "user",
    }).select("_id");

    const inquiry = new Inquiry(
      Object.assign(
        {
          title,
          desc,
          segmentName,
          price,
          count,
          producer,
          deliveryDate,
          deliveryPlace,
          from,
          sender: user,
          receiverUsers: users.map((user) => ({
            user: user._id,
          })),
        },
        !!pic ? { pic } : undefined,
        !!doc ? { doc } : undefined
      )
    );

    if (receiverUsersIds.includes(user._id)) {
      throw new Error("You can't enquiry to yourself.");
    }

    await inquiry.save();

    res
      .status(StatusCodes.CREATED)
      .send("Inquiry added and sent successfully.");
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};

/** @type {import("express").RequestHandler} */
exports.answerInquiry = async function (req, res) {
  try {
    const { replyMessage, pic, doc, answer } = req.body;

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
      user.role === "user" &&
      receiverUser.receiverUserAnswer === "accepted"
    ) {
      throw new Error(
        "This conversation is closed for you. Wait for admin's final response."
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
      receiverUser.replies.push(
        Object.assign(
          {
            from: user._id,
            message: replyMessage,
          },
          !!pic ? { pic } : undefined,
          !!doc ? { doc } : undefined
        )
      );
    }

    await inquiry.save();

    res.status(StatusCodes.OK).send("Submitted answer successfully.");
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};
