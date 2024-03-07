const bcrypt = require("bcrypt");

exports.hash = async function (value) {
  try {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(value, salt);
    return hash;
  } catch (error) {
    return error;
  }
};
