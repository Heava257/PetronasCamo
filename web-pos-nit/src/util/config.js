export const Config = {
  base_url: `${import.meta.env.VITE_API_URL}/api/`,
  version: import.meta.env.VITE_VERSION || "1.0",
  token: import.meta.env.VITE_TOKEN || "",
  image_path: `${import.meta.env.VITE_API_URL}/api/public/`,
  getFullImagePath: (imagePart) =>
    `${import.meta.env.VITE_API_URL}/api/public/${imagePart}`,
};

// Debug
console.log("🔧 API Config:", {
  base_url: Config.base_url,
  environment: import.meta.env.DEV ? "localhost" : "production",
});
