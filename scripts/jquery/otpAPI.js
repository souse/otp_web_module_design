(function($) {

    var apiRoot = "http://localhost:1100";

    // uniform data converter
    var ajaxDataFilter = function(data) {
        var dataResult = {};
        //data converter.
        dataResult.code = data.code;
        dataResult.data = data.data;
        dataResult.message = data.message;
        console.log("dataFilter: ", dataResult);

        return dataResult;
    };
    // DTO for trySendOTP().
    var ajaxTrySendOTPDataFilter = function(data) {
        data = ajaxDataFilter(data);
        if (data.code != "000000" || data.code == "1184") {
            // alwasy use 0000001 to ask captcha code.
            data.code = "000001";
            // send failed, return us captcha entity.
            data.captchaId = data.captchaId;
            data.captchaUrl = data.captchaUrl;
        } else {
            // send successfully!.
            data.maskedMobile = data.maskedMobile;
            data.retrySeconds = data.retrySeconds;
        }
        return data;
    };
    //DTO for refreshCaptcha().
    var ajaxRefreshCaptchaDataFilter = function(data) {
        data = ajaxDataFilter(data);
        if (data.code != "000000") {
            data.captchaToken = data.captchaToken;
        }
        return data;
    };
    //DTO for verifyCaptcha().
    var ajaxVerifyCaptchaDataFilter = function(data) {
        data = ajaxDataFilter(data);
        if (data.code != "000000") {
            data.captchaToken = data.captchaToken;
        }
        return data;
    };
    window.OtpAPI = {
        /**
         * trySendOTP API
         * @method trySendOTP
         * @param  {number}         mobile mobile
         * @param  {Function} cb    callback
         * callback (result)
         * if
         *     result.code=="000000"-> {maskedMobile,retrySeconds}
         * else
         *     ->{captchaId, captchaUrl}
         */
        trySendOTP: function(mobile, captchaToken, deviceId, extraData, cb) {
            var data = {
                mobile: mobile,
            };
            // optional. token. first time captchaToken is null.
            if (captchaToken) {
                data.captchaToken = captchaToken;
            }
            // optional
            if (deviceId) {
                data.deviceId = deviceId;
            }

            $.extend(data, extraData);

            $.ajax({
                url: apiRoot + "/otp/sendOtp",
                contentType: "application/json",
                type: 'POST',
                dataType: 'json',
                data: JSON.stringify(data),
                processData: false
            }).then(function(data) {
                if (cb) cb(ajaxTrySendOTPDataFilter(data));
            }, function(data) {
                // give error message here maybe!
                // if (cb) cb(ajaxDataFilter(data));
            });
        },
        /**
         * refresh captcha API
         * @method refreshCaptcha
         * @param  {Function} cb    callback
         */
        refreshCaptcha: function(extraData, cb) {
            var data = {};
            $.extend(data, extraData);
            $.ajax({
                url: apiRoot + "/otp/refreshCaptcha",
                contentType: "application/json",
                type: 'POST',
                dataType: 'json',
                data: JSON.stringify(data),
                processData: false
            }).then(function(data) {
                if (cb) cb(ajaxRefreshCaptchaDataFilter(data));
            }, function(data) {
                // give error message here maybe!
                // if (cb) cb(ajaxDataFilter(data));
            });
        },
        /**
         * verifyCaptcha API
         * @method verifyCaptcha
         * @param  {object}       captcha, {captchaId:"", captchaInput:""}
         * @param  {object}       extraData: {} anything.
         * @param  {Function} cb  callback (captchaToken)
         */
        verifyCaptcha: function(captcha, extraData, cb) {
            $.extend(captcha, extraData);
            $.ajax({
                url: apiRoot + "/otp/verifyCaptcha",
                contentType: "application/json",
                type: 'POST',
                dataType: 'json',
                data: JSON.stringify(captcha),
                processData: false
            }).then(function(data) {
                if (cb) cb(ajaxVerifyCaptchaDataFilter(data));
            }, function(data) {
                // give error message here maybe!
                // if (cb) cb(ajaxDataFilter(data));
            });
        }
    };
})(jQuery);
