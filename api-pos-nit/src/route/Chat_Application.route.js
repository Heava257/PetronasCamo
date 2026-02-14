// const { validate_token } = require("../controller/auth.controller");
// const { getList, create, update, remove } = require("../controller/Chat_Application.conroller");
// module.exports = (app) => {
//   app.get("/api/chats", validate_token(), getList);
//   app.post("/api/chats", validate_token(), create);
//   app.put("/api/chats", validate_token(), update);
//   app.delete("/api/chats", validate_token(), remove);
//   app.get("/api/chats/conversations", validate_token(), (req, res) => {
//     req.query.type = 'conversations';
//     getList(req, res);
//   });
//   app.get("/api/chats/messages/:conversationId", validate_token(), (req, res) => {
//     req.query.type = 'messages';
//     req.query.conversationId = req.params.conversationId;
//     getList(req, res);
//   });
//   app.post("/api/chats/conversations", validate_token(), (req, res) => {
//     req.body.type = 'conversation';
//     create(req, res);
//   });
//   app.post("/api/chats/messages", validate_token(), (req, res) => {
//     req.body.type = 'message';
//     create(req, res);
//   });
//   app.post("/api/chats/participants", validate_token(), (req, res) => {
//     req.body.type = 'participant';
//     create(req, res);
//   });
//   app.get("/api/chats/users", validate_token(), (req, res) => {
//     req.query.type = 'users';
//     getList(req, res);
//   });
// };
