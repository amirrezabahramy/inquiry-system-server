const mongoose = require("mongoose");

const { hash } = require("../services/hash");

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
    },
    role: {
      type: String,
      enum: ["admin", "user"],
    },
  },
  { timestamps: true }
);

schema.pre("save", async function (next) {
  if (this.isModified("password")) {
    if (this.password.length < 8 || this.password.length > 32) {
      throw new Error(
        "Password must be a string with maximum 8 and minimum 32 characters."
      );
    }
    this.password = await hash(this.password);
  }
  next();
});

const model = mongoose.model("User", schema);

module.exports = model;
