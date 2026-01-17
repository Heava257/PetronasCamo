const rawApiUrl = (import.meta.env.VITE_API_URL || "").trim();

export const Config = {
  base_url: `${rawApiUrl}/api/`,
  version: import.meta.env.VITE_VERSION || "1.0",
  token: import.meta.env.VITE_TOKEN || "",
  image_path: `${rawApiUrl}/api/public/`,
  getFullImagePath: (imagePart) =>
    `${rawApiUrl}/api/public/${imagePart}`,
};

// Debug
console.log("🔧 API Config:", {
  base_url: Config.base_url,
  environment: import.meta.env.DEV ? "localhost" : "production",
});
