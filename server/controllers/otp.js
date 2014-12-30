var express = require('express');
var router = express.Router();
var base = require("./base");
var logger = require("../helpers/log");

var _token = "";
var seed = 1;

// https://www.getpostman.com/collections/e046a1b04f83fb24b8e8
// generate new captcha code the same as refresh captcha code.
router.post("/generateCaptcha", function(req, res) {
    logger.debug("generateCaptcha....");
    var reqBody = req.body;
    base.apiOkOutput(res, {
        code: "000000",
        message: "生成成功!",
        captchaId: "zxcvbnm",
        captchaUrl: "https://cashier.1qianbao.com/gtproxy/captchacode/code/9/3f5d1468-06f9-46c4-bf03-c1d7ef5038bd"
    });
});
// refresh captcha code.
router.post("/refreshCaptcha", function(req, res) {
    logger.debug("refreshCaptcha....");
    var reqBody = req.body;
    base.apiOkOutput(res, {
        code: "000000",
        message: "生成成功!",
        captchaId: "zxcvbnm",
        captchaUrl: "https://cashier.1qianbao.com/gtproxy/captchacode/code/9/3f5d1468-06f9-46c4-bf03-c1d7ef5038bd"
    });
});
// validate captcha input return token.
// {captchaId:"",captchaInput:""}
router.post("/verifyCaptcha", function(req, res) {
    logger.debug("verifyCaptcha....");
    var reqBody = req.body;
    var captchaId = reqBody.captchaId;
    var captchaInput = reqBody.captchaInput;
    var result = {
        code: '000000',
        message: '验证成功'
    };
    if (captchaId == "abcdefg") {
        result = "captcha_validated_token";
    } else {
        result.message = "图片验证码错误！";
        result.code = "GOUTONG_CAPTCHA_CAPTCHAVALUE_ERROR";
    }
    base.apiOkOutput(res, result);
});

// sample to sms login.
router.post("/sendSMSLogin", function(req, res) {
    logger.debug("sendSMSLogin....");
    var reqBody = req.body;
    // user mobile.
    var mobile = reqBody.mobile;
    // optional parameter:  csrfTokenV2.
    var token = reqBody.captchaToken;
    // optional parameter:  device id
    var deviceId = reqBody.deviceId;

    var result = {
        code: "000000",
        message: "发送短信成功！"
    };
    if (mobile == "13764826689") {
        result.retrySeconds = 60;
        result.maskedMobile = "137**826689";
    } else {
        result.code = "GOUTONG_CAPTCHA_NEED_CAPTCHA";
        result.message = "请求验证图片验证码！";
        result.captchaId = "zxcvbnm";
        result.captchaUrl = "https://cashier.1qianbao.com/gtproxy/captchacode/code/9/3f5d1468-06f9-46c4-bf03-c1d7ef5038bd";
    }
    base.apiOkOutput(res, result);
});



module.exports = router;
