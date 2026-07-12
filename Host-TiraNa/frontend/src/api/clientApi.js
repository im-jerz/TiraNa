import axios from "axios";

export const CLIENT_API_URL = import.meta.env.VITE_CLIENT_API_URL || "http://localhost:5000";

const clientApi = axios.create({
  baseURL: CLIENT_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default clientApi;
