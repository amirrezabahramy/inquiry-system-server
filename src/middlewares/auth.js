const { StatusCodes } = require("http-status-codes");
const { verifyToken } = require("../services/auth");

/** @type {import("express").RequestHandler} */
exports.authByRoles = function (...roles) {
  return function (req, res, next) {
    const token = req.headers["Authorization"]?.split(" ")[1] || "";

    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).send("Token not found.");
    }

    verifyToken(token, function (error, user) {
      if (error) {
        return res.status(StatusCodes.UNAUTHORIZED).send("Token is invalid.");
      }

      if (!roles.includes(user.role)) {
        return res
          .status(StatusCodes.FORBIDDEN)
          .send("You are not allowed to access this route.");
      }

      next();
    });
  };
};
