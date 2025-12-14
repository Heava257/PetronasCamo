export const setAcccessToken = (value) => {
  localStorage.setItem("access_token", value);
};
export const getAcccessToken = () => {
  return localStorage.getItem("access_token");
};
export const setProfile = (value) => {
  localStorage.setItem("profile", value);
};
export const getProfile = () => {
  try {
    var profile = localStorage.getItem("profile");
    if (profile !== "" && profile !== null && profile !== undefined) {
      return JSON.parse(profile);
    }
    return null;
  } catch (err) {
    return null;
  }
};
export const setPermission = (array) => {
  localStorage.setItem("permission", array);
};
export const getPermission = () => {
  try {
    var permission = localStorage.getItem("permission");
    if (permission !== "" && permission !== null && permission !== undefined) {
      return JSON.parse(permission);
    }
    return null;
  } catch (err) {
    return null;
  }
};
export const setUserId = (id) => {
  localStorage.setItem("user_id", id);
};
export const getUserId = () => {
  const userId = localStorage.getItem("user_id");
  return userId ? Number(userId) : null;
};