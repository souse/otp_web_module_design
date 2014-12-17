var express = require('express');
var router = express.Router();
var base = require("./base");
var logger = require("../helpers/log");

var _token = "";
var seed = 1;
router.post("/sendOtp", function(req, res) {
    logger.debug("send OTP....");
    var reqBody = req.body;
    var mobile = reqBody.mobile;
    if (mobile == "13764826689") {
        seed++;
        base.apiOkOutput(res, {
            code: "000001",
            captcha: {
                id: "zxcvbnm",
                imgUrl: "https://cashier.1qianbao.com/gtproxy/captchacode/code/9/3f5d1468-06f9-46c4-bf03-c1d7ef5038bd"
            }
        });
    } else {
        base.apiOkOutput(res, 60);
    }
});
router.post("/trySendOTPWithToken", function(req, res) {
    logger.debug("trySendOTPWithToken....");
    var reqBody = req.body;
    var mobile = reqBody.mobile;
    var token = reqBody.token;
    if (token == _token) {
        _token = "";
        base.apiOkOutput(res, {
            message: "验证成功"
        });
    } else {
        base.apiOkOutput(res, {
            code: "000001",
            captcha: {
                id: "zxcvbnm",
                imgUrl: "https://cashier.1qianbao.com/gtproxy/captchacode/code/9/3f5d1468-06f9-46c4-bf03-c1d7ef5038bd"
            },
            message: "TOKEN验证失败,请刷新验证码重试！"
        });
    }
});


router.post("/validateCaptcha", function(req, res) {
    logger.debug("validateCaptcha....");
    var reqBody = req.body;
    var captchaId = reqBody.captchaId;
    var captchaInput = reqBody.captchaInput;
    if (captchaInput == 1234) {
        _token = captchaId + "_" + captchaInput + seed;
        base.apiOkOutput(res, {
            code: "000000",
            message: "TOKEN 生成成功！",
            token: _token
        });

    } else {
        _token = "";
        base.apiOkOutput(res, {
            code: "000002",
            message: "验证码输入错误"
        });
    }

});

module.exports = router;
