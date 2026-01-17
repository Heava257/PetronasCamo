import axios from "axios";
import { Config } from "./config";
import { setServerSatus } from "../store/server.store";
import { getAcccessToken, getPermission, getRefreshToken, setAcccessToken, setRefreshToken, clearTokens } from "../store/profile.store";
import dayjs from "dayjs";

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  
  failedQueue = [];
};

export const request = (url = "", method = "get", data = {}, new_access_token = null) => {
  let access_token = getAcccessToken();
  if (new_access_token) {
    access_token = new_access_token;
  }

  // Set headers
  let headers = { "Content-Type": "application/json" };
  if (data instanceof FormData) {
    headers = { "Content-Type": "multipart/form-data" };
  }

  // Handle GET parameters
  let param_query = "";
  if (method === "get" && data instanceof Object && !(data instanceof FormData)) {
    const params = new URLSearchParams();
    Object.keys(data).forEach(key => {
      if (data[key] !== "" && data[key] !== null && data[key] !== undefined) {
        params.append(key, data[key]);
      }
    });
    if (params.toString()) {
      param_query = "?" + params.toString();
    }
  }

  return axios({
    url: Config.base_url + url + param_query,
    method: method,
    data: method === "get" ? undefined : data,
    headers: {
      ...headers,
      Authorization: access_token ? `Bearer ${access_token}` : undefined,
    },
  })
    .then((res) => {
      setServerSatus(200);
      return res.data;
    })
    .catch(async (err) => {
      const response = err.response;
      
      if (response && response.status === 401) {
        const errorData = response.data;
        
        // Check if token is expired
        if (errorData?.error?.name === "TokenExpiredError" || errorData?.error === "TOKEN_EXPIRED") {
          
          // If already refreshing, queue this request
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then(token => {
              return request(url, method, data, token);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          isRefreshing = true;
          
          try {
            const refresh_token = getRefreshToken();
            
            if (!refresh_token) {
              throw new Error("No refresh token available");
            }

            const refreshResponse = await axios({
              url: Config.base_url + "refresh-token",
              method: "post",
              data: {
                refresh_token: refresh_token
              }
            });

            const newAccessToken = refreshResponse.data.access_token;
            const newRefreshToken = refreshResponse.data.refresh_token;

            // Update tokens in store
            setAcccessToken(newAccessToken);
            setRefreshToken(newRefreshToken);

            // Process queued requests
            processQueue(null, newAccessToken);
            
            // Retry original request with new token
            return request(url, method, data, newAccessToken);
            
          } catch (refreshError) {
            // Refresh failed - clear tokens and redirect to login
            processQueue(refreshError, null);
            clearTokens();
            
            // Redirect to login page or dispatch logout action
            window.location.href = "/login"; // Adjust path as needed
            
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }
      }
      
      // Handle other errors
      if (response) {
        setServerSatus(response.status);
      }
      
      return Promise.reject(err);
    });
};



// ✅ Fixed date formatting functions in helper.js

export const formatDateServer = (date) => {
  if (!date) return null;
  
  // Handle dayjs objects and regular Date objects
  const dateObj = date.format ? date : dayjs(date);
  
  // Always return YYYY-MM-DD format for server
  const formatted = dateObj.format('YYYY-MM-DD');
  return formatted;
};

export const formatDateClient = (dateString, format = "DD/MM/YYYY") => {
  if (!dateString) return "";
  
  try {
    const formatted = dayjs(dateString).format(format);
    return formatted;
  } catch (error) {
    console.error("❌ formatDateClient error:", error);
    return dateString;
  }
};


export const isPermission  = (permission_name) =>{
  const permision = getPermission();
  const findPermission = permision?.findIndex(
    (item) => item.name == permission_name
  );
  if(findPermission != -1){
    return true;
  }
  return false;
}

export function formatPrice(value) {
  const numValue = Number(value || 0);
  
  // Handle invalid numbers
  if (!isFinite(numValue)) {
    return '$0.00';
  }
  
  return `$${numValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Replace your existing getAddressClass function
export const getAddressClass = (address) => {
  if (!address) return 'address-normal';
  
  const length = address.length;
  const khmerLength = (address.match(/[\u1780-\u17FF]/g) || []).length;
  const effectiveLength = length + (khmerLength * 0.8); // Khmer characters take more space
  
  if (effectiveLength <= 35) return 'address-normal';
  if (effectiveLength <= 50) return 'address-medium';
  if (effectiveLength <= 70) return 'address-long';
  if (effectiveLength <= 90) return 'address-very-long';
  if (effectiveLength <= 110) return 'address-extremely-long';
  return 'address-ultra-long';
};

