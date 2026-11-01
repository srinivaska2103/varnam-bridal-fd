/**
 * VARNAM - Payment Service Module
 * Handles manual payment records, receipt retrieval, metrics, and refund operations.
 */
import { paymentApi } from './api/modules';

export const paymentService = {
  /**
   * List payments with optional filters (search, status, method, booking_id, customer_id, startDate, endDate, page, limit)
   */
  async getPayments(params = {}) {
    const response = await paymentApi.list(params);
    return response.data;
  },

  /**
   * Get payment summary metrics (total collected, today's collection, advance, outstanding balance)
   */
  async getPaymentMetrics(params = {}) {
    const response = await paymentApi.getMetrics(params);
    return response.data;
  },

  /**
   * Get single payment record with booking and customer relations
   */
  async getPaymentById(id) {
    const response = await paymentApi.getById(id);
    return response.data;
  },

  /**
   * Record a new manual payment
   */
  async recordPayment(payload) {
    const response = await paymentApi.create(payload);
    return response.data;
  },

  /**
   * Get official printable receipt data
   */
  async getPaymentReceipt(id) {
    const response = await paymentApi.getReceipt(id);
    return response.data;
  },

  /**
   * Process full or partial refund for a payment
   */
  async refundPayment(id, payload) {
    const response = await paymentApi.refund(id, payload);
    return response.data;
  },
};

export default paymentService;
