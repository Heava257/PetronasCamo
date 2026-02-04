const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  getById,
  create,
  update,
  remove,
  getSchedule,
  getLateStatistics,
  createLoginAccount,
  checkHasAccount,
  getAllowedIPs,
  getMyIP,
  addAllowedIP,
  updateAllowedIP,
  deleteAllowedIP,
  diagnoseIP,
} = require("../controller/employee.controller");

module.exports = (app) => {

  app.get("/api/employee",
    validate_token(),
    getList
  );

  app.get("/api/employee/:id",
    validate_token(),
    getById
  );

  app.post("/api/employee",
    validate_token("employee.create"),
    create
  );

  app.put("/api/employee",
    validate_token("employee.update"),
    update
  );

  app.delete("/api/employee",
    validate_token("employee.remove"),
    remove
  );

  app.get("/api/employee/:id/schedule",
    validate_token(),
    getSchedule
  );

  app.get("/api/employee/statistics/late",
    validate_token(),
    getLateStatistics
  );

  app.post("/api/employee/create-account",
    validate_token("employee.update"),
    createLoginAccount
  );

  app.get("/api/employee/:id/has-account",
    validate_token(),
    checkHasAccount
  );


  // app.get('/attendance/check-ip', checkIP);
  app.get('/api/attendance/allowed-ips', getAllowedIPs);
  app.get('/api/attendance/get-my-ip', getMyIP);
  app.post('/api/attendance/allowed-ips', addAllowedIP);
  app.put('/api/attendance/allowed-ips', updateAllowedIP);
  app.delete('/api/attendance/allowed-ips', deleteAllowedIP);
  app.get('/api/attendance/diagnose-ip', diagnoseIP);

};


