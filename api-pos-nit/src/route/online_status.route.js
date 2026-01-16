const { getOnlineUsers } = require('../controller/activity_tracker.controller');
const { validate_token } = require('../controller/auth.controller');
const { getUserStatus } = require('../middleware/activity_tracker.middleware');
const { trackUserActivity } = require('../middleware/activity_tracker.middleware');

module.exports = (app) => {
    app.get('/api/users/online', validate_token(), getOnlineUsers);
    app.use(trackUserActivity); 
    app.get('/api/users/status/:user_id', validate_token(), getUserStatus);

}