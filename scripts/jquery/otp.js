(function($) {


    // default configurations for otp web module plugin based on jquery,zepto.js
    // we can also attach this plugin into require.js, seajs.
    var defaultCfg = {
        apiRoot: "http://localhost:1100",
        dataCaptchaId: "captchaId", //$.data("captchaId",111)
        otpGetSelector: ".trigger-get-otp", //·免费获取·按钮选择器
        ticker: ".ticker",
        mobileInputSelector: ".mobile", //手机号码的输入框
        captchaContainerSelector: ".captcha-container",
        captchaImageSelector: ".captcha-img",
        captchaInputSelector: ".captcha-input"

    };

    var ajaxDataFilter = function(data, type) {
        var convertedData = {};
        //data converter.
        convertedData.code = data.retCode;
        convertedData.data = data.data;
        convertedData.message = data.message;

        console.log("dataFilter: ", data, convertedData);

        return convertedData;

    };
    var API = {
        /**
         * trySendOTP API
         * @method trySendOTP
         * @param  {number}         mobile mobile
         * @param  {Function} cb    callback
         */
        trySendOTP: function(mobile, cb) {
            var data = {
                mobile: mobile
            };
            $.ajax({
                url: defaultCfg.apiRoot + "/otp/sendOtp",
                contentType: "application/json",
                type: 'POST',
                dataType: 'json',
                data: JSON.stringify(data),
                processData: false
            }).then(function(data) {
                if (cb) cb(ajaxDataFilter(data));
            }, function(data) {
                // give error message here maybe!
                // if (cb) cb(ajaxDataFilter(data));
            });
        },
        /**
         * validateCaptcha API
         * @method validateCaptcha
         * @param  {object}         captcha, {captchaId:"", captchaInput:""}
         * @param  {Function} cb    callback
         */
        validateCaptcha: function(captcha, cb) {
            $.ajax({
                url: defaultCfg.apiRoot + "/otp/validateCaptcha",
                contentType: "application/json",
                type: 'POST',
                dataType: 'json',
                data: JSON.stringify(captcha),
                processData: false
            }).then(function(data) {
                if (cb) cb(ajaxDataFilter(data));
            }, function(data) {
                // give error message here maybe!
                // if (cb) cb(ajaxDataFilter(data));
            });
        }
    };

    $.fn.otp = function(cfg) {
        var options = $.extend({}, defaultCfg, cfg);

        function bindingEvents($this, otpImgSuite) {
            $this.find(options.otpGetSelector).on("click", function() {
                // find mobile input value.
                var mobile = $this.find(options.mobileInputSelector).val();

                otpImgSuite.trySendOTP(mobile);
            });
            $this.find(options.captchaInputSelector).on("change", function() {
                console.log("captcha input change!");
                var captchaInput = $(this).val();
                var captchaId = $this.find(options.captchaContainerSelector).data(options.dataCaptchaId);
                if (inputVal.length == 4) {
                    otpImageService.validateCaptcha({
                        captchaId: captchaId,
                        captchaInput: captchaInput
                    });
                }
            });
        };

        function bindingOtpModule($this, otpImgSuite) {
            // subscribe OTPSending event.
            otpImgSuite.addHandler("OTPSending", function(event) {
                console.log("received OTPSending message: ", event);

            });

            // capture captchaShow event
            otpImgSuite.addHandler("captchaShow", function(event) {
                console.log("received captchaShow message: ", event);
                var captcha = event.data;
                var $captchaContainer = $this.find(options.captchaContainerSelector);
                $captchaContainer.removeClass("hide").addClass("show");
                $captchaContainer.data(options.dataCaptchaId, captcha.id);
                $this.find(options.captchaImageSelector).attr("src", captcha.imgUrl);
            });

            //OTP 短信发送成功,会自动启动计时器，disable 手机号输入框
            otpImgSuite.addHandler("OTPSentSuccess", function(event) {
                $this.find(options.mobileInputSelector).addClass("disabled").prop("disabled",true);
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

            var otpImgSuite = new OtpImageSuite(API, {});

            // subscribe interesting OTP module events.
            bindingOtpModule($this, otpImgSuite);

            // hook ui events.
            bindingEvents($this, otpImgSuite);

        });
    };

})(jQuery);
