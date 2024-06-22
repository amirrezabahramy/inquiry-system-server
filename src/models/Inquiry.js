const mongoose = require("mongoose");
const { validateBase64File } = require("../utils/helpers");
const {
  acceptedPicFormats,
  acceptedDocFormats,
} = require("../utils/constants");

const replySchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  message: {
    type: String,
    required: true,
  },
  pic: {
    type: String,
    validate: {
      validator: validateBase64File(acceptedPicFormats),
      message: "Pic is invalid.",
    },
  },
  doc: {
    type: String,
    validate: {
      validator: validateBase64File(acceptedDocFormats),
      message: "Doc is invalid.",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

// Receiver user schema
const receiverUserSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  receiverUserAnswer: {
    type: String,
    default: "not-answered",
    required: true,
    enum: ["accepted", "rejected", "additional-info-required", "not-answered"],
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
  replies: [replySchema],
});

// Main schema
const schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      minLength: 4,
    },
    desc: {
      type: String,
      required: true,
      minLength: 10,
    },
    segmentName: {
      type: String,
      required: true,
      unique: true,
    },
    // File
    pic: {
      type: String,
      validate: {
        validator: validateBase64File(acceptedPicFormats),
        message: "Pic is invalid.",
      },
    },
    doc: {
      type: String,
      validate: {
        validator: validateBase64File(acceptedDocFormats),
        message: "Doc is invalid.",
      },
    },
    // End of file
    price: {
      type: Number,
      required: true,
    },
    count: {
      type: Number,
      required: true,
    },
    producer: {
      type: String,
      required: true,
    },
    deliveryDate: {
      type: Date,
      required: true,
    },
    deliveryPlace: {
      type: String,
      required: true,
    },
    uniqueId: {
      type: String,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    receiverUsers: {
      type: [receiverUserSchema],
      validate: function (value) {
        return Array.isArray(value) && value.length > 0;
      },
    },
  },
  { timestamps: true }
);

schema.pre("save", function (next) {
  if (this.isModified("segmentName") || this.isModified("count")) {
    const uniqueId = this.segmentName + "-" + this.count;
    this.uniqueId = uniqueId;
  }

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
