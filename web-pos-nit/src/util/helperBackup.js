import axios from "axios";
import { Config } from "./config";
import { setServerSatus } from "../store/server.store";
import { getAcccessToken, getPermission } from "../store/profile.store";
import dayjs from "dayjs";

export const request = (url = "", method = "get", data = {}) => {
  var access_token = getAcccessToken();
  // in react
  var headers = { "Content-Type": "application/json" };
  if (data instanceof FormData) {
    // check if param data is FormData
    headers = { "Content-Type": "multipart/form-data" };
  }
  var param_query = "?";
  if (method == "get" && data instanceof Object) {
    Object.keys(data).map((key, index) => {
      if (data[key] != "" && data[key] != null) {
        param_query += "&" + key + "=" + data[key];
      }
    });
  }
  return axios({
    url: Config.base_url + url + param_query,
    method: method,
    data: data,
    headers: {
      ...headers,
      Authorization: "Bearer " + access_token,
    },
  })
    .then((res) => {
      setServerSatus(200);
      return res.data;
    })
    .catch((err) => {
      var response = err.response;
      if (response) {
        var status = response.status;
        if (status == "401") {
          status = 403;
        }
        setServerSatus(status);
      } else if (err.code == "ERR_NETWORK") {
        setServerSatus("error");
      }
      return false;
    });
};

export const formatDateClient = (date, format = "DD/MM/YYYY") => {
  if (date) return dayjs(date).format(format);
  return null;
};

export const formatDateServer = (dateValue) => {
  // If it's null or undefined, return empty string
  if (!dateValue) return '';
  
  // If it's a dayjs object
  if (dateValue && typeof dateValue === 'object' && dateValue.format) {
    return dateValue.format('YYYY-MM-DD');
  }
  
  // If it's a Date object
  if (dateValue instanceof Date) {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // If it's a string, ensure it's properly formatted
  if (typeof dateValue === 'string') {
    // Try to match DD/MM/YYYY format
    const match = dateValue.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const [_, day, month, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Already in YYYY-MM-DD format
    if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateValue;
    }
  }
  
  // If all else fails, return the current date
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


export function formatPrice(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}



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