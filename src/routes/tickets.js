const {
  getTicketsList,
  getTicketReceiverUsers,
  getTicketReceiverUserReplies,
  createAndBroadcastTicket,
  answerTicket,
} = require("../controllers/tickets");

const { authByRoles } = require("../middlewares/auth");
const { setUser } = require("../middlewares/basic");

const router = require("express").Router();

router
  .route("/list")
  .get(authByRoles("admin", "user"), setUser, getTicketsList);

router
  .route("/:ticketId/receiver-users")
  .get(authByRoles("admin"), getTicketReceiverUsers);

router
  .route("/:ticketId/receiver-users/:receiverUserId/replies")
  .get(authByRoles("admin"), setUser, getTicketReceiverUserReplies);

router
  .route("/:ticketId/replies")
  .get(authByRoles("user"), setUser, getTicketReceiverUserReplies);

router
  .route("/create-and-broadcast")
  .post(authByRoles("admin"), setUser, createAndBroadcastTicket);

router
  .route("/:ticketId/answer")
  .patch(authByRoles("admin", "user"), setUser, answerTicket);

module.exports = router;
