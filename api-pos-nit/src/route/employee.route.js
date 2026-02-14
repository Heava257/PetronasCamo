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
  resetAccountPassword,
} = require("../controller/employee.controller");

module.exports = (app) => {

  app.get("/api/employee",
    validate_token("employee.view"),
    getList
  );

  app.get("/api/employee/:id",
    validate_token("employee.view"),
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
    validate_token("employee.view"),
    getSchedule
  );

  app.get("/api/employee/statistics/late",
    validate_token("employee.view"),
    getLateStatistics
  );

  app.post("/api/employee/create-account",
    validate_token("employee.update"),
    createLoginAccount
  );

  app.get("/api/employee/:id/has-account",
    validate_token("employee.view"),
    checkHasAccount
  );

  app.post("/api/employee/reset-password",
    validate_token("employee.update"),
    resetAccountPassword
  );


  // app.get('/attendance/check-ip', checkIP);
  app.get('/api/attendance/allowed-ips', validate_token("employee.view"), getAllowedIPs);
  app.get('/api/attendance/get-my-ip', validate_token(), getMyIP);
  app.post('/api/attendance/allowed-ips', validate_token("employee.update"), addAllowedIP);
  app.put('/api/attendance/allowed-ips', validate_token("employee.update"), updateAllowedIP);
  app.delete('/api/attendance/allowed-ips', validate_token("employee.update"), deleteAllowedIP);
  app.get('/api/attendance/diagnose-ip', validate_token("employee.view"), diagnoseIP);

};
