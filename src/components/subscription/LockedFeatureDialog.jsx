'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, Sparkles, ArrowRight, ShieldAlert, PhoneCall } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { PLAN_TIERS } from '@/lib/feature-access';

export function LockedFeatureDialog({
  isOpen,
  onClose,
  featureTitle,
  featureDescription,
  requiredTier,
  requiredPlanName,
  onContactSales,
}) {
  const isPremiumRequired = requiredTier === PLAN_TIERS.PREMIUM;
  const isGrowthRequired = requiredTier === PLAN_TIERS.GROWTH;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="md"
    >
      <div className="p-6 text-center space-y-5">
        {/* Lock Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200/80 text-[#EA580C] flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-7 h-7" />
        </div>

        {/* Feature & Reason */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
            <Sparkles className="w-3 h-3 text-[#EA580C]" />
            Requires {requiredPlanName || 'Upgraded Plan'}
          </div>

          <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">
            Unlock {featureTitle || 'This Feature'}
          </h3>

          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            {featureDescription ||
              `This capability is available in the ${requiredPlanName || 'higher tier'} plan. Upgrade now to streamline your bridal makeup studio operations.`}
          </p>
        </div>

        {/* Key Highlight Card */}
        <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-100 text-left text-xs text-stone-700 space-y-1.5">
          <div className="font-bold text-orange-900 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-[#EA580C]" />
            What you get when you upgrade:
          </div>
          <ul className="text-[11px] text-stone-600 space-y-1 pl-5 list-disc">
            {isPremiumRequired ? (
              <>
                <li>Branded business website on your own custom domain</li>
                <li>Dedicated cloud hosting server & SSL certificate</li>
                <li>1 year of included domain registration & server hosting</li>
              </>
            ) : isGrowthRequired ? (
              <>
                <li>Public branded website with online portfolio gallery</li>
                <li>Public service and package enquiry capture form</li>
                <li>Shareable direct booking and enquiry links for social media</li>
              </>
            ) : (
              <>
                <li>Client management, calendar bookings, and quotations</li>
                <li>Financial tracking, expenses, and analytics</li>
                <li>Automated client notifications and custom enquiry forms</li>
              </>
            )}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            className="w-full sm:w-auto text-xs font-semibold py-2.5 px-4 rounded-xl cursor-pointer"
          >
            Cancel
          </Button>

          {isPremiumRequired ? (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                if (onContactSales) onContactSales();
              }}
              className="w-full sm:w-auto text-xs font-bold py-2.5 px-5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Contact Sales (₹29,999)
            </Button>
          ) : (
            <Link href="/subscription" onClick={onClose} className="w-full sm:w-auto">
              <Button
                variant="primary"
                className="w-full text-xs font-bold py-2.5 px-5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>View Subscription Plans</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Modal>
  );
}
