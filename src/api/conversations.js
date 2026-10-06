import api from './client';

export const getMyConversations = () =>
  api.get('/conversations').then((r) => r.data);

export const getConversation = (id) =>
  api.get(`/conversations/${id}`).then((r) => r.data.data);

export const getMessages = (conversationId, params = {}) =>
  api.get(`/conversations/${conversationId}/messages`, { params }).then((r) => r.data);

export const sendMessage = (conversationId, body) =>
  api
    .post(`/conversations/${conversationId}/messages`, { body })
    .then((r) => r.data.data);

export const markConversationRead = (conversationId) =>
  api.put(`/conversations/${conversationId}/read`).then((r) => r.data);

export const startDirectConversation = (userId) =>
  api.post('/conversations/direct', { userId }).then((r) => r.data.data);

export const getOrCreateCourseGroup = (courseId) =>
  api.get(`/conversations/course/${courseId}/group`).then((r) => r.data.data);