const router = require("express").Router();

router.route("/").get((req, res) => {
  res.send("Index route.");
});

router.use("/auth", require("./auth"));

module.exports = router;
