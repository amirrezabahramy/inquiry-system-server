const router = require("express").Router();

router.route("/").get((req, res) => {
  res.send("Index route.");
});

module.exports = router;
