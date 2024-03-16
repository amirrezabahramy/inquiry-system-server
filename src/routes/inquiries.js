const {
  getInquiries,
  getInquiryReceiverUsers,
  getInquiryReceiverUserReplies,
  enquiry,
  answerInquiry,
} = require("../controllers/inquiries");

const { authByRoles } = require("../middlewares/auth");
const { setUser, applyClientFilter } = require("../middlewares/basic");

const router = require("express").Router();

router
  .route("/")
  .get(
    authByRoles("admin", "user"),
    setUser,
    applyClientFilter(
      "title",
      "desc",
      "segmentName",
      "price",
      "count",
      "deliveryPlace"
    ),
    getInquiries
  );

router
  .route("/:inquiryId/receiver-users")
  .get(
    authByRoles("admin"),
    applyClientFilter(
      "receiverUsers.user.firstName",
      "receiverUsers.user.lastName",
      "receiverUsers.user.username"
    ),
    getInquiryReceiverUsers
  );

router
  .route("/:inquiryId/receiver-users/:receiverUserId/replies")
  .get(authByRoles("admin"), setUser, getInquiryReceiverUserReplies);

router
  .route("/:inquiryId/replies")
  .get(authByRoles("user"), setUser, getInquiryReceiverUserReplies);

router.route("/enquiry").post(authByRoles("admin"), setUser, enquiry);

router
  .route("/:inquiryId/answer")
  .patch(authByRoles("admin", "user"), setUser, answerInquiry);

module.exports = router;
