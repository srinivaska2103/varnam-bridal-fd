import { apiClient } from '@/services/api/client';
import { websiteApi, portfolioApi, subscriptionApi } from '@/services/api/modules';

/**
 * Website & Portfolio service module
 */
export const websiteService = {
  // Subscription entitlements
  getSubscriptionFeatures: async (businessId) => {
    const res = await subscriptionApi.getFeatures(businessId);
    return res.data;
  },

  getAllPlans: async () => {
    const res = await subscriptionApi.getPlans();
    return res.data;
  },

  createCheckout: async (businessId, planCode, returnUrl) => {
    const res = await subscriptionApi.createCheckout(businessId, planCode, returnUrl);
    return res.data;
  },

  verifyPayment: async (businessId, payload) => {
    const res = await subscriptionApi.verifyPayment(businessId, payload);
    return res.data;
  },

  getPaymentHistory: async (businessId) => {
    const res = await subscriptionApi.getPaymentHistory(businessId);
    return res.data;
  },

  getMySubscriptions: async () => {
    const res = await subscriptionApi.getMySubscription();
    return res.data;
  },

  cancelSubscription: async (businessId, reason) => {
    const res = await subscriptionApi.cancelSubscription(businessId, reason);
    return res.data;
  },

  reactivateSubscription: async (businessId) => {
    const res = await subscriptionApi.reactivateSubscription(businessId);
    return res.data;
  },

  updateAutoRenewal: async (businessId, autoRenew) => {
    const res = await subscriptionApi.updateAutoRenewal(businessId, autoRenew);
    return res.data;
  },

  submitContactSales: async (businessId, data) => {
    const res = await subscriptionApi.submitContactSales(businessId, data);
    return res.data;
  },

  schedulePlanChange: async (businessId, targetPlanCode) => {
    const res = await subscriptionApi.schedulePlanChange(businessId, targetPlanCode);
    return res.data;
  },

  cancelScheduledChange: async (businessId) => {
    const res = await subscriptionApi.cancelScheduledChange(businessId);
    return res.data;
  },


  // Website settings & preview
  getWebsite: async (businessId) => {
    const res = await websiteApi.getWebsite(businessId);
    return res.data;
  },

  saveWebsite: async (data) => {
    const res = await websiteApi.saveWebsite(data);
    return res.data;
  },

  updateWebsite: async (businessId, data) => {
    const res = await websiteApi.updateWebsite(businessId, data);
    return res.data;
  },

  publishWebsite: async (businessId) => {
    const res = await websiteApi.publishWebsite(businessId);
    return res.data;
  },

  unpublishWebsite: async (businessId) => {
    const res = await websiteApi.unpublishWebsite(businessId);
    return res.data;
  },

  previewWebsite: async (businessId) => {
    const res = await websiteApi.previewWebsite(businessId);
    return res.data;
  },

  // Studio Business Hours
  getBusinessHours: async (businessId) => {
    const res = await websiteApi.getHours(businessId);
    return res.data;
  },

  updateBusinessHours: async (businessId, hours) => {
    const res = await websiteApi.updateHours(businessId, hours);
    return res.data;
  },

  // Studio About Section
  getStudioAbout: async (businessId) => {
    const res = await websiteApi.getAbout(businessId);
    return res?.data ?? null;
  },

  saveStudioAbout: async (businessId, data) => {
    const res = await websiteApi.saveAbout(businessId, data);
    return res.data;
  },

  // Website Footer Settings
  getFooterSettings: async (businessId) => {
    const res = await websiteApi.getFooter(businessId);
    return res?.data ?? null;
  },

  saveFooterSettings: async (businessId, data) => {
    const res = await websiteApi.saveFooter(businessId, data);
    return res.data;
  },

  // Portfolio items
  listPortfolio: async (params) => {
    const res = await portfolioApi.list(params);
    return res.data;
  },

  createPortfolioItem: async (data) => {
    const res = await portfolioApi.create(data);
    return res.data;
  },

  updatePortfolioItem: async (id, data) => {
    const res = await portfolioApi.update(id, data);
    return res.data;
  },

  publishPortfolioItem: async (id) => {
    const res = await portfolioApi.publish(id);
    return res.data;
  },

  archivePortfolioItem: async (id) => {
    const res = await portfolioApi.archive(id);
    return res.data;
  },

  deletePortfolioItem: async (id) => {
    const res = await portfolioApi.delete(id);
    return res.data;
  },
};
