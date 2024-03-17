const { StatusCodes } = require("http-status-codes");
const { decodeToken } = require("../services/auth");

const Inquiry = require("../models/Inquiry");

/** @type {import('express').RequestHandler} */
exports.canViewInquiry = async function (req, res, next) {
  try {
    const token = req.headers["authorization"].split(" ")[1];
    const user = decodeToken(token);

    const inquiry = await Inquiry.findById(req.params.inquiryId);

    if (!inquiry) {
      return res.status(StatusCodes.BAD_REQUEST).send("Inquiry not found.");
    }

    if (user._id !== inquiry.sender._id.toString()) {
      throw new Error(
        "You can't access this inquiry's routes and subroutes because it doesn't belong to you."
      );
    }
    next();
  } catch (error) {
    res.status(StatusCodes.FORBIDDEN).send(error.message);
  }
};
