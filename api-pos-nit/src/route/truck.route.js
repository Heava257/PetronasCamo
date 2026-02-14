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

  app.get("/api/trucks", validate_token("Truck.getlist"), getTruckList);
  app.get("/api/trucks/:id", validate_token("Truck.getone"), getTruck);
  app.get("/api/trucks/available/list", validate_token("Truck.getlist"), getAvailableTrucks);
  app.post("/api/trucks", validate_token("Truck.create"), createTruck);
  app.put("/api/trucks/:id", validate_token("Truck.update"), updateTruck);
  app.delete("/api/trucks/:id", validate_token("Truck.remove"), removeTruck);
  app.post("/api/trucks/assign", validate_token("Truck.update"), assignTruckToOrder);

};
