const {
  getTicketsList,
  getTicketReceiverUsers,
  getTicketReceiverReplies,
  createAndBroadcastTicket,
  answerTicket,
} = require("../controllers/tickets");

const { authByRoles } = require("../middlewares/auth");

const router = require("express").Router();

router.route("/list").get(authByRoles("admin"), getTicketsList);
router.route("/:ticketId/receiver-users").get(getTicketReceiverUsers);
router
  .route("/:ticketId/answer")
  .patch(authByRoles("admin", "user"), answerTicket);
router
  .route("/:ticketId/receiver-users/:receiverUserId/replies")
  .get(getTicketReceiverReplies);
router
  .route("/create-and-broadcast")
  .post(authByRoles("admin"), createAndBroadcastTicket);

module.exports = router;
