const router = require("express").Router();

const { login } = require("../../controllers/auth/login");

router.route("/").post(login);

module.exports = router;
