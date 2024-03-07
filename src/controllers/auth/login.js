const { StatusCodes } = require("http-status-codes");
const bcrypt = require("bcrypt");

const User = require("../../models/User");
const { generateAccessToken } = require("../../services/auth");

/** @type {import("express").RequestHandler} */
exports.login = async function (req, res) {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error("Username or password is incorrect.");
    }

    const accessToken = generateAccessToken(user.toObject());

    res.status(StatusCodes.OK).send({ accessToken });
  } catch (error) {
    res.status(StatusCodes.UNAUTHORIZED).send(error.message);
  }
};
