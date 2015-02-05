(function($) {
    // uniform data converter
    var ajaxDataFilter = function(data) {
        var dataResult = {};

        // if we invoke mtp service "1000" is ajax success return code.
        if (this.isMtp) {

            _newResult = {};
            $.extend(_newResult, data);
            delete _newResult.resultCode; //"1000"表示业务逻辑成功！,"1022"-业务走不下去的错误, "2022"-表示系统未知错误
            delete _newResult.resultMsg;

            dataResult.code = data.resultCode;
            dataResult.message = data.resultMsg;
            dataResult.data = _newResult;
            // convert 1000 to 000000.
            if (dataResult.code == "1000") {
                dataResult.code = "000000";
            }

        } else {
            //data converter.
            dataResult.code = data.code;
            dataResult.message = data.message;
            dataResult.data = data.data;
        }

        return dataResult;
    };
    // DTO for trySendOTP().
    var ajaxTrySendOTPDataFilter = function(data) {

        // base DTO.
        var result = ajaxDataFilter.call(this, data);

        if (result.code == "000000") {
            // send successfully!.
            // now return all data values.
            // result.data = {
            //     maskedMobile: result.data.maskedMobile,
            //     retrySeconds: result.data.retrySeconds,
            //     // it's optional, otp id number.
            //     otpId: result.data.otpId
            // };
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
        var result = ajaxDataFilter.call(this, data);
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
        var result = ajaxDataFilter.call(this, data);
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
            url = this.apiRoot + url;
        }
        return url;
    };

    var OtpAPI = {
        //"http://192.168.11.10:8080";
        apiRoot: "http://localhost:1100",
        // we can customized sendOTP http request api name.
        trySendOTPApi: "",
        // The value indicates current service api is MTP service.
        // default is MTP service.
        isMtp: true,
        // expose some usefull dto for otp apis. 
        // Note. you should use call() specificed window.OtpApi as current context scope.
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
            // we can defined api name to route specificed api path.
            var _sendOTPApiUrl = this.trySendOTPApi || "/selfcenter/changeSendOtp";

            $.ajax({
                url: getRequestUrl.call(this, _sendOTPApiUrl),
                contentType: "application/json",
                type: 'POST',
                dataType: 'json',
                data: JSON.stringify(data),
                processData: false
            }).then(function(data) {
                if (cb) cb(ajaxTrySendOTPDataFilter.call(OtpAPI, data));
            }, function(data) {
                // give error message here maybe!
                // if (cb) cb(ajaxDataFilter(data));
                throw new Error("status code:" + data.status);
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
                url: getRequestUrl.call(this, "/goutong/refreshCaptcha"),
                contentType: "application/json",
                type: 'POST',
                dataType: 'json',
                data: JSON.stringify(data),
                processData: false
            }).then(function(data) {
                if (cb) cb(ajaxRefreshCaptchaDataFilter.call(OtpAPI, data));
            }, function(data) {
                // give error message here maybe!
                // if (cb) cb(ajaxDataFilter(data));
                throw new Error("status code:" + data.status);
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
                url: getRequestUrl.call(this, "/goutong/verifyCaptcha"),
                contentType: "application/json",
                type: 'POST',
                dataType: 'json',
                data: JSON.stringify(captcha),
                processData: false
            }).then(function(data) {
                if (cb) cb(ajaxVerifyCaptchaDataFilter.call(OtpAPI, data));
            }, function(data) {
                // give error message here maybe!
                // if (cb) cb(ajaxDataFilter(data));
                throw new Error("status code:" + data.status);
            });
        }
    };
    // expose it to windows object.
    window.PafOtpAPI = OtpAPI;

})(jQuery);
