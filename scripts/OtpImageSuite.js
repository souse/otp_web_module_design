/**
 * OTP短信+图片验证码控件
 *
 * @class OtpImageSuite
 * @constructor
 */
(function(ns) {

    var DEBUG = true;

    // 定义正则表达式验证规则列表常量
    var REG_EXP_RULES = {
        "mobile": "",
        "trim": /^\s+|\s+$/g
    };

    // 定义组建内部错误消息列表常量
    var INNER_MESSAGES = {
        "common": "系统内部错误",
        "mobile": "手机号格式不正确！"
    };

    var toString = Object.prototype.toString;

    function isObject(dest) {
        return dest && toString.call(dest) === "[object Object]";
    };

    /**
     * 移除字符串前后空格
     * @method trim
     * @param  {String} s 给定的字符串
     * @return {String}   返回移除前后空格的字符串
     */
    function trim(s) {
        return s ? s.replace(REG_EXP_RULES["trim"], "") : "";
    };
    /**
     * 验证表单输入格式
     * @param  {String} type  表单输入的类型，如果mobileInputBox, otpInputBox,captchaInputBox
     * @param  {String} input 表单输入类型对应的待验证的值
     * @return {Boolean/String} true: 验证通过 otherwise 返回对应的错误消息string
     */
    function fieldValidator(type, input) {
        var regExp = REG_EXP_RULES[type];
        if (regExp && regExp.test(input)) {
            return true;
        } else {
            return INNER_MESSAGES[type];
        }
    };

    /**
     * 格式化字符串 e.g  stringFormat("my name is {0}, sex is: {1}","tian","male")
     * @param  {Array Like}
     * @return {String} 返回格式化后的新字符串
     */
    function stringFormat() {
        for (var fmt = arguments[0], ndx = 1; ndx < arguments.length; ++ndx) {
            fmt = fmt.replace(new RegExp('\\{' + (ndx - 1) + '\\}', "g"), arguments[ndx]);
        }
        return fmt;
    };
    /**
     * Log 调试信息到日志窗口，log("string ssss{0},{1}", "params1", "params2");
     */
    function log() {
        if (DEBUG && console && toString.call(console) == "[object Console]") {
            console.log(stringFormat.apply(this, arguments));
        }
    };

    function OtpImageSuite() {

        this.handlers = {};

        /**
         * 提供注册组件自定义事件API
         * @method addHandler
         * @param {string} type    自定义事件类型
         * @param {function} handler 自定义事件回调处理器
         */
        this.addHandler = function(type, handler) {
            if (typeof this.handlers[type] == "undefined") {
                this.handlers[type] = [];
            }
            this.handlers[type].push(handler);
        };
        /**
         * 提供移除组件自定义事件API
         * @method addHandler
         * @param {string} type    自定义事件类型
         * @param {function} handler 自定义事件回调处理器
         */
        this.removeHandler = function(type, handler) {
            if (this.handlers[type] instanceof Array) {￼
                var handlers = this.handlers[type];
                for (var i = 0, len = handlers.length; i < len; i++) {
                    if (handlers[i] === handler) {
                        break;
                    }
                }
                handlers.splice(i, 1);
            }
        };
        /**
         * 提供触发组件自定义事件API
         * @method fire
         * @param {string} event 自定义事件类型
         */
        this.fire = function(event) {
            if (!event.target) {
                event.target = this;
            }
            if (this.handlers[event.type] instanceof Array) {
                var handlers = this.handlers[event.type];
                for (var i = 0, len = handlers.length; i < len; i++) {
                    handlers[i](event);
                };
            }
        };
    };


    // 开发的API列表
    OtpImageSuite.prototype = {
        constructor: OtpImageSuite,

        /**
         * API: 尝试发送OTP到指定的手机客户端，如果成功fire事件通知UI显示timeout second.(60s)
         * @param  {string}  mobileNumber string
         * @return {boolean} 返回true表示发送OTP成功,false,
         */
        trySendOTP: function(mobileNumber) {
            this.fire("beforeSendOTP", {

            });

            API.sendOTP(mobileNumber, function(result) {

                this.fire("endSendOTP", {

                });
            });
        }

    };

    //
    ns["OtpImageSuite"] = OtpImageSuite;

})(window);
