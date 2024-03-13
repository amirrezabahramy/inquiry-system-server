const { StatusCodes } = require("http-status-codes");

const { limit: defaultLimit } = require("../utils/defaults");
const User = require("../models/User");

/** @type {import("express").RequestHandler} */
exports.usersOptions = async function (req, res) {
  try {
    const clientFilter = req.clientFilter;

    const users = await User.find({ ...clientFilter, role: "user" })
      .limit(defaultLimit)
      .select("firstName lastName");

    res.send(users);
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};
