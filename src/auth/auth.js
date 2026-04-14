import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const STORAGE_KEY = "eyelens_auth";

const raw = axios.create({ baseURL: API_BASE, withCredentials: true });

function read() {
  if (typeof window === "undefined") return null;
  try {
    const s = window.localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

function write(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function emitAuthChanged() {
  try {
    window.dispatchEvent(new CustomEvent("eyelens-auth-changed"));
  } catch {
    /* ignore */
  }
}

export function getAccessToken() {
  return read()?.accessToken ?? null;
}

export function getUser() {
  return read()?.user ?? null;
}

export function applyRefreshedSession(payload) {
  const { accessToken, user } = payload || {};
  if (!accessToken) return;
  const prev = read();
  write({ accessToken, user: user ?? prev?.user });
}

export function clearAuth() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  emitAuthChanged();
}

/** After PATCH /users/me — keep JWT and refresh stored user */
export function setStoredUser(user) {
  const prev = read();
  if (!prev?.accessToken) return;
  write({ ...prev, user });
}

export function isAuthenticated() {
  /** Presence only: expired access tokens are refreshed via axios 401 → /auth/refresh */
  return Boolean(getAccessToken());
}

export async function login({ email, password }) {
  const { data } = await raw.post("/auth/login", { email, password });
  const { user, accessToken } = data.data;
  write({ user, accessToken });
  emitAuthChanged();
  return { ok: true };
}

export async function register({ name, email, password }) {
  const { data } = await raw.post("/auth/register", { name, email, password });
  const { user, accessToken } = data.data;
  write({ user, accessToken });
  emitAuthChanged();
  return { ok: true };
}

export async function logout() {
  const token = getAccessToken();
  try {
    await raw.post("/auth/logout", {}, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
  } catch {
    // ignore
  }
  clearAuth();
}

export async function fetchMe() {
  const token = getAccessToken();
  if (!token) return null;
  const { data } = await raw.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
  const user = data.data?.user;
  if (user) write({ ...read(), user });
  return user;
}
