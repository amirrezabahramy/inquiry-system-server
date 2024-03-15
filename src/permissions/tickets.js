const { StatusCodes } = require("http-status-codes");
const { decodeToken } = require("../services/auth");

/** @type {import('express').RequestHandler} */
exports.canViewReply = function (req, res, next) {
  const token = req.headers["authorization"].split(" ")[1];
  const user = decodeToken(token);

  if (user._id !== req.params.replyId) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .send("You cannot view other users replies.");
  }
  next();
};
