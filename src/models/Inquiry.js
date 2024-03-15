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
    receiverUsers: {
      type: [
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
          contractStatus: {
            type: String,
            enum: ["successful", "unsuccessful", "in-progress"],
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
      validate: function (value) {
        return Array.isArray(value) && value.length > 0;
      },
    },
  },
  { timestamps: true }
);

schema.pre("save", function (next) {
  this.receiverUsers.forEach((receiverUser) => {
    if (this.isModified("receiverUsers") || receiverUser.isModified()) {
      if (receiverUser.senderAnswer === "accepted") {
        receiverUser.contractStatus = "successful";
      } else if (
        receiverUser.senderAnswer === "rejected" ||
        receiverUser.receiverUserAnswer === "rejected"
      ) {
        receiverUser.contractStatus = "unsuccessful";
      } else {
        receiverUser.contractStatus = "in-progress";
      }
    }
  });

  next();
});

schema.pre("findOneAndUpdate", function (next) {
  this.setOptions({ runValidators: true, new: true });
  next();
});

const model = mongoose.model("Inquiry", schema);

module.exports = model;
