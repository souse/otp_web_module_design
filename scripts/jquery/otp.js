(function($) {

    // default configurations for otp web module plugin based on jquery,zepto.js
    // we can also attach this plugin into require.js, seajs.
    var defaultCfg = {
        mobileTrigger: "",
        otpApi: ""
    };

    function Otp() {
        this.cfg = defaultCfg;
    };

    Otp.prototype = {
        constructor: Otp,

        // initialize control configurations.
        init: function(otps) {
            this.cfg = $.extend({}, defaultCfg, otps);
        },
        send: function() {
        	
        }
    };
})(jQuery);
