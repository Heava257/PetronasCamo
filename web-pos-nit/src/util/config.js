export const Config = {
  base_url: import.meta.env.VITE_API_URL || "/api",
  version: import.meta.env.VITE_VERSION || "1.0",
  token: "",
  image_path: import.meta.env.VITE_IMAGE_PATH || "/api/public/",
  getFullImagePath: (imagePart) => `${Config.image_path}${imagePart}`,
};
