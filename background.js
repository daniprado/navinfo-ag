/* 
 * Default settings. TODO Let the user choose them with a config window
 */
var defaultSettings = {
    enabled: true,
    recordMethod: "log",
};

/* 
 * Generic error logger.
 */
function onError(e) {
    console.error(`NavInfo-AG --> ${e}`);
}

/*
 * Obtains Request fields from webRequest event
 */
function fetchReqInfo(evt) {

    const url = new URL(evt.url);
    return {
        protocol: url.protocol,
        host: url.hostname,
        ip: evt.ip,
        port: url.port,
        method: evt.method,
        responseCode: evt.statusCode,
        timestamp: evt.timestamp
    };
}

/*
 * Records collected info. TODO We need more recordMethods...
 */
function recordNavInfo(settings, info) {
    if (settings.recordMethod == "log") {
        const json = JSON.stringify(info);
        console.log(`Gone and come back: ${json}`);
    }
}

/*
 * Builds the javascript code to inject on requested HTTP document
 */
function buildFetchTimingInfo() {

    const result = `browser.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        const timing = window.performance.timing;
        sendResponse({
            response: {
                duration: timing.responseEnd - timing.navigationStart,
                redirectDuration: timing.redirectEnd - timing.redirectStart,
                dnsDuration: timing.domainLookupEnd - timing.domainLookupStart,
                tcpDuration: (timing.secureConnectionStart > 0 
                    ?  timing.secureConnectionStart 
                    : timing.connectEnd) - timing.connectStart,
                sslDuration: timing.secureConnectionStart > 0 
                    ? timing.connectEnd - timing.secureConnectionStart : 0,
                requestDuration: timing.responseStart - timing.requestStart,
                responseDuration: timing.responseEnd - timing.responseStart,
                numRedirects : window.performance.navigation.redirectCount
            }
        });
    })`;

    return { code : result };
}

browser.webRequest.onCompleted.addListener(evt => {

    // Discarding not interesting webRequests...
    if (evt.frameId !== 0 || evt.tabId == -1) {
        return;
    }

    // TODO settings should be stored
    const settings = defaultSettings;
    // Listener will only work if extension is enabled and it is triggered by a
    // "main_frame"
    if (settings.enabled && evt.type == "main_frame") {
        // Fetch request info
        let info = fetchReqInfo(evt);
        // Inject the script
        var exec = browser.tabs.executeScript(evt.tabId, buildFetchTimingInfo());
        exec.then(() => {
            // Send a message to fetch timing info
            browser.tabs.sendMessage(evt.tabId, {}).then(res => { 
                // Merge info and record it
                Object.assign(info, res.response);
                recordNavInfo(settings, info);
            }).catch(onError)
        }).catch(onError);
    }       
}, { 
    urls: ['<all_urls>'] 
});
