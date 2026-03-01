import axios from "axios";

const API = axios.create({
baseURL: import.meta.env.VITE_API_URL,
});

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
  return config;
});

export const authAPI = {
  register: (data) => API.post("/api/auth/register", data),
  login: (data) => API.post("/api/auth/login", data),
  getMe: () => API.get("/api/auth/me"),
  updateProfile: (data) => API.put("/api/auth/profile", data),
};

export const taskAPI = {
  getAll: (params) => API.get("/api/tasks", { params }),
  create: (data) => API.post("/api/tasks", data),
  update: (id, data) => API.put(`/api/tasks/${id}`, data),
  delete: (id) => API.delete(`/api/tasks/${id}`),
};

export const projectAPI = {
  getAll: () => API.get("/api/projects"),
  create: (data) => API.post("/api/projects", data),
  update: (id, data) => API.put(`/api/projects/${id}`, data),
  delete: (id) => API.delete(`/api/projects/${id}`),
};

export default API;
