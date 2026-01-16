const { validate_token } = require("../controller/auth.controller");
const {
  getList: getTruckList,
  getOne: getTruck,
  create: createTruck,
  update: updateTruck,
  remove: removeTruck,
  getAvailable: getAvailableTrucks,
  assignToOrder: assignTruckToOrder
} = require("../controller/Truck.controller");

module.exports = (app) => {

  app.get("/api/trucks", validate_token(), getTruckList);
  app.get("/api/trucks/:id", validate_token(), getTruck);
  app.get("/api/trucks/available/list", validate_token(), getAvailableTrucks);
  app.post("/api/trucks", validate_token(), createTruck);
  app.put("/api/trucks/:id", validate_token(), updateTruck);
  app.delete("/api/trucks/:id", validate_token(), removeTruck);
  app.post("/api/trucks/assign", validate_token(), assignTruckToOrder);

};
