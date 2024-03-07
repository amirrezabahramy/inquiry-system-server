const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: [
        "accepted",
        "rejected",
        "additional-info-required",
        "not-answered",
      ],
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

const model = mongoose.model("Ticket", schema);

module.exports = model;
