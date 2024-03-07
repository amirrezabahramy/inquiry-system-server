const { StatusCodes } = require("http-status-codes");
const User = require("../../models/User");

const { hash: hashService } = require("../../services/hash");

/** @type {import("express").RequestHandler} */
exports.signup = async function (req, res) {
  try {
    const { firstName, lastName, email, username, password } = req.body;

    const user = new User({
      firstName,
      lastName,
      email,
      username,
      password: await hashService(password),
      role: "user",
    });

    await user.save();

    res.status(StatusCodes.OK).send(user);
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};
