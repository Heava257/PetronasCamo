export const setAcccessToken = (value) => {
  if (value) {
    localStorage.setItem("access_token", value);
  } else {
    localStorage.removeItem("access_token");
  }
};
export const getAcccessToken = () => {
  return localStorage.getItem("access_token");
};
export const setProfile = (value) => {
  if (value) {
    localStorage.setItem("profile", JSON.stringify(value));
  } else {
    localStorage.removeItem("profile");
  }
};
export const getProfile = () => {
  try {
    var profile = localStorage.getItem("profile");
    if (profile !== "" && profile !== null && profile !== undefined && profile !== "null") {
      let data = JSON.parse(profile);
      if (typeof data === 'string') {
        return JSON.parse(data);
      }
      return data;
    }
    return null;
  } catch (err) {
    return null;
  }
};
export const setPermission = (array) => {
  if (array) {
    localStorage.setItem("permission", JSON.stringify(array));
  } else {
    localStorage.removeItem("permission");
  }
};
export const getPermission = () => {
  try {
    var permission = localStorage.getItem("permission");
    if (permission !== "" && permission !== null && permission !== undefined && permission !== "null") {
      let data = JSON.parse(permission);
      if (typeof data === 'string') {
        return JSON.parse(data);
      }
      return data;
    }
    return null;
  } catch (err) {
    return null;
  }
};
export const setUserId = (id) => {
  if (id) {
    localStorage.setItem("user_id", id);
  } else {
    localStorage.removeItem("user_id");
  }
};
export const getUserId = () => {
  const userId = localStorage.getItem("user_id");
  return userId ? Number(userId) : null;
};

export const setRefreshToken = (value) => {
  if (value) {
    localStorage.setItem("refresh_token", value);
  } else {
    localStorage.removeItem("refresh_token");
  }
};

export const getRefreshToken = () => {
  return localStorage.getItem("refresh_token");
};

export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("profile");
  localStorage.removeItem("permission");
  localStorage.removeItem("user_id");
};