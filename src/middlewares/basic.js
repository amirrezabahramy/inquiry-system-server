const { decodeToken } = require("../services/auth");

/** @type {import("express").RequestHandler} */
exports.setUser = function (req, res, next) {
  const token = req.headers["authorization"].split(" ")[1];
  const user = decodeToken(token);
  req.user = user;
  next();
};

exports.applyClientFilter = function (...keys) {
  /** @type {import("express").RequestHandler} */
  return function (req, res, next) {
    const { search } = req.query;

    const clientFilter = search
      ? {
          $or: keys.map((field) => ({
            [field]: {
              $regex: search,
              $options: "i",
            },
          })),
        }
      : {};

    req.clientFilter = clientFilter;
    next();
  };
};
