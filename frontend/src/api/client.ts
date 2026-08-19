import axios from "axios";

const API_BASE_URL = "https://ezfinanz-personalloanapllication.onrender.com";

export const api = axios.create({ baseURL: API_BASE_URL });

// Attach the access token to every request. Read fresh from localStorage
// each time rather than capturing it at module init, since login/logout
// swap it out during the app's lifetime.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On a 401, try one silent refresh using the stored refresh token before
// giving up and forcing a re-login. This keeps short-lived access tokens
// from being annoying in normal use.
let isRefreshing = false;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !isRefreshing) {
      original._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        isRefreshing = false;
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        isRefreshing = false;
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (typeof data?.error === "string") return data.error;
    if (data?.error?.fieldErrors) {
      const first = Object.values(data.error.fieldErrors).flat()[0];
      if (typeof first === "string") return first;
    }
    return err.message;
  }
  return "Something went wrong";
}
