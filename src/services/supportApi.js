import { apiClient } from './api/client';

export const supportApi = {
  // Public & Client Help Articles
  getCategories: () => apiClient.get('/support/categories'),
  getArticles: (params = {}) => apiClient.get('/support/articles', { params }),
  getArticleBySlug: (slug) => apiClient.get(`/support/articles/${slug}`),
  recordFeedback: (articleId, data) => apiClient.post(`/support/articles/${articleId}/feedback`, data),

  // Studio User Support Tickets
  createTicket: (data) => apiClient.post('/support/tickets', data),
  getUserTickets: (params = {}) => apiClient.get('/support/tickets', { params }),
  getUserTicketById: (id) => apiClient.get(`/support/tickets/${id}`),
  addUserReply: (ticketId, data) => apiClient.post(`/support/tickets/${ticketId}/messages`, data),

  // Super Admin Support Management
  getAdminAnalytics: () => apiClient.get('/admin/support/analytics'),
  getAdminTickets: (params = {}) => apiClient.get('/admin/support/tickets', { params }),
  getAdminTicketById: (id) => apiClient.get(`/admin/support/tickets/${id}`),
  updateAdminTicket: (id, data) => apiClient.patch(`/admin/support/tickets/${id}`, data),
  addAdminReply: (id, data) => apiClient.post(`/admin/support/tickets/${id}/messages`, data),
  addAdminInternalNote: (id, data) => apiClient.post(`/admin/support/tickets/${id}/internal-notes`, data),

  // Super Admin Article Management
  createArticle: (data) => apiClient.post('/admin/support/articles', data),
  updateArticle: (id, data) => apiClient.patch(`/admin/support/articles/${id}`, data),
  deleteArticle: (id) => apiClient.delete(`/admin/support/articles/${id}`),
};

