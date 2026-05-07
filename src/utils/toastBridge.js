let toastHandler = null;
let lastToast = { key: "", ts: 0 };

export function registerToastHandler(handler) {
  toastHandler = typeof handler === "function" ? handler : null;
}

export function notifyToast(payload) {
  if (!toastHandler || !payload?.msg) return;
  const type = payload.type || "info";
  const key = `${type}:${payload.msg}`;
  const now = Date.now();
  if (lastToast.key === key && now - lastToast.ts < 1200) return;
  lastToast = { key, ts: now };
  toastHandler({ msg: payload.msg, type });
}
