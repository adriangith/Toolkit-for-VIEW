chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    (async () => {
        await fetchRetry(msg.url, msg.fetchOptions)
        sendResponse("done");
    })();
    return true;
});

const fetchTimeout = (url, options = {}) => {
    let { timeout = 5000, ...rest } = options;
    if (rest.signal) throw new Error("Signal not supported in timeoutable fetch");
    const controller = new AbortController();
    const { signal } = controller;
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error("Timeout for Promise"));
            controller.abort();
        }, timeout);
        fetch(url, { signal, ...rest })
            .finally(() => clearTimeout(timer))
            .then(resolve, reject);
    });
};

const fetchRetry = (url, options, n = 2) => fetchTimeout(url, options).catch(function (error) {
    if (n === 1) throw error;
    return fetchRetry(url, options, n - 1);
});

chrome.runtime.sendMessage({function: "sameSiteCookieMaker"}, function(response) {
    console.log(response.message);
  });

