const { validate_token } = require("../controller/auth.controller");
const { getList, create, update, remove } = require("../controller/Chat_Application.conroller");
// const { getList, create, update, remove } = require("../controller/Chat_Application.controller");

module.exports = (app) => {
  // Chat application routes
  app.get("/api/chats", validate_token(), getList);
  app.post("/api/chats", validate_token(), create);
  app.put("/api/chats", validate_token(), update);
  app.delete("/api/chats", validate_token(), remove);
  
  // Additional routes for specific use cases
  // Get conversations with optional filters
  app.get("/api/chats/conversations", validate_token(), (req, res) => {
    req.query.type = 'conversations';
    getList(req, res);
  });
  
  // Get messages from a specific conversation
  app.get("/api/chats/messages/:conversationId", validate_token(), (req, res) => {
    req.query.type = 'messages';
    req.query.conversationId = req.params.conversationId;
    getList(req, res);
  });
  
  // Create a new conversation
  app.post("/api/chats/conversations", validate_token(), (req, res) => {
    req.body.type = 'conversation';
    create(req, res);
  });
  
  // Send a message to a conversation
  app.post("/api/chats/messages", validate_token(), (req, res) => {
    req.body.type = 'message';
    create(req, res);
  });
  
  // Add a participant to a conversation
  app.post("/api/chats/participants", validate_token(), (req, res) => {
    req.body.type = 'participant';
    create(req, res);
  });
  
  // Search users
  app.get("/api/chats/users", validate_token(), (req, res) => {
    req.query.type = 'users';
    getList(req, res);
  });
};