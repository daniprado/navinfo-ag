// ***************************
// Injected code by NavInfo-AG
browser.runtime.onMessage.addListener(
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
    })
// **************************

