const { addUser } = require("../controllers/critical");

const { authByRoles } = require("../middlewares/auth");

const router = require("express").Router();

router.route("/add-user").post(authByRoles("super-admin"), addUser);

module.exports = router;
