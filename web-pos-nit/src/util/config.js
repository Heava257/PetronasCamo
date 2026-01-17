const rawApiUrl = (import.meta.env.VITE_API_URL || "").trim();

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  // If already full URL, return as is
  if (imagePath.startsWith('http')) return imagePath;

  // Remove leading slash if exists
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;

  // Remove 'uploads/' or 'api/public/' prefix if it exists in the path
  const fileName = cleanPath.replace(/^(uploads\/|api\/public\/)/, '');

  return `${rawApiUrl}/uploads/${fileName}`;
};

export const Config = {
  base_url: `${rawApiUrl}/api/`,
  version: import.meta.env.VITE_VERSION || "1.0",
  token: import.meta.env.VITE_TOKEN || "",

  // ✅ FIXED: Correct image path
  image_path: `${rawApiUrl}/uploads/`,

  // ✅ New helper function
  getImageUrl,

  // ✅ BACKWARD COMPATIBILITY: Restore original function name
  getFullImagePath: getImageUrl,
};

// Debug
console.log("🔧 Frontend Config:", {
  api_url: rawApiUrl,
  base_url: Config.base_url,
  image_path: Config.image_path,
  environment: import.meta.env.DEV ? "development" : "production"
});