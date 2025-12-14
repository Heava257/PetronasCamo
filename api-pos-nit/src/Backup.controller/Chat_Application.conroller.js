const { db, isArray, isEmpty, logError } = require("../util/helper");

// Get list of chats or messages
exports.getList = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available from token validation
    const { type, conversationId, limit = 20, offset = 0 } = req.query;

    // Type can be 'conversations' or 'messages'
    if (type === 'conversations') {
      // Get user's conversations
      const query = `
        SELECT 
          c.id, 
          c.name, 
          c.is_group,
          c.created_at,
          c.updated_at,
          (
            SELECT JSON_OBJECT(
              'id', m.id,
              'content', m.content,
              'sender_id', m.sender_id,
              'created_at', m.created_at
            )
            FROM messages m
            WHERE m.conversation_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
          ) as last_message,
          (
            SELECT COUNT(*)
            FROM messages m
            WHERE m.conversation_id = c.id AND m.sender_id != ? AND m.read = 0
          ) as unread_count
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        WHERE cp.user_id = ?
        ORDER BY c.updated_at DESC
        LIMIT ? OFFSET ?
      `;

      const [conversations] = await db.query(query, [userId, userId, parseInt(limit), parseInt(offset)]);

      // Get participants for each conversation
      for (const conversation of conversations) {
        const [participants] = await db.query(`
          SELECT 
            u.id, 
            u.username, 
            u.avatar,
            cp.is_admin
          FROM conversation_participants cp
          JOIN user u ON cp.user_id = u.id
          WHERE cp.conversation_id = ?
        `, [conversation.id]);

        conversation.participants = participants;
      }

      return res.status(200).json({
        status: "success",
        data: conversations
      });
    } 
    else if (type === 'messages') {
      // Verify user has access to this conversation
      const [access] = await db.query(
        'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
        [conversationId, userId]
      );

      if (access.length === 0) {
        return res.status(403).json({
          status: "error",
          message: "You don't have access to this conversation"
        });
      }

      // Get messages from conversation
      const [messages] = await db.query(`
        SELECT 
          m.id,
          m.conversation_id,
          m.sender_id,
          m.content,
          m.image_url,
          m.created_at,
          m.read,
          JSON_OBJECT(
            'id', u.id,
            'username', u.username,
            'avatar', u.avatar
          ) as sender
        FROM messages m
        JOIN user u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `, [conversationId, parseInt(limit), parseInt(offset)]);

      // Mark messages as read
      await db.query(`
        UPDATE messages
        SET read = 1
        WHERE conversation_id = ? AND sender_id != ? AND read = 0
      `, [conversationId, userId]);

      return res.status(200).json({
        status: "success",
        data: messages.reverse() // Return in chronological order
      });
    } 
    else if (type === 'user') {
      // Search user for adding to conversations
      const { search = '' } = req.query;
      
      const [user] = await db.query(`
        SELECT 
          id, 
          username, 
          avatar
        FROM user
        WHERE username LIKE ? AND id != ?
        LIMIT 10
      `, [`%${search}%`, userId]);

      return res.status(200).json({
        status: "success",
        data: user
      });
    }
    else {
      return res.status(400).json({
        status: "error",
        message: "Invalid type parameter"
      });
    }
  } catch (error) {
    logError("chat.getList", error, res);
  }
};

// Create a new conversation or send a message
exports.create = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available from token validation
    const { type } = req.body;

    if (type === 'conversation') {
      const { name, isGroup = false, participants = [] } = req.body;
      
      // Make sure participants array includes valid user IDs
      if (!isArray(participants) || participants.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Participants must be a non-empty array"
        });
      }

      // Start a transaction
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Create conversation
        const [result] = await connection.query(
          'INSERT INTO conversations (name, is_group) VALUES (?, ?)',
          [name || null, isGroup]
        );
        
        const conversationId = result.insertId;
        
        // Add participants
        const participantValues = participants.map(participantId => [
          conversationId,
          participantId,
          isGroup && participantId === userId // Make creator admin if group
        ]);
        
        // Add current user if not already in participants
        if (!participants.includes(userId)) {
          participantValues.push([conversationId, userId, isGroup]);
        }
        
        await connection.query(
          'INSERT INTO conversation_participants (conversation_id, user_id, is_admin) VALUES ?',
          [participantValues]
        );
        
        await connection.commit();
        
        // Get the created conversation
        const [conversations] = await db.query(`
          SELECT 
            c.id, 
            c.name, 
            c.is_group,
            c.created_at
          FROM conversations c
          WHERE c.id = ?
        `, [conversationId]);

        // Get participants
        const [conversationParticipants] = await db.query(`
          SELECT 
            u.id, 
            u.username, 
            u.avatar,
            cp.is_admin
          FROM conversation_participants cp
          JOIN user u ON cp.user_id = u.id
          WHERE cp.conversation_id = ?
        `, [conversationId]);

        const conversation = conversations[0];
        conversation.participants = conversationParticipants;
        
        return res.status(201).json({
          status: "success",
          data: conversation
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } 
    else if (type === 'message') {
      const { conversationId, content, imageUrl = null } = req.body;
      
      // Validate required fields
      if (isEmpty(conversationId) || (isEmpty(content) && isEmpty(imageUrl))) {
        return res.status(400).json({
          status: "error",
          message: "Conversation ID and either content or image are required"
        });
      }

      // Check if user has access to this conversation
      const [access] = await db.query(
        'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
        [conversationId, userId]
      );

      if (access.length === 0) {
        return res.status(403).json({
          status: "error",
          message: "You don't have access to this conversation"
        });
      }

      // Insert message
      const [result] = await db.query(
        'INSERT INTO messages (conversation_id, sender_id, content, image_url, read) VALUES (?, ?, ?, ?, 0)',
        [conversationId, userId, content, imageUrl]
      );
      
      // Update conversation's last activity
      await db.query(
        'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [conversationId]
      );
      
      // Get the created message with sender info
      const [messages] = await db.query(`
        SELECT 
          m.id,
          m.conversation_id,
          m.sender_id,
          m.content,
          m.image_url,
          m.created_at,
          m.read,
          JSON_OBJECT(
            'id', u.id,
            'username', u.username,
            'avatar', u.avatar
          ) as sender
        FROM messages m
        JOIN user u ON m.sender_id = u.id
        WHERE m.id = ?
      `, [result.insertId]);
      
      return res.status(201).json({
        status: "success",
        data: messages[0]
      });
    } 
    else {
      return res.status(400).json({
        status: "error",
        message: "Invalid type parameter"
      });
    }
  } catch (error) {
    logError("chat.create", error, res);
  }
};

// Update a conversation or message
exports.update = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available from token validation
    const { type, id } = req.body;

    if (type === 'conversation') {
      const { name } = req.body;
      
      // Check if user is an admin of this conversation
      const [admin] = await db.query(
        'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ? AND is_admin = 1',
        [id, userId]
      );

      if (admin.length === 0) {
        return res.status(403).json({
          status: "error",
          message: "You don't have permission to update this conversation"
        });
      }

      // Update conversation
      await db.query(
        'UPDATE conversations SET name = ? WHERE id = ?',
        [name, id]
      );
      
      return res.status(200).json({
        status: "success",
        message: "Conversation updated successfully"
      });
    } 
    else if (type === 'message') {
      const { content } = req.body;
      
      // Check if user is the sender of this message
      const [message] = await db.query(
        'SELECT 1 FROM messages WHERE id = ? AND sender_id = ?',
        [id, userId]
      );

      if (message.length === 0) {
        return res.status(403).json({
          status: "error",
          message: "You don't have permission to update this message"
        });
      }

      // Update message
      await db.query(
        'UPDATE messages SET content = ? WHERE id = ?',
        [content, id]
      );
      
      return res.status(200).json({
        status: "success",
        message: "Message updated successfully"
      });
    } 
    else if (type === 'participant') {
      const { conversationId, participantId, isAdmin } = req.body;
      
      // Check if user is an admin of this conversation
      const [admin] = await db.query(
        'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ? AND is_admin = 1',
        [conversationId, userId]
      );

      if (admin.length === 0) {
        return res.status(403).json({
          status: "error",
          message: "You don't have permission to update participants"
        });
      }

      // Update participant
      await db.query(
        'UPDATE conversation_participants SET is_admin = ? WHERE conversation_id = ? AND user_id = ?',
        [isAdmin, conversationId, participantId]
      );
      
      return res.status(200).json({
        status: "success",
        message: "Participant updated successfully"
      });
    } 
    else {
      return res.status(400).json({
        status: "error",
        message: "Invalid type parameter"
      });
    }
  } catch (error) {
    logError("chat.update", error, res);
  }
};

// Remove a conversation, message, or participant
exports.remove = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available from token validation
    const { type, id } = req.body;

    if (type === 'conversation') {
      // Check if user is an admin of this conversation
      const [admin] = await db.query(
        'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ? AND is_admin = 1',
        [id, userId]
      );

      if (admin.length === 0) {
        return res.status(403).json({
          status: "error",
          message: "You don't have permission to delete this conversation"
        });
      }

      // Delete conversation (cascade should handle participants and messages)
      await db.query('DELETE FROM conversations WHERE id = ?', [id]);
      
      return res.status(200).json({
        status: "success",
        message: "Conversation deleted successfully"
      });
    } 
    else if (type === 'message') {
      // Check if user is the sender of this message
      const [message] = await db.query(
        'SELECT 1 FROM messages WHERE id = ? AND sender_id = ?',
        [id, userId]
      );

      if (message.length === 0) {
        return res.status(403).json({
          status: "error",
          message: "You don't have permission to delete this message"
        });
      }

      // Delete message
      await db.query('DELETE FROM messages WHERE id = ?', [id]);
      
      return res.status(200).json({
        status: "success",
        message: "Message deleted successfully"
      });
    } 
    else if (type === 'participant') {
      const { conversationId, participantId } = req.body;
      
      // Check if user is an admin of this conversation or removing themselves
      const [admin] = await db.query(
        'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ? AND (is_admin = 1 OR user_id = ?)',
        [conversationId, userId, participantId]
      );

      if (admin.length === 0) {
        return res.status(403).json({
          status: "error",
          message: "You don't have permission to remove this participant"
        });
      }

      // Remove participant
      await db.query(
        'DELETE FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
        [conversationId, participantId]
      );
      
      return res.status(200).json({
        status: "success",
        message: "Participant removed successfully"
      });
    } 
    else {
      return res.status(400).json({
        status: "error",
        message: "Invalid type parameter"
      });
    }
  } catch (error) {
    logError("chat.remove", error, res);
  }
};