import { QueryClient } from "@tanstack/react-query";
import Axios from "axios";
import { store } from "../redux/store";
import { logoutAction } from "../redux/slices/accountSlice";

export const queryClient = new QueryClient();

const api = Axios.create({
  baseURL: `http://localhost:3001`,
});

// Add an interceptor for responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the response status is 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      // Dispatch logout to clear token
      store.dispatch(logoutAction());
      // Redirect to login: If you have access to a navigate function:
      window.location.href = "/login"; 
      // Or if using history, 
      // history.push("/login");
    }

    return Promise.reject(error);
  }
);

class HttpClient {
  get(url, configs=null) {
    return api.get(url, configs);
  }

  post(url, data, configs=null) {
    return api.post(url, data, configs);
  }

  put(url, data=null, configs=null) {
    return api.put(url, data, configs);
  }

  delete(url, config=null) {
    return api.delete(url, config);
  }
}

export const httpClient = new HttpClient();