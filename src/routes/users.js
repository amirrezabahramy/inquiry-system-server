const { usersOptions } = require("../controllers/users");

const { authByRoles } = require("../middlewares/auth");

const router = require("express").Router();

router.route("/options").get(authByRoles("admin"), usersOptions);

module.exports = router;
