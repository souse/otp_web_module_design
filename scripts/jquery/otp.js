(function($) {


    // default configurations for otp web module plugin based on jquery,zepto.js
    // we can also attach this plugin into require.js, seajs.
    var defaultCfg = {
        autoSendOtp: false,
        dataCaptchaId: "captchaId", //$.data("captchaId",111)
        otpGetSelector: ".trigger-get-otp", //·免费获取·按钮选择器
        otpInputSelector: ".otp-input",
        otpUsingActionSelector: "#login", // while otp sent success, then pass otpInput,captchaToken
        ticker: ".ticker",
        mobileInputSelector: ".mobile", //手机号码的输入框
        captchaContainerSelector: ".captcha-container",
        captchaImageSelector: ".captcha-img",
        captchaInputSelector: ".captcha-input",
        errorHandler: null,
        successHandler: null
    };

    $.fn.otp = function(cfg) {
        var options = $.extend({}, defaultCfg, cfg);

        // varfify if is mobile.
        function isMobile(phone) {
            var phoneRegexp = /^1[3-9][0-9]\d{8}$/;
            return phoneRegexp.test(phone);
        };
        //
        //clear captcha data(token, add hide class.)
        function recoveryInitStatus($otpInput, $captchaContainer, $otpGetSelector) {
            $otpInput.data("token", null);
            $captchaContainer.removeClass("show").addClass("hide");

            $otpGetSelector.prop("disabled", false);
        };

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
                    // verify captcha using captchaId, capthcaInput.
                    // and get captchaToken if success.
                    otpImgSuite.verifyCaptcha({
                        captchaId: captchaId,
                        captchaInput: captchaInput
                    });
                } else {
                    $this.find(options.otpGetSelector).prop("disabled", true);
                }
            });
            var $otpInput = $this.find(options.otpInputSelector);
            var $mobileInput = $this.find(options.mobileInputSelector);
            var $otpUsingActionBtn = $this.find(options.otpUsingActionSelector);

            $otpInput.on("input", function() {
                if ($mobileInput.val() && $otpInput.val()) {
                    $otpUsingActionBtn.prop("disabled", false);
                } else {
                    $otpUsingActionBtn.prop("disabled", true);
                }
            });
            $mobileInput.on("input", function() {
                if ($mobileInput.val() && $otpInput.val()) {
                    $otpUsingActionBtn.prop("disabled", false);
                } else {
                    $otpUsingActionBtn.prop("disabled", true);
                }
                // if true, we need always.
                if (isMobile($mobileInput.val())) {

                    var $otpGrabButton = $this.find(options.otpGetSelector);
                    var $captchaContainer = $this.find(options.captchaContainerSelector);
                    recoveryInitStatus($otpInput, $captchaContainer, $otpGrabButton);
                }
            });
            $this.find(options.captchaImageSelector).on("click", function() {
                // refresh image code.
                otpImgSuite.refreshCaptcha();
            });
        };

        function init($this, otpImgSuite) {
            // disabled, action selector.
            $this.find(options.otpUsingActionSelector).prop("disabled", true);
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
                // disable otp get button.
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
                var token = event.data;
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
                console.log("OTPSentSuccess", event.data);
                $this.find(options.mobileInputSelector).addClass("disabled").prop("disabled", true);

                if ($.isFunction(options.successHandler)) {
                    options.successHandler(event);
                }
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
            otpImgSuite.addHandler("error", options.errorHandler);

        };

        return this.each(function() {
            var $this = $(this);

            var otpImgSuite = new OtpImageSuite(OtpAPI, {});

            // subscribe interesting OTP module events.
            bindingOtpModule($this, otpImgSuite);

            // hook ui events.
            bindingEvents($this, otpImgSuite);

            // otp module initicalize.
            init($this, otpImgSuite);
        });
    };

})(jQuery);
