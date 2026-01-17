const { getOnlineUsers } = require("../controller/activity_tracker.controller");
const { validate_token } = require("../controller/auth.controller");
const { getUserStatus } = require("../util/helper");
module.exports = (app) => {
  app.get('/api/users/online', validate_token(), getOnlineUsers);
  app.get('/api/users/status/:user_id', validate_token(), getUserStatus);
  app.post('/api/users/heartbeat', validate_token(), (req, res) => {
    res.json({ success: true, message: 'Heartbeat received' });
  });
};
