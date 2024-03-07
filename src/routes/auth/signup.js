const router = require("express").Router();

const { signup } = require("../../controllers/auth/signup");

router.route("/").post(signup);

module.exports = router;
