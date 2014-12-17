var express = require('express');
var router = express.Router();
var base = require("./base");
var logger = require("../helpers/log");

router.post("/sendOtp", function(req, res) {
    logger.debug("send OTP....");
    var reqBody = req.body;
    var mobile = reqBody.mobile;
    if (mobile == "13764826689") {
        base.apiOkOutput(res, {
            code: "000001",
            captcha: {
                id: "zxcvbnm",
                imgUrl: "https://cashier.1qianbao.com/gtproxy/captchacode/code/9/3f5d1468-06f9-46c4-bf03-c1d7ef5038bd"
            }
        });
    } else {
        base.apiOkOutput(res, 80);
    }
});

module.exports = router;
