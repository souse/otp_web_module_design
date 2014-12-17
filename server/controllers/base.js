/**
 * Provider base util function for all child controller.
 * @type {[type]}
 */
var _ = require("underscore");
var exception = require("../helpers/exception");
var logger = require("../helpers/log");

var base = {
    name: "base",
    mixin: function(source, target) {
        return _.extend(source || {}, target);
    },
    /**
     * Out api error message format
     * @param  {response} res
     * @param  {object} the Error instance.
     */
    apiErrorOutput: function(res, error) {
        if (_.isString(error)) {
            error = new Error(error);
        }
        if (error && error.error) {
            error = error.error;
        }
        exception.writeJSONError(res, error);
    },
    /**
     * Output successed json information to client
     */
    apiOkOutput: function(res, info) {
        if (this.hasPassed(info)) {
            if (info.code) {
                var retCode = info.code;
                delete info.code;
            }
            res.json({
                retCode: retCode || "000000",
                data: _.isUndefined(info) ? null : info,
                message: ''
            });
        } else {
            this.apiErrorOutput(res, info.error);
        }
    },
    hasPassed: function(result) {
        // has error information.
        if (result && result.failed === true) {
            return false;
        }
        return true;
    },
    /**
     * capture all api request, and attach response content-Type:'application/json' and other headers
     * @param  {object}   req  http request
     * @param  {object}   res  http response
     * @param  {Function} next next
     */
    setResponseHeaders: function(req, res, next) {
        if (res) {
            res.set({
                "Content-Type": "application/json"
            });
        }
        if (next) next();
    },
    getErrorModel: function(code, message) {
        var _error = {
            status: code || 500,
            message: message || ''
        };
        return exception.getErrorModel(_error);
    }
};
module.exports = base;
