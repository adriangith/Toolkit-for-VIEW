const fetchTimeout = (url, options = {}) => {
  let { timeout = 30000, ...rest } = options;
  if (rest.signal) throw new Error("Signal not supported in timeoutable fetch");
  const controller = new AbortController();
  const { signal } = controller;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timeout for Promise"));
      controller.abort();
    }, timeout);
    fetch(url, { signal, ...rest })
      .then(resolve, reject);
  });
};

const fetchRetry = (url, options, n = 3) => fetchTimeout(url, options).catch(function (error) {
  console.log(error);
  if (n === 1) throw error;
  return fetchRetry(url, options, n - 1);
});

export default fetchRetry;