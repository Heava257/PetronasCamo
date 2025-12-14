// util/config.js
//backend

// config.js
module.exports = {
  config: {
    app_name: "POS-NIT",
    app_versoin: "1.0",
    frontend_url: "http://localhost:3000",

    image_path: "C:/xampp/htdocs/fullstack/",
    db: {
      HOST: "localhost",
      USER: "root",
      PASSWORD: "",
      DATABASE: "petronas_last3",
      PORT: 3306,
    },

    token: {
      access_token_key:
        "#$*%*(*234898ireiuLJEROI#@)(#)$*@#)*$(@948858839798283838jaflke",
      refresh_token_key:
        "REFRESH#$*%*(*234898ireiuLJEROI#@)(#)$*@#)*$(@948858839798283838jaflkeREFRESH",
    },
    google_oauth: {
      client_id: "560658332704-c0alvnu94ko2vbofdomrhnfhn4bn7i1h.apps.googleusercontent.com",
      client_secret: "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",
      redirect_uri: "http://localhost:8080/api/auth/google/callback",
    }
  },

};
