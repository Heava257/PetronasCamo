let localConfig = {};
try {
  localConfig = require("./config.local"); // Only works locally
} catch (err) {
  console.warn("Local config file not found, using default settings");
}

module.exports = {
  config: {
    app_name: "POS-NIT",
    app_version: "1.0",
    frontend_url: "http://localhost:3000",

    image_path: "C:/xampp/htdocs/fullstack/",
    db: localConfig.db || {
      HOST: "localhost",
      USER: "root",
      PASSWORD: "",
      DATABASE: "petronas_last4_full",
      PORT: 3306,
    },

    token: localConfig.token || {
      access_token_key: "#$*%*(*234898ireiuLJEROI#@)(#)$*@#)*$(@948858839798283838jaflke",
      refresh_token_key:
        "REFRESH#$*%*(*234898ireiuLJEROI#@)(#)$*@#)*$(@948858839798283838jaflkeREFRESH",
    },
  },
};
  


