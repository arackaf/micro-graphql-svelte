export const deferred = () => {
  let resolve, reject;
  let p = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  p.resolve = resolve;
  p.reject = reject;
  return p;
};

export const resolveDeferred = async (p, val, wrapper) => {
  p.resolve(val);
  await p;
  wrapper && wrapper.update();
};

export const rejectDeferred = async (p, val, wrapper) => {
  try {
    p.reject(val);
  } catch (er) {}
  try {
    await p;
  } catch (er) {}
  wrapper && wrapper.update();
};

export const defaultPacket = {
  loading: false,
  loaded: false,
  data: null,
  error: null,
};

export const loadingPacket = {
  loading: true,
  loaded: false,
  data: null,
  error: null,
};

export const dataPacket = (data) => ({
  loading: false,
  loaded: true,
  error: null,
  data,
});

export const errorPacket = (error) => ({
  loading: false,
  loaded: true,
  error,
  data: null,
});

export const pause = (wrapper) =>
  new Promise((res) =>
    setTimeout(() => {
      wrapper && wrapper.update();
      res();
    }, 10)
  );
