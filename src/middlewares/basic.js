const { decodeToken } = require("../services/auth");

/** @type {import("express").RequestHandler} */
exports.setUser = function (req, res, next) {
  const token = req.headers["authorization"].split(" ")[1];
  const user = decodeToken(token);
  req.user = user;
  next();
};
