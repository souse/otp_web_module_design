var express = require('express');
var router = express.Router();
var base = require("./base");
var logger = require("../helpers/log");

router.post("/sendOtp", function(req, res) {
    logger.debug("send OTP....");
    base.apiOkOutput(res, "ok");
});

module.exports = router;
