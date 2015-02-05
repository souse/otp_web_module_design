/**
 * @Description: web埋点初始化
 * 提取为静态资源，方便增加打点数据
 * @Author: xujia(2014-09-30 16:11)
 */

(function(){
    try{
        var paramsHashMap = new HashMap(),
            mcId = getQueryString('WT.mc_id'), pageAppId, channelId, customerId, appId, sessionId, deviceId,
            customerIdBox = document.getElementById("customerIdForWebCollection"), 
            appIdBox = document.getElementById("appIdForWebCollection"),
            sessionIdBox = document.getElementById("appSessionIdForWebCollection"), 
            deviceIdBox = document.getElementById("appDeviceIdForWebCollection");

        // appId、channelId页面全局参数传入pageAppIdForWebCollection、channelIdForWebCollection
        pageAppId = (typeof pageAppIdForWebCollection !== "undefined") ? pageAppIdForWebCollection : 'C4h7T7Kk73';
        channelId = (typeof channelIdForWebCollection !== "undefined") ? channelIdForWebCollection : '136hy99uC8';

        // 传入用户信息
        if(customerId = _trimString(customerIdBox.value)){
            paramsHashMap.put("customerId", customerId);
        }
        // 传入appId
        if(appId = _trimString(appIdBox.value)){
            paramsHashMap.put("appId", appId);
        }
        // 传入sessionId
        if(sessionId = _trimString(sessionIdBox.value)){
            paramsHashMap.put("sessionId", sessionId);
        }
        // 传入deviceId
        if(deviceId = _trimString(deviceIdBox.value)){
            paramsHashMap.put("deviceId", deviceId);
        }

        // 传入外部渠道投放参数id（目前只应用到注册流程）
        if(mcId){
            paramsHashMap.put("mcId", mcId);
        }
        Agent.init(pageAppId, channelId);
        Agent.enterPage(document.URL, paramsHashMap);
    }catch (e){}

    // 获取请求参数
    function getQueryString(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = window.location.search.substr(1).match(reg);
        if (r != null){
            return unescape(r[2]);
        }else{
            return "";
        }
    }

    function _trimString(str){
        return str.replace(/(^\s*)|(\s*$)/g, "");
    }
})();
