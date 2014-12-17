(function($) {

    var apiRoot = "http://localhost:1100";

    var ajaxDataFilter = function(data, type) {
        var convertedData = {};
        //data converter.
        convertedData.code = data.retCode;
        convertedData.data = data.data;
        convertedData.message = data.message;

        console.log("dataFilter: ", convertedData);

        return convertedData;
    };

    window.OtpAPI = {
        /**
         * trySendOTP API
         * @method trySendOTP
         * @param  {number}         mobile mobile
         * @param  {Function} cb    callback
         */
        trySendOTP: function(mobile, extraData, cb) {
            var data = {
                mobile: mobile
            };
            $.extend(data, extraData);

            $.ajax({
                url: apiRoot + "/otp/sendOtp",
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
        trySendOTPWithToken: function(mobile, token, extraData, cb) {
            var data = {
                mobile: mobile,
                token: token
            };
            $.extend(data, extraData);
            
            $.ajax({
                url: apiRoot + "/otp/trySendOTPWithToken",
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
                url: apiRoot + "/otp/validateCaptcha",
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
})(jQuery);
