const User = require("../models/User");

/** @type {import("express").RequestHandler} */
exports.addUser = async function (req, res) {
  try {
    const { firstName, lastName, email, username, password, role } = req.body;

    const user = new User({
      firstName,
      lastName,
      email,
      username,
      password,
      role,
    });

    await user.save();

    res.status(StatusCodes.CREATED).send(user);
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).send(error.message);
  }
};
