const jwt = require("jsonwebtoken");

require("dotenv").config();

exports.generateAccessToken = function (object) {
  return jwt.sign(object, process.env.APP_TOKEN_SECRET_KEY, {
    expiresIn: "1h",
  });
};

exports.verifyToken = function (token, callback) {
  return jwt.verify(token, process.env.APP_TOKEN_SECRET_KEY, callback);
};
