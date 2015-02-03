define("otp/1.0.0/index-debug", ["jquery", "otp/1.0.0/OtpImageSuite-debug", "otp/1.0.0/otpAPI-debug"], function(require, exports, module) {
  var $ = require("jquery");
  var OtpImageSuite = require("otp/1.0.0/OtpImageSuite-debug");
  // export otp sample service to client, allow us extend it to suit for customized bisuness.
  var otpService = require("otp/1.0.0/otpAPI-debug");
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
    eventListener: function(event) {},
    // 允许OTP 发送成功回调客户端指定的函数
    otpHasPassedCallback: function(result) {},
    // 允许OTP 发送失败回调客户端指定的函数(code, message)
    otpErrorsCallback: function(event) {},
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
});
define("otp/1.0.0/OtpImageSuite-debug", [], function(require, exports, module) {
  /**
   * OTP短信+图片验证码控件
   *
   * @class OtpImageSuite
   * @constructor
   */
  (function(ns) {
    var DEBUG = false;
    // 定义正则表达式验证规则列表常量
    var REG_EXP_RULES = {
      "phone": /^1[3-9][0-9]\d{8}$/, //验证手机号码/^1[3|4|5|8][0-9]\d{4,8}$/
      "mobile": /^1[3-9][0-9]\d{8}$/, //验证手机号码/^1[3|4|5|8][0-9]\d{4,8}$/
      "trim": /^\s+|\s+$/g
    };
    // 定义组建内部错误消息列表常量
    var INNER_MESSAGES = {
      "common": "系统内部错误",
      "phone": "手机号码格式错误",
      "mobile": "手机号码格式错误"
    };
    var toString = Object.prototype.toString;

    function isObject(dest) {
      return dest && toString.call(dest) === "[object Object]";
    };

    function isFunction(dest) {
      return dest && toString.call(dest) === "[object Function]";
    };
    /**
     * Clone object.
     * @param  {object} source source
     * @return {object} new object.
     */
    function clone(source) {
      var F = function() {};
      F.prototype = source;
      return new F();
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
        console.log.apply(console, arguments);
      }
    };
    // default configurations for OtpImageSuite.
    var cfg = {
      timeout: 1000,
      // provider default biz send otp service name.
      trySendOTPServiceName: "trySendOTP",
      // default we use mobile numnber to send otp, we can set as true, use token,.. to send otp.
      ignoreMobileValidation: false,
      // ticker second default
      tickerSecond: 60
    };
    /**
     * @class OtpImageSuite
     * @constructor
     * @param {object} otpImageService service contract.
     *  +trySendOTP(phone, captchaToken, deviceId)
     *  +refreshCaptcha()
     *  +verifyCaptcha(captchaVal, captchaId)
     * @return {code:"", message:"", data:""}
     */
    function OtpImageSuite(otpImageService, options) {
      this.cfg = clone(cfg);
      for (var prop in options) {
        if (options.hasOwnProperty(prop) && options[prop]) {
          this.cfg[prop] = options[prop];
        }
      }
      if (!otpImageService) {
        throw new Error("我们必须提供Otp ImageCode 的服务实例！");
      }
      this.handlers = {};
      // receiver,如果存在则调用接收器传递所有的广播事件.
      // 只允许一个接收器
      this.receiver = null;
      //为了复用存在框架的Service机制，这里我们注入外部的service API contract
      this.service = otpImageService;
      // ----------------------------------------------------
      // 辅助方法！
      // ----------------------------------------------------
      /**
       * @events showTicker (tickerLeft)
       *         closeTicker(tickerLeft)
       * @param  {object} scope
       * @param  {number} tickerLeft how many ticker second left.
       */
      var tickerId;
      var startTicker = function(scope, tickerLeft) {
        tickerLeft = tickerLeft || cfg.tickerSecond;
        tickerId = setTimeout(function() {
          log("ticker `%s` ", tickerLeft);
          scope.fireEvent("showTicker", tickerLeft);
          tickerLeft = tickerLeft - 1;
          if (tickerLeft > 0) {
            startTicker(scope, tickerLeft);
          } else {
            tickerLeft = 0;
            scope.fireEvent("closeTicker", tickerLeft);
          }
        }, cfg.timeout);
      };
      var tearDownTicker = function() {
        if (tickerId) {
          clearTimeout(tickerId);
          tickerId = 0;
        }
      };
      this._startTicker = function(scope, tickerSecond) {
        // tear down running ticker.
        tearDownTicker();
        // make sure provider  
        startTicker(scope, tickerSecond);
      };
    };
    OtpImageSuite.prototype = {
      constructor: OtpImageSuite,
      /**
       * 提供注册组件自定义事件API
       * @method addHandler
       * @param {string} type    自定义事件类型
       * @param {function} handler 自定义事件回调处理器
       */
      addHandler: function(type, handler) {
        if (typeof this.handlers[type] == "undefined") {
          this.handlers[type] = [];
        }
        // make sure it's function.
        if (isFunction(handler)) {
          this.handlers[type].push(handler);
        }
      },
      /**
       * 提供注册一个接受器，可以接受当前组建广播的所有消息
       * @param {function} handler 客户端接收器
       */
      addReceiver: function(handler) {
        this.receiver = handler;
      },
      /**
       * 提供移除组件自定义事件API
       * @method removeHandler
       * @param {string} type    自定义事件类型
       * @param {function} handler 自定义事件回调处理器
       */
      removeHandler: function(type, handler) {
        if (this.handlers[type] instanceof Array) {
          var handlers = this.handlers[type];
          for (var i = 0, len = handlers.length; i < len; i++) {
            if (handlers[i] === handler) {
              break;
            }
          }
          handlers.splice(i, 1);
        }
      },
      /**
       * 提供触发组件自定义事件API
       * @method fire
       * @param {string} event 自定义事件类型
       */
      fire: function(event) {
        if (!event.target) {
          event.target = this;
        }
        // 如果定义了接收器，则不在单独广播单独的事件消息.
        if (this.receiver) {
          if (isFunction(this.receiver)) {
            this.receiver(event);
          } else {
            throw new Error("`receiver`接收器必须是一个函数！")
          }
        } else {
          if (this.handlers[event.type] instanceof Array) {
            var handlers = this.handlers[event.type];
            for (var i = 0, len = handlers.length; i < len; i++) {
              handlers[i](event);
            };
          }
        }
      },
      fireEvent: function(eventType, data) {
        log("fireEvent eventType: ", eventType, " data:", data);
        var event = {
          type: eventType,
          data: data || null
        };
        this.fire(event);
      },
      fireError: function(code, message) {
        this.fireEvent("error", {
          code: code,
          message: message
        });
      },
      /**
       * API: Provider short methods to validate mobile number.
       * @param  {string}  mobile mobile number.
       * @return {Boolean}        [description]
       */
      isMobile: function(mobile) {
        return fieldValidator("mobile", mobile);
      },
      /**
       * API: 尝试发送OTP到指定的手机客户端，如果成功fire事件通知UI显示timeout second.(60s)
       * @events OTPSending    () 将会在OTP发送短信之前被调用.
       *         OTPSentSuccess({data})
       *         captchaShow   ({captchaId:'', captchaUrl:''})
       * @param  {string}  phone string
       * @param  {string}  captchaToken string (optional)
       * @param  {string}  deviceId string (optional)
       */
      trySendOTP: function(phone, captchaToken, deviceId, extraData) {
        // check phone number.
        if (!this.cfg.ignoreMobileValidation) {
          var vlResult = fieldValidator("phone", phone);
          if (vlResult !== true) {
            this.fireError("mobile_invalid", vlResult);
            return;
          }
        }
        // otp sending event.
        this.fireEvent("OTPSending");
        var _this = this;
        // ------------------------------------------------
        // 外部注入SERVICE的API:trySendOTP(phone);
        var trySendOTPServiceAPI = this.service[this.cfg.trySendOTPServiceName];
        if (!isFunction(trySendOTPServiceAPI)) {
          this.fireError("try_send_otp_service_undefined", "自定义业务trySendOTP()不是一个函数");
          return;
        }
        // invoke biz service to send otp.
        trySendOTPServiceAPI.call(this.service, phone, captchaToken, deviceId, extraData, function(result) {
          var data = result.data;
          var code = result.code;
          switch (code) {
            case "000000":
              _this.fireEvent("OTPSentSuccess", data);
              var tickerSecond = 0;
              if (!isNaN(data.retrySeconds)) {
                tickerSecond = parseInt(data.retrySeconds);
              }
              _this._startTicker(_this, tickerSecond);
              break;
            case "000001":
              var captcha = data.captcha;
              if (captcha) {
                _this.fireEvent("captchaShow", captcha);
              } else {
                throw Error("当前服务器端未传回Captha对象");
              }
              break;
            default:
              log("nothing to do...., code: %s in `trySendOTP`", code);
              _this.fireError(code, result.message);
          }
        });
      },
      /**
       * API: 手动刷新图片验证码,如果刷新成功则触发 `captchaRefreshed` 事件
       * @events captchaRefreshed       ({captchaId:'', captchaUrl:''})
       *         captchaRefreshedFailed (message)
       * @param  {object} extraData (optional)
       * @return {void}
       */
      refreshCaptcha: function(extraData) {
        // ------------------------------------------------
        // 外部注入SERVICE的API:refreshCaptcha();
        // 
        var _this = this;
        this.service.refreshCaptcha(extraData, function(result) {
          var code = result.code;
          var data = result.data;
          switch (code) {
            case "000000":
              //验证码刷新成功！
              _this.fireEvent("captchaRefreshed", data.captcha);
              break;
            default:
              //验证码输入错误.
              _this.fireError("captcha_refreshed_failed", result.message);
              break;
          }
        });
      },
      /**
       * API: 验证用户输入的图片验证码，如果验证通过则返回captchaToken,
       * 发送短信的是需要带上captchaToken
       * @events tokenFlushed       (captchaTokenValue string)
       *         tokenFlushedFailed (message)
       * @param  {object} captcha   {captchaId, captchaInput}
       * @param  {object} extraData attach extra data to servier api.
       * @return {void}
       */
      verifyCaptcha: function(captcha, extraData) {
        // ------------------------------------------------
        // 外部注入SERVICE的API:validateCaptcha(captcha);
        // captcha:{captchaId:"", captchaInput:""}
        // 
        var _this = this;
        this.service.verifyCaptcha(captcha, extraData, function(result) {
          var code = result.code;
          var data = result.data;
          switch (code) {
            case "000000":
              _this.fireEvent("tokenFlushed", data.captchaToken);
              break;
            default:
              //验证码输入错误.
              _this.fireError("token_flushed_failed", result.message);
              break;
          }
        });
      }
    };
    //
    ns["OtpImageSuite"] = OtpImageSuite;
    if (typeof module === "object" && module && typeof module.exports === "object") {
      // Expose OtpImageSuite as module.exports in loaders that implement the Node
      // module pattern (including browserify). Do not create the global, since
      // the user will be storing it themselves locally, and globals are frowned
      // upon in the Node module world.
      module.exports = OtpImageSuite;
    } else {
      // Register as a named AMD module, Do this after creating the global so that if an AMD module wants
      // to call noConflict to hide this version of jQuery, it will work.
      if (typeof define === "function" && define.amd) {
        define("OtpImageSuite", [], function() {
          return OtpImageSuite;
        });
      }
    }
  })(window);
});
define("otp/1.0.0/otpAPI-debug", ["jquery"], function(require, exports, module) {
  var $ = require("jquery");
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
      url = this.apiRoot + url;
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
        url: getRequestUrl.call(this, "/selfcenter/changeSendOtp"),
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
        if (cb) cb(ajaxRefreshCaptchaDataFilter(data));
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
        if (cb) cb(ajaxVerifyCaptchaDataFilter(data));
      }, function(data) {
        // give error message here maybe!
        // if (cb) cb(ajaxDataFilter(data));
        throw new Error("status code:" + data.status);
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
});