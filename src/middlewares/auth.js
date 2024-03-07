const { StatusCodes } = require("http-status-codes");
const { verifyToken } = require("../services/auth");

exports.authByRoles = function (...roles) {
  /** @type {import("express").RequestHandler} */
  return function (req, res, next) {
    const token = req.headers["authorization"]?.split(" ")[1] || "";

    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).send("Token not found.");
    }

    verifyToken(token, function (error, object) {
      if (error) {
        return res.status(StatusCodes.UNAUTHORIZED).send("Token is invalid.");
      }

      if (!roles.includes(object.role)) {
        return res
          .status(StatusCodes.FORBIDDEN)
          .send("You are not allowed to access this route.");
      }

      next();
    });
  };
};
