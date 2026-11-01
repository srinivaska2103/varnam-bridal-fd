'use client';

import React, { useState } from 'react';
import { Mail, Phone, Building2, User, Send, CheckCircle2, X } from 'lucide-react';
import { Modal, Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { websiteService } from '@/services/website';
import { useToast } from '@/components/ui/Toast';

export function ContactSalesModal({ isOpen, onClose }) {
  const { currentBusiness, user } = useAuthStore();
  const businessId = currentBusiness?.id || currentBusiness?.business_id;
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    businessName: currentBusiness?.name || '',
    contactName: user?.name || '',
    email: user?.email || '',
    phone: currentBusiness?.business_phone || '',
    requirements: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.contactName || !formData.email || !formData.phone) {
      addToast({
        title: 'Missing Fields',
        description: 'Please fill in your name, email, and phone number.',
        variant: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await websiteService.submitContactSales(businessId, {
        ...formData,
        planCode: 'EXCLUSIVE_LIFETIME',
      });
      setSubmitted(true);
      addToast({
        title: 'Enquiry Received!',
        description: 'Our team will contact you shortly to coordinate your Premium onboarding.',
        variant: 'success',
      });
    } catch (err) {
      addToast({
        title: 'Submission Failed',
        description: err?.response?.data?.message || err?.message || 'Could not submit your enquiry. Please try again.',
        variant: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title=""
      size="md"
    >
      <div className="p-6">
        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">Enquiry Submitted Successfully</h3>
              <p className="text-xs text-stone-600 mt-2 max-w-sm mx-auto leading-relaxed">
                Thank you for choosing VEXA TECH Premium (₹29,999). Our enterprise deployment specialist will contact you directly within 24 hours to configure your custom domain and dedicated cloud hosting.
              </p>
            </div>
            <div className="pt-4">
              <Button
                variant="primary"
                onClick={handleClose}
                className="w-full bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                  Premium Package
                </span>
                <span className="text-xs font-semibold text-stone-400">• ₹29,999 one-time</span>
              </div>
              <h3 className="text-lg font-bold text-stone-900 mt-1">Contact Sales</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Speak directly with our team to set up your branded studio website, custom domain, and dedicated server.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Studio / Business Name</label>
                <Input
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g. Elegance Bridal Studio"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Contact Person</label>
                <Input
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="priya@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9876543210"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Specific Requirements or Message</label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={3}
                  className="w-full text-xs rounded-xl border border-stone-200 p-2.5 focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-all outline-hidden text-stone-800"
                  placeholder="Tell us about your desired domain name or website design preferences..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                className="text-xs font-semibold py-2 px-4 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="text-xs font-bold py-2 px-5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Enquiry
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
