(function($) {


    // default configurations for otp web module plugin based on jquery,zepto.js
    // we can also attach this plugin into require.js, seajs.
    var defaultCfg = {
        apiRoot: "http://localhost:1100",
        otpGetSelector: ".trigger-get-otp", //·免费获取·按钮选择器
        mobileInputSelector: ".mobile" //手机号码的输入框
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

        };

        function bindingOtpModule($this, otpImgSuite) {
            // subscribe OTPSending event.
            otpImgSuite.addHandler("OTPSending", function(event) {
                console.log("received OTPSending message: ", event);

            });

             // capture all errors
            otpImgSuite.addHandler("captchaShow", function(event) {
                console.log("received captchaShow message: ", event);

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
