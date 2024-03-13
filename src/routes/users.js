const { usersOptions } = require("../controllers/users");

const { authByRoles } = require("../middlewares/auth");
const { applyClientFilter } = require("../middlewares/basic");

const router = require("express").Router();

router
  .route("/options")
  .get(
    authByRoles("admin"),
    applyClientFilter("firstName", "lastName", "username"),
    usersOptions
  );

module.exports = router;
