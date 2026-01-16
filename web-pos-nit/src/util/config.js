const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

export const Config = {
  // Force relative path on production to use Vercel proxy (avoids Mixed Content error)
  base_url: isLocalhost ? (import.meta.env.VITE_API_URL || "http://localhost:8000/api/") : "/api",
  version: import.meta.env.VITE_VERSION || "1.0",
  token: "",
  image_path: isLocalhost ? (import.meta.env.VITE_IMAGE_PATH || "http://localhost:8000/api/public/") : "/api/public/",
  getFullImagePath: (imagePart) => `${Config.image_path}${imagePart}`,
};
