'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Card, PageHeader, Badge, Button } from '@/components/ui';
import { User, Shield, ArrowLeft } from 'lucide-react';

export default function AccountSettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Settings"
        subtitle="Manage your personal profile, credentials and login security"
        action={
          <Link href="/settings">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              Business Settings
            </Button>
          </Link>
        }
      />

      <div className="max-w-2xl">
        <Card title="User Profile" subtitle="Your credentials and access role">
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-stone-400 block mb-0.5">Full Name:</span>
              <span className="text-sm font-semibold text-stone-900">{user?.name || 'Studio User'}</span>
            </div>
            <div>
              <span className="text-stone-400 block mb-0.5">Email Address:</span>
              <span className="text-sm font-medium text-stone-800">{user?.email || '—'}</span>
            </div>
            <div>
              <span className="text-stone-400 block mb-1">Account Status:</span>
              <Badge variant="success">Active & Verified</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
