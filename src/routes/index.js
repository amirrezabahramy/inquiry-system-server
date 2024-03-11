const router = require("express").Router();

router.use("/auth", require("./auth"));
router.use("/tickets", require("./tickets"));
router.use("/users", require("./users"));

module.exports = router;
