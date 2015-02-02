(function($) {

    // uniform data converter
    var ajaxDataFilter = function(data) {
        var dataResult = {};
        //data converter.
        dataResult.code = data.code;
        dataResult.data = data.data;
        dataResult.message = data.message;

        return dataResult;
    };
    // DTO for trySendOTP().
    var ajaxTrySendOTPDataFilter = function(data) {
        var result = ajaxDataFilter(data);
        if (result.code == "000000") {
            // send successfully!.
            result.data = {
                maskedMobile: result.data.maskedMobile,
                retrySeconds: result.data.retrySeconds,
                // it's optional, otp id number.
                otpId: result.data.otpId
            };
        } else if (result.code != "000000" && result.code == "1184") {
            // alwasy use 0000001 to ask captcha code.
            result.code = "000001";
            // send failed, return us captcha entity.
            // return new captcha.
            result.data = {
                captcha: {
                    captchaId: result.data.captchaId,
                    captchaUrl: result.data.captchaUrl
                }
            };
        }
        return result;
    };
    //DTO for refreshCaptcha().
    var ajaxRefreshCaptchaDataFilter = function(data) {
        var result = ajaxDataFilter(data);
        if (result.code == "000000") {
            // return new captcha.
            result.data = {
                captcha: {
                    captchaId: result.data.captchaId,
                    captchaUrl: result.data.captchaUrl
                }
            };
        }
        return result;
    };
    //DTO for verifyCaptcha().
    var ajaxVerifyCaptchaDataFilter = function(data) {
        var result = ajaxDataFilter(data);
        if (result.code == "000000") {
            // return new captchaToken property.
            result.data = {
                captchaToken: result.data
            };
        }
        return result;
    };

    function getRequestUrl(url) {

        // if we providered an api url with "http|s" prefix omit it.
        if (!/^(ftp|http|https):\/\/[^ "]+$/.test(url)) {
            url = apiBaseUrl + url;
        }
        return url;
    };

    window.OtpAPI = {
        //"http://192.168.11.10:8080";
        apiRoot: "http://localhost:1100",

        // expose some usefull dto for otp apis.
        dtos: {
            baseAjaxDto: ajaxDataFilter,
            baseAjaxTrySendOTPDto: ajaxTrySendOTPDataFilter,
            baseAjaxRefreshCaptchaDto: ajaxRefreshCaptchaDataFilter,
            baseAjaxVerifyCaptchaDto: ajaxVerifyCaptchaDataFilter
        },
        /**
         * trySendOTP API
         * @method trySendOTP
         * @param  {number}         phone mobile phone number.
         * @param  {Function} cb    callback
         * callback (result)
         * if result.code=="000000"
         *     {maskedMobile,retrySeconds}
         * else
         *     {captchaId, captchaUrl}
         */
        trySendOTP: function(phone, captchaToken, deviceId, extraData, cb) {
            var data = {
                phone: phone,
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
                url: getRequestUrl("/goutong/demo/sendSMSLogin"),
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
                url: getRequestUrl("/goutong/refreshCaptcha"),
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
                url: getRequestUrl("/goutong/verifyCaptcha"),
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
    if (typeof module === "object" && module && typeof module.exports === "object") {
        module.exports = window.OtpAPI;
    } else {
        if (typeof define === "function" && define.amd) {
            define("OtpAPI", [], function() {
                return window.OtpAPI;
            });
        }
    }
})(jQuery);
