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
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    receiverUsers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "User",
        },
        receiverUserAnswer: {
          type: String,
          default: "not-answered",
          required: true,
          enum: [
            "accepted",
            "rejected",
            "additional-info-required",
            "not-answered",
          ],
        },
        senderAnswer: {
          type: String,
          required: true,
          default: "offer-in-progress",
          enum: ["accepted", "rejected", "offer-in-progress"],
        },
        replies: [
          {
            from: {
              type: mongoose.Schema.Types.ObjectId,
              required: true,
              ref: "User",
            },
            message: {
              type: String,
            },
            createdAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

schema.pre("findOneAndUpdate", function (next) {
  this.setOptions({ runValidators: true, new: true });
  next();
});

const model = mongoose.model("Ticket", schema);

module.exports = model;
