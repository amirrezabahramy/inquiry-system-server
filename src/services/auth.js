const jwt = require("jsonwebtoken");

// Dotenv config
require("dotenv").config({
  path: require("node:path").join(__dirname, `./.env.${process.env.NODE_ENV}`),
});

exports.generateAccessToken = function (object) {
  return jwt.sign(object, process.env.APP_TOKEN_SECRET_KEY, {
    expiresIn: "1h",
  });
};

exports.verifyToken = function (token, callback) {
  return jwt.verify(token, process.env.APP_TOKEN_SECRET_KEY, callback);
};

exports.decodeToken = function (token) {
  return jwt.decode(token);
};
