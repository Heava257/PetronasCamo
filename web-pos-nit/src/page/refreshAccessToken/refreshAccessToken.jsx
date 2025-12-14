import { Config } from "../../util/config";

const { setRefreshToken, getRefreshToken } = require("../../store/profile.store");

const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await axios.post(Config.base_url + "/auth/refresh", {
      refresh_token: refreshToken
    });

    if (response.data && response.data.access_token) {
      setAcccessToken(response.data.access_token);
      
      // Update refresh token if provided
      if (response.data.refresh_token) {
        setRefreshToken(response.data.refresh_token);
      }
      
      return response.data.access_token;
    }
    
    throw new Error("Invalid refresh token response");
  } catch (error) {
    console.error("Failed to refresh token:", error);
    // Clear tokens and redirect to login
    clearTokens();
    window.location.href = "/login";
    throw error;
  }
};

export default refreshAccessToken;