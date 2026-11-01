'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Info,
  Clock,
  ExternalLink,
  ShieldCheck,
  IndianRupee,
} from 'lucide-react';
import { whatsappBillingApi } from '@/services/api/modules';
import { useToast } from '@/components/ui/Toast';
import { Button, Card, Badge, LoadingSpinner } from '@/components/ui';

// Load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export function WhatsAppWalletCard() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [selectedTopupAmount, setSelectedTopupAmount] = useState(250);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // 1. Fetch Studio Wallet
  const {
    data: walletData,
    isLoading: isWalletLoading,
    refetch: refetchWallet,
  } = useQuery({
    queryKey: ['whatsapp-wallet'],
    queryFn: () => whatsappBillingApi.getWallet(),
  });

  const wallet = walletData?.data?.account || {
    balance_rupees: 0,
    reserved_rupees: 0,
    available_rupees: 0,
    lifetime_purchased_rupees: 0,
    lifetime_spent_rupees: 0,
    is_locked: false,
  };

  const transactions = walletData?.data?.transactions || [];

  // Top-up Order Mutation
  const handleTopup = async () => {
    const finalAmount = customAmount ? parseFloat(customAmount) : selectedTopupAmount;
    if (!finalAmount || isNaN(finalAmount) || finalAmount < 10) {
      addToast({
        title: 'Invalid Amount',
        description: 'Minimum top-up amount is ₹10.',
        variant: 'danger',
      });
      return;
    }

    setIsProcessingPayment(true);
    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || typeof window === 'undefined' || !window.Razorpay) {
        throw new Error('Could not load Razorpay payment gateway. Please check your connection.');
      }

      // Create Order on Backend
      const orderRes = await whatsappBillingApi.createTopupOrder(finalAmount);
      const order = orderRes.data;

      // Open Razorpay Checkout Modal
      const options = {
        key: order.key_id,
        amount: order.amount_paise,
        currency: order.currency || 'INR',
        name: 'VARNAM Bridal Software',
        description: `WhatsApp Messaging Credits (₹${finalAmount})`,
        order_id: order.order_id.startsWith('order_mock') ? undefined : order.order_id,
        handler: async (response) => {
          try {
            // Verify and Credit Wallet Atomically
            const verifyRes = await whatsappBillingApi.verifyTopup({
              razorpay_order_id: response.razorpay_order_id || order.order_id,
              razorpay_payment_id: response.razorpay_payment_id || `pay_mock_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || 'mock_sig',
              amount_rupees: finalAmount,
            });

            addToast({
              title: 'Credits Added Successfully!',
              description: verifyRes.data?.message || `₹${finalAmount} credited to your messaging wallet.`,
              variant: 'success',
            });

            queryClient.invalidateQueries({ queryKey: ['whatsapp-wallet'] });
            setIsTopupModalOpen(false);
            setCustomAmount('');
          } catch (verErr) {
            addToast({
              title: 'Verification Failed',
              description: verErr?.response?.data?.message || verErr.message,
              variant: 'danger',
            });
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: order.customer_name,
          email: order.customer_email,
          contact: order.customer_phone,
        },
        theme: {
          color: '#10B981', // Emerald theme for WhatsApp Credits
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setIsProcessingPayment(false);
        addToast({
          title: 'Payment Failed',
          description: resp.error?.description || 'Payment was unsuccessful.',
          variant: 'danger',
        });
      });
      rzp.open();
    } catch (err) {
      setIsProcessingPayment(false);
      addToast({
        title: 'Checkout Error',
        description: err?.response?.data?.message || err.message || 'Failed to initiate credit top-up',
        variant: 'danger',
      });
    }
  };

  return (
    <>
      {/* Wallet Balance Strip */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 text-white rounded-2xl p-5 shadow-sm border border-emerald-800/40 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">
                WhatsApp Messaging Wallet
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Pay-As-You-Use
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-white">
                ₹{wallet.available_rupees.toFixed(2)}
              </span>
              <span className="text-xs text-stone-300">Available Credits</span>
            </div>
          </div>
        </div>

        {/* Sub metrics: Reserved & Lifetime */}
        <div className="flex items-center gap-6 text-xs text-stone-300 border-t md:border-t-0 md:border-l border-emerald-800/60 pt-3 md:pt-0 md:pl-6">
          <div>
            <div className="text-[10px] uppercase text-stone-400">Reserved</div>
            <div className="font-semibold text-amber-300">
              ₹{wallet.reserved_rupees.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-stone-400">Total Spent</div>
            <div className="font-semibold text-white">
              ₹{wallet.lifetime_spent_rupees.toFixed(2)}
            </div>
          </div>

          <Button
            onClick={() => setIsTopupModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 ml-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Credits
          </Button>
        </div>
      </div>

      {/* Top-up Modal */}
      {isTopupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Top Up WhatsApp Credits</h3>
                  <p className="text-xs text-stone-500">Instant prepaid messaging balance</p>
                </div>
              </div>
              <button
                onClick={() => setIsTopupModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Amount Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 block">
                Select Recharge Amount
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 50, 100, 250].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setSelectedTopupAmount(amt);
                      setCustomAmount('');
                    }}
                    className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border ${
                      !customAmount && selectedTopupAmount === amt
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-stone-50/50'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <label className="text-xs font-semibold text-stone-600 block mb-1">
                Or enter custom amount (₹)
              </label>
              <input
                type="number"
                min="10"
                max="50000"
                placeholder="e.g. 10"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full text-sm font-semibold px-3 py-2 border border-stone-200 rounded-xl focus:outline-hidden focus:border-emerald-500"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">Min ₹10 • Max ₹50,000</span>
            </div>

            {/* Pricing details note */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs text-stone-600 space-y-1">
              <div className="flex items-center justify-between text-stone-700 font-semibold">
                <span>Official Rate Card (India):</span>
                <span>Includes 18% GST</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-stone-500">
                <span>• Broadcast Marketing:</span>
                <span>~₹0.92 / delivered message</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-stone-500">
                <span>• Booking & Reminders Utility:</span>
                <span>~₹0.14 / delivered message</span>
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="flex items-center gap-2 text-[11px] text-stone-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Secured by Razorpay • Instant Wallet Credit</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
              <Button
                variant="outline"
                onClick={() => setIsTopupModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleTopup}
                disabled={isProcessingPayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay ₹{customAmount || selectedTopupAmount} via Secure Pay
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

