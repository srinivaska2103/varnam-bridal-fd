import { apiClient } from './client';

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  studioUserLogin: (credentials) => apiClient.post('/auth/studio-user/login', credentials),
  getStudioInfo: (slug) => apiClient.get(`/auth/studio-info/${slug}`),
  register: (data) => apiClient.post('/auth/register', data),
  verifyEmail: (data) => apiClient.post('/auth/verify-email', data),
  resendOtp: (data) => apiClient.post('/auth/resend-otp', data),
  forgotPassword: (data) => apiClient.post('/auth/forgot-password', data),
  resetPassword: (data) => apiClient.post('/auth/reset-password', data),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get('/auth/me'),
};

export const businessApi = {
  create: (data) => apiClient.post('/business', data),
  list: () => apiClient.get('/business'),
  getById: (id) => apiClient.get(`/business/${id}`),
  update: (id, data) => apiClient.patch(`/business/${id}`, data),
  getSummary: (id) => apiClient.get(`/business/${id}/summary`),
  getMembers: (id) => apiClient.get(`/business/${id}/members`),
  createStudioUser: (businessId, data) => apiClient.post(`/business/${businessId}/users`, data),
  toggleUserStatus: (businessId, userId, isActive) => apiClient.patch(`/business/${businessId}/users/${userId}/status`, { isActive }),
  resetUserPassword: (businessId, userId, newPassword) => apiClient.post(`/business/${businessId}/users/${userId}/reset-password`, { newPassword }),
  deleteStudioUser: (businessId, userId) => apiClient.delete(`/business/${businessId}/users/${userId}`),
};

export const subscriptionApi = {
  getPlans: () => apiClient.get('/subscriptions/plans'),
  getMySubscription: () => apiClient.get('/subscriptions/me'),
  getFeatures: (businessId) => apiClient.get(`/subscriptions/${businessId}/features`),
  createCheckout: (businessId, planCode, returnUrl) => {
    const payload = typeof planCode === 'object' ? planCode : { planCode, ...(returnUrl ? { returnUrl } : {}) };
    return apiClient.post(`/subscriptions/${businessId}/checkout`, payload);
  },
  verifyPayment: (businessId, payload) => {
    const data = typeof payload === 'object' ? payload : { orderId: payload };
    return apiClient.post(`/subscriptions/${businessId}/verify-payment`, data);
  },
  getPaymentHistory: (businessId) => apiClient.get(`/subscriptions/${businessId}/payment-history`),
  cancelSubscription: (businessId, reason) => apiClient.post(`/subscriptions/${businessId}/cancel`, { reason }),
  reactivateSubscription: (businessId) => apiClient.post(`/subscriptions/${businessId}/reactivate`),
  updateAutoRenewal: (businessId, autoRenew) => apiClient.patch(`/subscriptions/${businessId}/auto-renewal`, { autoRenew }),
  submitContactSales: (businessId, data) => apiClient.post(`/subscriptions/${businessId}/contact-sales`, data),
  schedulePlanChange: (businessId, targetPlanCode) => apiClient.post(`/subscriptions/${businessId}/schedule-change`, { targetPlanCode }),
  cancelScheduledChange: (businessId) => apiClient.post(`/subscriptions/${businessId}/cancel-scheduled-change`),
};


export const customerApi = {
  create: (data) => apiClient.post('/customers', data),
  list: (params) => apiClient.get('/customers', { params }),
  getById: (id) => apiClient.get(`/customers/${id}`),
  update: (id, data) => apiClient.patch(`/customers/${id}`, data),
  archive: (id) => apiClient.patch(`/customers/${id}/archive`),
  delete: (id) => apiClient.delete(`/customers/${id}`),
};

export const enquiryApi = {
  create: (data) => apiClient.post('/enquiries', data),
  list: (params) => apiClient.get('/enquiries', { params }),
  getById: (id) => apiClient.get(`/enquiries/${id}`),
  update: (id, data) => apiClient.patch(`/enquiries/${id}`, data),
  addActivity: (id, data) => apiClient.post(`/enquiries/${id}/activities`, data),
  getFollowUps: (params) => apiClient.get('/enquiries/follow-ups', { params }),
  completeFollowUp: (id, data) => apiClient.post(`/enquiries/${id}/complete-follow-up`, data),
  convert: (id, data) => apiClient.post(`/enquiries/${id}/convert`, data),
  getFormConfig: () => apiClient.get('/enquiries/form-config'),
  saveFormConfig: (data) => apiClient.put('/enquiries/form-config', data),
  setFormStatus: (data) => apiClient.patch('/enquiries/form-config/status', data),
};

export const publicFormApi = {
  getFormBySlug: (slug) => apiClient.get(`/public/forms/${slug}`),
  getAvailability: (slug, params = {}) => apiClient.get(`/public/forms/${slug}/availability`, { params }),
  getConsultationSlots: (slug, date) => apiClient.get(`/public/forms/${slug}/consultation-slots`, { params: { date } }),
  submitForm: (slug, data) => apiClient.post(`/public/forms/${slug}/submit`, data),
};

export const publicWebsiteApi = {
  getWebsite: (slug, params = {}) => apiClient.get(`/public/websites/${slug}`, { params }),
  getAvailability: (slug, params = {}) => apiClient.get(`/public/websites/${slug}/availability`, { params }),
  getConsultationSlots: (slug, date) => apiClient.get(`/public/websites/${slug}/consultation-slots`, { params: { date } }),
  getServices: (slug, params = {}) => apiClient.get(`/public/websites/${slug}/services`, { params }),
  getPackages: (slug, params = {}) => apiClient.get(`/public/websites/${slug}/packages`, { params }),
  getPortfolio: (slug, params = {}) => apiClient.get(`/public/websites/${slug}/portfolio`, { params }),
  getFooter: (slug, params = {}) => apiClient.get(`/public/websites/${slug}/footer`, { params }),
  submitEnquiry: (slug, data) => apiClient.post(`/public/websites/${slug}/enquiries`, data),
  submitConsultation: (slug, data) => apiClient.post(`/public/websites/${slug}/consultation-requests`, data),
};

export const bookingApi = {
  getStats: () => apiClient.get('/bookings/stats'),
  create: (data) => apiClient.post('/bookings', data),
  list: (params) => apiClient.get('/bookings', { params }),
  getById: (id) => apiClient.get(`/bookings/${id}`),
  update: (id, data) => apiClient.patch(`/bookings/${id}`, data),
  updateStatus: (id, data) => apiClient.patch(`/bookings/${id}/status`, data),
  addEvent: (id, data) => apiClient.post(`/bookings/${id}/events`, data),
  getCalendar: (params) => apiClient.get('/bookings/calendar', { params }),
  cancel: (id, data) => apiClient.post(`/bookings/${id}/cancel`, data),
  getPayments: (id) => apiClient.get(`/bookings/${id}/payments`),
};

export const serviceApi = {
  create: (data) => apiClient.post('/services', data),
  list: (params) => apiClient.get('/services', { params }),
  getById: (id) => apiClient.get(`/services/${id}`),
  update: (id, data) => apiClient.patch(`/services/${id}`, data),
  archive: (id) => apiClient.patch(`/services/${id}/archive`),
  delete: (id) => apiClient.delete(`/services/${id}`),
};

export const packageApi = {
  create: (data) => apiClient.post('/packages', data),
  list: (params) => apiClient.get('/packages', { params }),
  getById: (id) => apiClient.get(`/packages/${id}`),
  update: (id, data) => apiClient.patch(`/packages/${id}`, data),
  archive: (id) => apiClient.patch(`/packages/${id}/archive`),
  delete: (id) => apiClient.delete(`/packages/${id}`),
  addService: (id, data) => apiClient.post(`/packages/${id}/services`, data),
  removeService: (id, serviceId) => apiClient.delete(`/packages/${id}/services/${serviceId}`),
};

export const quotationApi = {
  create: (data) => apiClient.post('/quotations', data),
  list: (params) => apiClient.get('/quotations', { params }),
  getById: (id) => apiClient.get(`/quotations/${id}`),
  update: (id, data) => apiClient.patch(`/quotations/${id}`, data),
  updateStatus: (id, data) => apiClient.patch(`/quotations/${id}/status`, data),
  convertToBooking: (id, data) => apiClient.post(`/quotations/${id}/convert-to-booking`, data),
  delete: (id) => apiClient.delete(`/quotations/${id}`),
};

export const consultationApi = {
  schedule: (data) => apiClient.post('/consultations', data),
  list: (params) => apiClient.get('/consultations', { params }),
  getStats: () => apiClient.get('/consultations/stats'),
  getById: (id) => apiClient.get(`/consultations/${id}`),
  update: (id, data) => apiClient.patch(`/consultations/${id}`, data),
  updateStatus: (id, data) => apiClient.patch(`/consultations/${id}/status`, data),
  cancel: (id, data) => apiClient.patch(`/consultations/${id}/cancel`, data),
  getCalendar: (params) => apiClient.get('/consultations/calendar', { params }),
  getUpcoming: (params) => apiClient.get('/consultations/upcoming', { params }),
  recordOutcome: (id, data) => apiClient.post(`/consultations/${id}/outcome`, data),
  getOutcomes: (params) => apiClient.get('/consultations/outcomes', { params }),
};

export const paymentApi = {
  create: (data) => apiClient.post('/payments', data),
  list: (params) => apiClient.get('/payments', { params }),
  getMetrics: (params) => apiClient.get('/payments/metrics', { params }),
  getById: (id) => apiClient.get(`/payments/${id}`),
  getReceipt: (id) => apiClient.get(`/payments/${id}/receipt`),
  refund: (id, data) => apiClient.post(`/payments/${id}/refund`, data),
  recordRefund: (data) => apiClient.post('/payments/refund', data),
  getRefundEligibility: (bookingId) => apiClient.get(`/payments/refund-eligibility/${bookingId}`),
  approveRefund: (bookingId, data) => apiClient.post(`/payments/bookings/${bookingId}/approve-refund`, data),
};

export const expenseApi = {
  create: (data) => apiClient.post('/expenses', data),
  list: (params) => apiClient.get('/expenses', { params }),
  getById: (id) => apiClient.get(`/expenses/${id}`),
  update: (id, data) => apiClient.patch(`/expenses/${id}`, data),
  archive: (id) => apiClient.patch(`/expenses/${id}/archive`),
  delete: (id) => apiClient.delete(`/expenses/${id}`),
  getCategories: () => apiClient.get('/expenses/categories'),
  getSummary: (params) => apiClient.get('/expenses/summary', { params }),
};

export const inventoryApi = {
  create: (data) => apiClient.post('/inventory', data),
  list: (params) => apiClient.get('/inventory', { params }),
  getById: (id) => apiClient.get(`/inventory/${id}`),
  update: (id, data) => apiClient.patch(`/inventory/${id}`, data),
  stockIn: (id, data) => apiClient.post(`/inventory/${id}/stock-in`, data),
  stockOut: (id, data) => apiClient.post(`/inventory/${id}/stock-out`, data),
  adjust: (id, data) => apiClient.post(`/inventory/${id}/adjustments`, data),
  getLowStock: () => apiClient.get('/inventory/low-stock'),
  getSummary: () => apiClient.get('/inventory/summary'),
  getMovements: (id) => apiClient.get(`/inventory/${id}/movements`),
  archive: (id) => apiClient.patch(`/inventory/${id}/archive`),
  delete: (id) => apiClient.delete(`/inventory/${id}`),
};

export const reportApi = {
  getFinancialReport: (params) => apiClient.get('/reports/financial', { params }),
};

export const dashboardApi = {
  getOverview: (params) => apiClient.get('/dashboard/overview', { params }),
  getRevenue: (params) => apiClient.get('/dashboard/revenue', { params }),
  getBookings: (params) => apiClient.get('/dashboard/bookings', { params }),
  getEnquiries: (params) => apiClient.get('/dashboard/enquiries', { params }),
  getPayments: (params) => apiClient.get('/dashboard/payments', { params }),
  getExpenses: (params) => apiClient.get('/dashboard/expenses', { params }),
  getInventory: (params) => apiClient.get('/dashboard/inventory', { params }),
  getRecentActivities: (params) => apiClient.get('/dashboard/recent-activities', { params }),
};

export const websiteApi = {
  getWebsite: (businessId) => apiClient.get(`/websites/${businessId}`),
  saveWebsite: (data) => apiClient.post('/websites', data),
  updateWebsite: (id, data) => apiClient.patch(`/websites/${id}`, data),
  publishWebsite: (id) => apiClient.patch(`/websites/${id}/publish`),
  unpublishWebsite: (id) => apiClient.patch(`/websites/${id}/unpublish`),
  previewWebsite: (businessId) => apiClient.get(`/websites/${businessId}/preview`),
  getHours: (businessId) => apiClient.get(`/websites/${businessId}/hours`),
  updateHours: (businessId, hours) => apiClient.put(`/websites/${businessId}/hours`, { hours }),
  getAbout: (businessId) => apiClient.get(`/websites/${businessId}/about`),
  saveAbout: (businessId, data) => apiClient.post(`/websites/${businessId}/about`, data),
  getFooter: (businessId) => apiClient.get(`/websites/${businessId}/footer`),
  saveFooter: (businessId, data) => apiClient.put(`/websites/${businessId}/footer`, data),
};

export const portfolioApi = {
  create: (data) => apiClient.post('/portfolio', data),
  list: (params) => apiClient.get('/portfolio', { params }),
  getById: (id) => apiClient.get(`/portfolio/${id}`),
  update: (id, data) => apiClient.patch(`/portfolio/${id}`, data),
  publish: (id) => apiClient.patch(`/portfolio/${id}/publish`),
  archive: (id) => apiClient.patch(`/portfolio/${id}/archive`),
  delete: (id) => apiClient.delete(`/portfolio/${id}`),
};

export const notificationApi = {
  getSummary: () => apiClient.get('/notifications/summary'),
  getPreferences: () => apiClient.get('/notifications/preferences'),
  updatePreferences: (data) => apiClient.patch('/notifications/preferences', data),
  list: (params) => apiClient.get('/notifications', { params }),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch('/notifications/read-all'),
  retry: (id) => apiClient.post(`/notifications/${id}/retry`),
  processQueue: () => apiClient.post('/notifications/process-queue'),
};

export const campaignApi = {
  list: (params) => apiClient.get('/campaigns', { params }),
  getById: (id) => apiClient.get(`/campaigns/${id}`),
  getAudienceCount: (params) => apiClient.get('/campaigns/audience-count', { params }),
  create: (data) => apiClient.post('/campaigns', data),
  update: (id, data) => apiClient.put(`/campaigns/${id}`, data),
  sendTest: (id, data) => apiClient.post(`/campaigns/${id}/test`, data),
  launch: (id) => apiClient.post(`/campaigns/${id}/launch`),
  cancel: (id) => apiClient.post(`/campaigns/${id}/cancel`),
  delete: (id) => apiClient.delete(`/campaigns/${id}`),
  previewWhatsApp: (data) => apiClient.post('/campaigns/whatsapp-preview', data),
  sendWhatsApp: (data) => apiClient.post('/campaigns/whatsapp-send', data),
  testWhatsAppTemplate: (data) => apiClient.post('/campaigns/whatsapp-test-template', data),
  getWhatsAppTemplates: () => apiClient.get('/campaigns/whatsapp-templates'),
};

export const whatsappBillingApi = {
  getConfig: () => apiClient.get('/whatsapp-billing/config'),
  getPricingRules: (countryCode = 'IN') => apiClient.get(`/whatsapp-billing/pricing-rules?country_code=${countryCode}`),
  getWallet: () => apiClient.get('/whatsapp-billing/wallet'),
  createTopupOrder: (amount_rupees) => apiClient.post('/whatsapp-billing/topup-order', { amount_rupees }),
  verifyTopup: (payload) => apiClient.post('/whatsapp-billing/verify-topup', payload),
  estimateCampaign: (data) => apiClient.post('/whatsapp-billing/estimate-campaign', data),
};



