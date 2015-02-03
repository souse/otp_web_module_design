var $ = require("jquery");
var OtpImageSuite = require("./OtpImageSuite");
// export otp sample service to client, allow us extend it to suit for customized bisuness.
var otpService = require("./otpAPI");

var defaultCfg = {
    // The value indicates if we need to auto send otp message while captcha varify success!
    autoSendOtp: false,
    // default show captcha
    firstShowCaptcha: false,
    // ticket second formatter.
    leftSecondFormatter: "{0}s",
    // data-* save captchaId come from server side.
    // $.data("captchaId","otp_id_get_from_server")
    dataCaptchaId: "captchaId",
    // $.data("captchaToken","save_validated_captcha_token")
    dataCaptchaToken: "captchaToken",
    // $("手机号输入框")
    mobileInputSelector: ".mobile-input-selector",
    //$("图片验证码控件外层")
    captchaControlSelector: "captcha-control-selector",
    // $("图片验证码输入框")
    captchaInputSelector: ".captcha-input-selector",
    // $("图片Img对象")
    captchaImageSelector: ".captcha-image-selector",
    // $("发送按钮")
    otpGetSelector: ".otp-get-btn-selector",
    // $("短信验证码输入框")
    otpInputSelector: ".otp-input-selector",
    // $("计时器")
    otpTickerSelector: ".ticker-selector",

    // 默认事件侦听器
    eventListener: function(event) {

    },
    // 允许OTP 发送成功回调客户端指定的函数
    otpHasPassedCallback: function(result) {

    },
    // 允许OTP 发送失败回调客户端指定的函数(code, message)
    otpErrorsCallback: function(event) {

    },
    // 允许我们动态按需从客户端拿自定义的数据，针对不同的OTP 业务需求
    getExtraData: function() {
        return null;
    }
};

var otp = function(context, otpService, options) {
    context = $(context);
    if (!context || !context.length) {
        throw new Error("the context parameter required!");
        return;
    }

    // config, status initialize.
    var cfg = $.extend({}, defaultCfg, options),
        running = false,
        eventListener = cfg.eventListener;

    // cache ui components.
    var $mobileInput = context.find(cfg.mobileInputSelector),
        $captchaControl = context.find(cfg.captchaControlSelector),
        $captchaInput = context.find(cfg.captchaInputSelector),
        $captchaImage = context.find(cfg.captchaImageSelector),
        $otpGet = context.find(cfg.otpGetSelector),
        $otpInput = context.find(cfg.otpInputSelector),
        $otpTicker = context.find(cfg.otpTickerSelector);

    var suiteServiceCfg = {
        trySendOTPServiceName: cfg.trySendOtpServiceName,
        ignoreMobileValidation: cfg.ignoreMobileValidation
    };
    //The otp core.
    var otpImgSuite = new OtpImageSuite(otpService, suiteServiceCfg);

    //
    // helper methods for handling OtpSuiteModule.
    // ---------------------------------------------------

    // otp sending pre handler.
    function OTPSendingHandler(event) {
        // do nothing... may be we can show loading spinner here.
    };
    // otp sent success handler.
    function OTPSentSuccessHandler(data) {
        // don't hide captcha 控件. we can do this in client. by cfg.otpHasPassedCallback().
        // $captchaControl.css("display", "none");
        setMobileCaptchaDisabledStatus(true);
        if (cfg.otpHasPassedCallback) {
            cfg.otpHasPassedCallback({
                data: data
            });
        }
    };

    // set captcha input, mobile input disabled status.
    function setMobileCaptchaDisabledStatus(disabled) {
        if (disabled) {
            $mobileInput.prop("disabled", true);
            $captchaInput.prop("disabled", true);
        } else {
            $mobileInput.prop("disabled", false);
            $captchaInput.prop("disabled", false);
        }
    };
    // update captcha token value.
    function setCaptchaToken(value) {
        context.data(cfg.dataCaptchaToken, value || null);
    };
    // get captcha token value.
    function getCaptchaToken() {
        return context.data(cfg.dataCaptchaToken);
    };

    function setCaptchaId(value) {
        context.data(cfg.dataCaptchaId, value || null);
    };
    // get captcha id.
    function getCaptchaId() {
        return context.data(cfg.dataCaptchaId);
    };
    // return client unique device id.
    function getDeviceId() {
        return "";
    };
    // OTP Error handler.
    function OTPErrorHandler(event) {
        var error = event.data;
        var code = error.code;
        var message = error.message;
        var otpErrorsCallback = cfg.otpErrorsCallback || function() {};
        switch (code) {
            case "mobile_invalid":
                // Now we do nothing, we need to handler these message in client consumer.
                otpErrorsCallback(code, message);
                break;
            case "captcha_refreshed_failed":
                otpErrorsCallback(code, message);
                break;
            case "token_flushed_failed":
                // captcha token flush failed, clear existed token.
                setCaptchaToken(null);
                otpErrorsCallback(code, message);
                break;
            default:
                // for other unhandled exceptions.
                otpErrorsCallback(code, message);
                break;
        }
    };
    // show ticker handler.
    function showTickerHandler(data) {
        running = true;
        $otpGet.css("display", "none");
        $otpTicker.css("display", "block");

        $otpTicker.html(cfg.leftSecondFormatter.replace(new RegExp('\\{0\\}', "g"), data));
    };

    // close ticker handler.
    function closeTickerHandler(data) {
        running = false;
        setMobileCaptchaDisabledStatus(false);
        $otpGet.css("display", "block");
        $otpTicker.css("display", "none");
        $otpTicker.html("");
    };

    // capcha show handler
    function showCaptchaHandler(data) {
        var captcha = data;
        // show captcha control.
        $captchaControl.css("display", "block");

        // refresh captch UI
        refreshCaptchaUI(captcha);
    };

    /**
     * While we re-input mobile number, we need to restore OTP Initialize states,
     * and make user has chance to send otp without captcha.
     */
    function restoreOTPInitState() {
        running = false;
        closeTickerHandler();
        // need to show captcha first time.
        if (cfg.firstShowCaptcha) {
            $captchaControl.css("display", "block");
        } else {
            $captchaControl.css("display", "none");
        }
    };
    // refresh captcha
    function refreshCaptchaUI(captcha) {
        // make sure that each url have not cache.
        $captchaImage.attr("src", captcha.captchaUrl ? captcha.captchaUrl + "?r=" + Math.random() : "");
        setCaptchaId(captcha.captchaId);
    };

    // flush token handler.
    function flushTokenHandler(data) {
        var token = data;
        setCaptchaToken(token);
        // $this.find(options.otpGetSelector).prop("disabled", false);
        if (cfg.autoSendOtp) {
            // try to resend otp request.
            trySendOtp();
        }
    };
    //
    // OTP 相关业务方法
    // ---------------------------------------------------

    // OtpImageSuite 发短信业务方法
    function trySendOtp() {
        var phone = $mobileInput.val();
        var token = getCaptchaToken();
        var deviceId = getDeviceId() || "";
        // 提供额外的数据注入到具体的OTP发短信业务
        var extraData = $.extend({}, cfg.getExtraData() || {});

        // try send OTP. need to clone new object, and pass into otpImageSuite. it is security.
        otpImgSuite.trySendOTP(phone, token, deviceId, extraData);
    };
    // OtpImageSuite 刷新图片验证码方法
    function refreshCaptcha() {
        // 
        otpImgSuite.refreshCaptcha();
    };
    // 注册UI DOM 事件处理器
    var hookEvents = function() {
        // 监听 发送短信按钮click 事件
        $otpGet.on("click", function(e) {
            trySendOtp();
        });
        // 监听 图片验证码输入框 change事件，发送CMMAND 去验证图片码
        $captchaInput.on("input", function(e) {
            var val = $.trim($(this).val());
            if (val && val.length >= 4) {
                otpImgSuite.verifyCaptcha({
                    captchaInput: val,
                    captchaId: getCaptchaId()
                });
            }
        });
        // 监听 图片随机码的刷新事件
        $captchaImage.on("click", function() {
            if (!running) {
                refreshCaptcha();
            }
        });
    };

    // 注册OtpImageSuite 模块事件
    var hookOtpSuiteModule = function() {
        otpImgSuite.addReceiver(function(event) {
            var type = event.type;
            var data = event.data;
            // always invoke event listener to passed components current states.
            if (cfg.eventListener) {
                cfg.eventListener(event);
            }
            switch (type) {
                case "OTPSending":
                    OTPSendingHandler(event);
                    break;
                case "OTPSentSuccess":
                    OTPSentSuccessHandler(data);
                    break;
                case "error":
                    OTPErrorHandler(event);
                    break;
                case "showTicker":
                    showTickerHandler(data);
                    break;
                case "closeTicker":
                    closeTickerHandler(data);
                    break;
                case "captchaShow":
                    showCaptchaHandler(data);
                    break;
                case "captchaRefreshed":
                    refreshCaptchaUI(data);
                    break;
                case "tokenFlushed":
                    flushTokenHandler(data);
                    break;
                default:
                    break;
            }
        });
    };

    (function init() {
        hookEvents();
        hookOtpSuiteModule();
        // if need to show captcha first time.
        if (cfg.firstShowCaptcha) {
            refreshCaptcha();
            $captchaControl.css("display", "block");
        }
    })();

    return {
        // start otp control
        start: function() {
            trySendOtp();
        },
        reset: function() {
            restoreOTPInitState();
        },
        refreshCaptcha: refreshCaptcha
    };
};
if (typeof module === "object" && module && typeof module.exports === "object") {
    module.exports = {
        otpService: otpService,
        otpModule: otp
    };
} else {
    if (typeof define === "function" && define.amd) {
        define("otp", [], function() {
            return {
                otpService: otpService,
                otpModule: otp
            };
        });
    }
}
