const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address.",
      ],
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      minLength: 4,
    },
    password: {
      type: String,
      required: true,
      minLength: 8,
      maxLength: 32,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
    },
  },
  { timestamps: true }
);

const model = mongoose.model("User", schema);

module.exports = model;
