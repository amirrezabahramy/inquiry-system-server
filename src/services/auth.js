const jwt = require("jsonwebtoken");

require("dotenv").config();

exports.generateAccessToken = function (obj) {
  return jwt.sign(obj, process.env.APP_TOKEN_SECRET, { expiresIn: "1h" });
};
