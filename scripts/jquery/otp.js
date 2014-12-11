(function($) {


	// default configurations for otp web module plugin based on jquery,zepto.js
    // we can also attach this plugin into require.js, seajs.
    var defaultCfg = {
        otpApi: ""
    };

    function Otp(cfg) {
    	// do something....
    };

    Otp.prototype = {
        constructor: Otp,

        // initialize control configurations.
        init: function(cfg) {
        	// rewrite current widget config paramaters.
            this.cfg = $.extend({}, defaultCfg, cfg);
        },
        send: function() {

        }
    };

    $.fn.otp = function(cfg) {
    	return this.each(function(){
    		var $this = $(this);

    	});
    };

})(jQuery);
