import { QueryClient } from "@tanstack/react-query";
import Axios from "axios";

export const queryClient = new QueryClient();

const api = Axios.create({
  baseURL: `http://localhost:3001`,
});

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