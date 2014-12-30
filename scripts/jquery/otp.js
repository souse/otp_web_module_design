(function($) {


    // default configurations for otp web module plugin based on jquery,zepto.js
    // we can also attach this plugin into require.js, seajs.
    var defaultCfg = {
        autoSendOtp: false,
        dataCaptchaId: "captchaId", //$.data("captchaId",111)
        otpGetSelector: ".trigger-get-otp", //·免费获取·按钮选择器
        otpInputSelector: ".otp-input",
        ticker: ".ticker",
        mobileInputSelector: ".mobile", //手机号码的输入框
        captchaContainerSelector: ".captcha-container",
        captchaImageSelector: ".captcha-img",
        captchaInputSelector: ".captcha-input"
    };

    $.fn.otp = function(cfg) {
        var options = $.extend({}, defaultCfg, cfg);

        function bindingEvents($this, otpImgSuite) {
            $this.find(options.otpGetSelector).on("click", function() {
                // find mobile input value.
                var mobile = $this.find(options.mobileInputSelector).val();
                // if no capcha, directly send otp.
                var token = $this.find(options.otpInputSelector).data("token");
                otpImgSuite.trySendOTP(mobile, token);
            });
            $this.find(options.captchaInputSelector).on("input", function() {
                var captchaInput = $(this).val();
                var captchaId = $this.find(options.captchaContainerSelector).data(options.dataCaptchaId);
                if (captchaInput.length == 4) {
                    otpImgSuite.verifyCaptcha({
                        captchaId: captchaId,
                        captchaInput: captchaInput
                    });
                } else {
                    $this.find(options.otpGetSelector).prop("disabled", true);
                }
            });
            $this.find(options.captchaImageSelector).on("click", function() {
                // refresh image code.
                otpImgSuite.refreshCaptcha();
            });
        };

        function bindingOtpModule($this, otpImgSuite) {
            // subscribe OTPSending event.
            otpImgSuite.addHandler("OTPSending", function(event) {
                console.log("received OTPSending message: ", event);

            });

            function refreshCaptchaUI(captcha) {
                var $captchaContainer = $this.find(options.captchaContainerSelector);
                $captchaContainer.removeClass("hide").addClass("show");
                $captchaContainer.data(options.dataCaptchaId, captcha.captchaId);
                $this.find(options.captchaImageSelector).attr("src", captcha.captchaUrl);
                $this.find(options.otpGetSelector).prop("disabled", true);
            };
            // capture captchaShow event
            otpImgSuite.addHandler("captchaShow", function(event) {
                console.log("received captchaShow message: ", event);
                var captcha = event.data;
                refreshCaptchaUI(captcha);
            });
            //图片验证码生成TOKEN 成功
            otpImgSuite.addHandler("tokenFlushed", function(event) {
                console.log("tokenFlushed", event.data);
                var token = event.data.captchaToken;
                $this.find(options.otpInputSelector).data("token", token);
                $this.find(options.otpGetSelector).prop("disabled", false);
                if (options.autoSendOtp) {
                    $this.find(options.otpGetSelector).trigger("click");
                }
            });

            otpImgSuite.addHandler("tokenFlushedFailed", function(event) {
                console.log("tokenFlushedFailed", event.data);
                console.log(event.data);

            });
            // captcha refreshed.
            otpImgSuite.addHandler("captchaRefreshed", function(event) {
                console.log("captchaRefreshed", event.data);
                var captcha = event.data;
                refreshCaptchaUI(captcha);
            });
            otpImgSuite.addHandler("captchaRefreshedFailed", function(event) {
                console.log("captchaRefreshedFailed", event.data);
                console.log(event.data);
            });

            //OTP 短信发送成功,会自动启动计时器，disable 手机号输入框
            otpImgSuite.addHandler("OTPSentSuccess", function(event) {
                $this.find(options.mobileInputSelector).addClass("disabled").prop("disabled", true);
            });


            // capture showTicker event
            otpImgSuite.addHandler("showTicker", function(event) {
                console.log("received showTicker message: ", event);
                $this.find(options.ticker).addClass("show").removeClass("hide").text(event.data + " s");
                $this.find(options.otpGetSelector).addClass("hide").removeClass("show");
            });

            otpImgSuite.addHandler("closeTicker", function(event) {
                $this.find(options.ticker).addClass("hide").removeClass("show").text("");
                $this.find(options.otpGetSelector).addClass("show").removeClass("hide");
                $this.find(options.mobileInputSelector).removeClass("disabled").prop("disabled", false);

            });

            // capture all errors
            otpImgSuite.addHandler("error", function(event) {
                console.log("received error message: ", event);

            });

        };

        return this.each(function() {
            var $this = $(this);

            var otpImgSuite = new OtpImageSuite(OtpAPI, {});

            // subscribe interesting OTP module events.
            bindingOtpModule($this, otpImgSuite);

            // hook ui events.
            bindingEvents($this, otpImgSuite);

        });
    };

})(jQuery);
