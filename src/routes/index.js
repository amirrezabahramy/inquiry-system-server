const router = require("express").Router();

router.use("/auth", require("./auth"));
router.use("/inquiries", require("./inquiries"));
router.use("/users", require("./users"));
router.use("/download", require("./download"));
router.use("/critical", require("./critical"));

module.exports = router;
