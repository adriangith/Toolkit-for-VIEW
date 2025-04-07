const fetchTimeout = (url, options = {}) => {
  let { timeout = 90000, ...rest } = options;
  if (rest.signal) throw new Error("Signal not supported in timeoutable fetch");
  const controller = new AbortController();
  const { signal } = controller;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timeout for Promise"));
      if (running) running = false;
      controller.abort();
    }, timeout);
    fetch(url, { signal, ...rest })
      .finally(() => clearTimeout(timer))
      .then(resolve, reject);
  });
};

const fetchRetry = (url, options, n = 3) => fetchTimeout(url, options).catch(function (error) {
  console.log(error);
  if (n === 1) throw error;
  return fetchRetry(url, options, n - 1);
});

export default fetchRetry;