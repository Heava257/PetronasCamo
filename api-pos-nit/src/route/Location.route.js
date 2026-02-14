const { validate_token } = require("../controller/auth.controller");

// ============================================
// LOCATION ROUTES
// ============================================
const {
  getList: getLocationList,
  getOne: getLocation,
  getCustomerLocations,
  create: createLocation,
  update: updateLocation,
  remove: removeLocation,
  setDefault: setDefaultLocation
} = require("../controller/Location.controller");

module.exports = (app) => {
  // List all locations (with filters)
  app.get("/api/locations", validate_token(), getLocationList);
  
  // Get locations for specific customer
  app.get("/api/locations/customer/:customer_id", validate_token(), getCustomerLocations);
  
  // Get single location
  app.get("/api/locations/:id", validate_token(), getLocation);
  
  // Create location
  app.post("/api/locations", validate_token(), createLocation);
  
  // Update location
  app.put("/api/locations/:id", validate_token(), updateLocation);
  
  // Delete location
  app.delete("/api/locations/:id", validate_token(), removeLocation);
  
  // Set as default location
  app.patch("/api/locations/:id/set-default", validate_token(), setDefaultLocation);
};
