const axios     = require('axios');
const ChatModel = require('../models/chatModel');
const UserModel = require('../models/userModel');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * chatController.js
 * Manages chat sessions and orchestrates RAG calls to the AI microservice.
 */

// POST /api/chat/sessions  – create a new session
const createSession = async (req, res) => {
  const { title } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  const sessionId = await ChatModel.createSession(userId, title || 'New Chat');

  if (!sessionId) {
    return res.status(500).json({ success: false, message: 'Failed to create chat session.' });
  }

  return res.status(201).json({
    success: true,
    session_id: sessionId,
    sessionId,
  });
};

// GET /api/chat/sessions  – list all sessions for user
const getSessions = async (req, res) => {
  const sessions = await ChatModel.getSessionsByUser(req.user.id);
  return res.status(200).json({ success: true, sessions });
};

// GET /api/chat/sessions/:sessionId  – session + full history
const getSession = async (req, res) => {
  const { sessionId } = req.params;
  const session = await ChatModel.getSessionById(sessionId, req.user.id);

  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found.' });
  }

  const messages = await ChatModel.getMessagesBySession(sessionId);
  return res.status(200).json({ success: true, session, messages });
};

// DELETE /api/chat/sessions/:sessionId
const deleteSession = async (req, res) => {
  const { sessionId } = req.params;
  const session = await ChatModel.getSessionById(sessionId, req.user.id);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found.' });
  }
  await ChatModel.deleteSession(sessionId, req.user.id);
  return res.status(200).json({ success: true, message: 'Session deleted.' });
};

// PATCH /api/chat/sessions/:sessionId/title
const renameSession = async (req, res) => {
  const { sessionId } = req.params;
  const { title }     = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required.' });
  }

  const session = await ChatModel.getSessionById(sessionId, req.user.id);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found.' });
  }

  await ChatModel.updateSessionTitle(sessionId, req.user.id, title);
  return res.status(200).json({ success: true, message: 'Session renamed.' });
};

// POST /api/chat/sessions/:sessionId/message  – send a message, get AI reply
const sendMessage = async (req, res) => {
  const { sessionId } = req.params;
  const { message }   = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
  }

  const session = await ChatModel.getSessionById(sessionId, req.user.id);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found.' });
  }

  // Fetch user health profile to inject into RAG prompt
  const healthProfile = await UserModel.getHealthProfile(req.user.id);

  // Save user message
  await ChatModel.addMessage(sessionId, req.user.id, 'user', message);

  // Fetch last N messages for conversation history
  const history = await ChatModel.getRecentMessages(sessionId, 8);

  // Call AI microservice
  let aiResponse;
  try {
    const { data } = await axios.post(
      `${AI_URL}/api/chat`,
      {
        query: message,
        user_id: String(req.user.id),
        health_profile: healthProfile || {},
        history: history.map((m) => ({ role: m.role, content: m.content })),
      },
      { timeout: 60000 }
    );
    aiResponse = data;
  } catch (err) {
    console.error('[chatController] AI service error:', err.message);
    // Graceful fallback
    aiResponse = {
      answer: 'I am currently unable to process your request. Please try again shortly.',
      sources: [],
    };
  }

  const { answer, sources = [] } = aiResponse;

  // Save assistant message
  const msgId = await ChatModel.addMessage(sessionId, req.user.id, 'assistant', answer, sources);

  // Auto-title session after first exchange
  if (session.title === 'New Chat') {
    const shortTitle = message.slice(0, 60) + (message.length > 60 ? '…' : '');
    await ChatModel.updateSessionTitle(sessionId, req.user.id, shortTitle);
  }

  await ChatModel.touchSession(sessionId);

  return res.status(200).json({
    success: true,
    message: {
      id: msgId,
      role: 'assistant',
      content: answer,
      sources,
    },
  });
};

module.exports = { createSession, getSessions, getSession, deleteSession, renameSession, sendMessage };
