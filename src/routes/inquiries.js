const {
  getInquiries,
  getInquiryReceiverUsers,
  getInquiryReceiverUserReplies,
  enquiry,
  answerInquiry,
} = require("../controllers/inquiries");

const { authByRoles } = require("../middlewares/auth");
const { setUser, applyClientFilter } = require("../middlewares/basic");
const { canViewInquiry } = require("../middlewares/permissions");

const router = require("express").Router();

router
  .route("/")
  .get(
    authByRoles("admin", "user"),
    setUser,
    applyClientFilter("title", "desc", "segmentName", "deliveryPlace"),
    getInquiries
  );

router
  .route("/:inquiryId/receiver-users")
  .get(authByRoles("admin"), canViewInquiry, getInquiryReceiverUsers);

router
  .route("/:inquiryId/receiver-users/:receiverUserId/replies")
  .get(
    authByRoles("admin"),
    canViewInquiry,
    setUser,
    getInquiryReceiverUserReplies
  );

router
  .route("/:inquiryId/replies")
  .get(authByRoles("user"), setUser, getInquiryReceiverUserReplies);

router.route("/enquiry").post(authByRoles("admin"), setUser, enquiry);

router
  .route("/:inquiryId/answer")
  .patch(authByRoles("admin", "user"), setUser, answerInquiry);

module.exports = router;
