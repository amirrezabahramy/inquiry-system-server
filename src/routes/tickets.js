const {
  getTickets,
  getTicketReceiverUsers,
  getTicketReceiverReplies,
  createAndBroadcastTicket,
  answerTicket,
} = require("../controllers/tickets");

const { authByRoles } = require("../middlewares/auth");

const router = require("express").Router();

router.route("/").get(authByRoles("admin"), getTickets);
router.route("/:ticketId/receiverUsers").get(getTicketReceiverUsers);
router
  .route("/:ticketId/answer")
  .patch(authByRoles("admin", "user"), answerTicket);
router
  .route("/:ticketId/receiverUsers/:receiverUserId/replies")
  .get(getTicketReceiverReplies);
router
  .route("/create-and-broadcast")
  .post(authByRoles("admin"), createAndBroadcastTicket);

module.exports = router;
