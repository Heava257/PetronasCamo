//frontend

export const Config = {
  base_url: import.meta.env.VITE_API_URL || "http://localhost:3000/api/",
  version: "1.0",
  token: "",
  image_path: import.meta.env.VITE_IMAGE_PATH || "http://localhost/fullstack/",
  getFullImagePath: (imagePart) => `${Config.image_path}${imagePart}`,
};




// export const Config = {
//   base_url: "https://api.coredev.online/api/",
//   version: "1.0",
//   token: "",
//   image_path: "https://api.coredev.online/public/", // Removed the incorrect colon after 'localhost'
//   getFullImagePath: (imagePart) => `${Config.image_path}${imagePart}`, // Helper function
// };