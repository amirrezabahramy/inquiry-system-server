const express = require("express");
const { authByRoles } = require("../middlewares/auth");
const { setUser } = require("../middlewares/basic");
const {
  downloadInquiryFile,
  downloadReplyFile,
} = require("../controllers/download");

const router = express.Router();

router
  .route("/inquiries/:inquiryId")
  .get(authByRoles("admin", "user"), setUser, downloadInquiryFile);
router
  .route("/replies/:replyId")
  .get(authByRoles("admin", "user"), setUser, downloadReplyFile);

module.exports = router;
