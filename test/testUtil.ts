export const deferred = () => {
  let resolve, reject;
  let p: any = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  p.resolve = resolve;
  p.reject = reject;
  return p;
};

export const resolveDeferred = async (p: any, val: any, wrapper: any) => {
  p.resolve(val);
  await p;
  wrapper && wrapper.update();
};

export const rejectDeferred = async (p: any, val: any, wrapper: any) => {
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

export const dataPacket = (data: any) => ({
  loading: false,
  loaded: true,
  error: null,
  data,
});

export const errorPacket = (error: any) => ({
  loading: false,
  loaded: true,
  error,
  data: null,
});

export const pause = (wrapper: any) =>
  new Promise((res: any) =>
    setTimeout(() => {
      wrapper && wrapper.update();
      res();
    }, 10)
  );
