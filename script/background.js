/* 
 * Default settings. TODO Let the user choose them with a config window
 */
var defaultSettings = {
    enabled: true,
    recordMethod: "kafka",
    serverUrl: "http://localhost:8082/topics/BBB"
};

/* 
 * Generic error logger.
 */
function onError(e) {
    console.error(`NavInfo-AG: ${e}`);
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
 * Records collected info.
 */
function recordNavInfo(settings, info) {
    if (settings.recordMethod == "log") {
        const json = JSON.stringify(info);
        console.log(`NavInfo-AG: ${json}`);

    } else if (settings.recordMethod == "kafka") {
        let xhr = new XMLHttpRequest();
        xhr.open('post', settings.serverUrl, true);
        xhr.setRequestHeader("Content-Type", "application/vnd.kafka.json.v2+json");
        xhr.onreadystatechange = () => {
            if (xhr.readyState == 4 && xhr.status != 200) {
                 console.error(`NavInfo-AG: POST failed! ${xhr.status} - ${xhr.responseText}`);
            }
        };
        xhr.send(JSON.stringify({records: [{value: info}]}));
    }
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
        const exec = browser.tabs.executeScript(evt.tabId, { file: "script/inject.js" });
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
