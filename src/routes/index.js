const router = require("express").Router();

router.use("/auth", require("./auth"));
router.use("/inquiries", require("./inquiries"));
router.use("/users", require("./users"));

module.exports = router;
