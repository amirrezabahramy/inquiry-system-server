const { StatusCodes } = require("http-status-codes");
const User = require("../../models/User");

/** @type {import("express").RequestHandler} */
exports.signup = async function (req, res) {
  try {
    const { firstName, lastName, email, username, password } = req.body;

    const user = new User({
      firstName,
      lastName,
      email,
      username,
      password,
      role: "user",
    });

    await user.save();

    res.status(StatusCodes.OK).send(user);
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};
