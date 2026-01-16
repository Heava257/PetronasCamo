const isLocalhost = 
  window.location.hostname === "localhost" || 
  window.location.hostname === "127.0.0.1";

export const Config = {
  // IMPORTANT: Add trailing slash!
  base_url: isLocalhost 
    ? "http://localhost:8000/api/"
    : "https://petronas-api.onrender.com/api/",  // ← Note the trailing slash
  
  version: "1.0",
  token: "",
  
  image_path: isLocalhost 
    ? "http://localhost:8000/api/public/"
    : "https://petronas-api.onrender.com/api/public/",
  
  getFullImagePath: (imagePart) => `${Config.image_path}${imagePart}`,
};

// Debug
console.log('🔧 API Config:', {
  base_url: Config.base_url,
  environment: isLocalhost ? 'localhost' : 'production'
});