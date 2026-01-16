const isLocalhost = 
  window.location.hostname === "localhost" || 
  window.location.hostname === "127.0.0.1";

export const Config = {
  // CRITICAL: Use direct HTTPS URL in production (NOT relative path)
  base_url: isLocalhost 
    ? (import.meta.env.VITE_API_URL || "http://localhost:8000/api/")
    : (import.meta.env.VITE_API_URL || "https://petronas-api.onrender.com/api"),
  
  version: import.meta.env.VITE_VERSION || "1.0",
  token: "",
  
  image_path: isLocalhost 
    ? (import.meta.env.VITE_IMAGE_PATH || "http://localhost:8000/api/public/")
    : (import.meta.env.VITE_IMAGE_PATH || "https://petronas-api.onrender.com/api/public/"),
  
  getFullImagePath: (imagePart) => `${Config.image_path}${imagePart}`,
};

// Debug logging
if (isLocalhost) {
  console.log('🔧 Config loaded:', {
    base_url: Config.base_url,
    image_path: Config.image_path,
    environment: isLocalhost ? 'localhost' : 'production'
  });
}