const { decodeToken } = require("../services/auth");

const { APP_PORT, APP_HOSTNAME } = process.env;

/** @type {import("express").RequestHandler} */
exports.logger = function (req, res, next) {
  console.log(
    `FROM LOGGER - Url: ${req.protocol}://${require("path").join(
      `${APP_HOSTNAME}:${APP_PORT}`,
      req.url
    )}, Method: ${req.method}, At: ${new Date().toLocaleString(
      "fa-IR-u-nu-latn"
    )}`
  );
  next();
};

/** @type {import("express").RequestHandler} */
exports.setUser = function (req, res, next) {
  const token = req.headers["Authorization"].split(" ")[1];
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
