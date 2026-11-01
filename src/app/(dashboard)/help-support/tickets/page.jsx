'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { supportApi } from '@/services/supportApi';
import { ModernDropdown } from '@/components/ui';
import {
  ArrowLeft,
  LifeBuoy,
  PlusCircle,
  Search,
  Filter,
  ChevronRight,
  Clock,
  MessageSquare,
  FileQuestion,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open', badgeColor: 'bg-blue-500' },
  { value: 'IN_PROGRESS', label: 'In Progress', badgeColor: 'bg-amber-500' },
  { value: 'WAITING_FOR_USER', label: 'Waiting for You', badgeColor: 'bg-purple-500' },
  { value: 'RESOLVED', label: 'Resolved', badgeColor: 'bg-emerald-500' },
  { value: 'CLOSED', label: 'Closed', badgeColor: 'bg-stone-500' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'LOW', label: 'Low', badgeColor: 'bg-stone-400' },
  { value: 'MEDIUM', label: 'Medium', badgeColor: 'bg-amber-500' },
  { value: 'HIGH', label: 'High', badgeColor: 'bg-orange-600' },
  { value: 'CRITICAL', label: 'Critical', badgeColor: 'bg-rose-600' },
];

export default function UserTicketsListPage() {
  const params = useParams();
  const pathname = usePathname();
  const studioSlug = params?.businessSlug;
  const isUserPortal = pathname?.includes('/user/');
  const basePath = studioSlug ? (isUserPortal ? `/${studioSlug}/user/help-support` : `/${studioSlug}/admin/help-support`) : '/help-support';

  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: ticketsRes, isLoading } = useQuery({
    queryKey: ['user-support-tickets-full', statusFilter, priorityFilter, search],
    queryFn: () =>
      supportApi.getUserTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: search || undefined,
        limit: 50,
      }),
  });
  const tickets = ticketsRes?.data || [];

  return (
    <div className="min-h-screen bg-[#FFFBF7] pb-24 -m-3 sm:-m-6 lg:-m-8 font-sans text-stone-900">
      {/* Header */}
      <div className="bg-white border-b border-stone-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href={basePath}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#FF6B00]" />
            <span>Help Center</span>
          </Link>

          <Link
            href={`${basePath}/raise-ticket`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#FF6B00] to-[#EA580C] hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Raise New Ticket</span>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
              <LifeBuoy className="w-6 h-6 text-[#FF6B00]" />
              My Support Tickets
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Review resolution status, ticket history, and replies from the VARNAM technical support team.
            </p>
          </div>
        </div>

        {/* Filters & Search with ModernDropdown */}
        <div className="bg-white rounded-3xl p-4 border border-stone-200/90 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between relative z-30">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket # or subject..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#FFFBF7] border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="w-full sm:w-44">
              <ModernDropdown
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={STATUS_OPTIONS}
                placeholder="All Statuses"
                buttonClassName="bg-[#FFFBF7] py-2.5 rounded-xl border-stone-200"
              />
            </div>

            <div className="w-full sm:w-44">
              <ModernDropdown
                value={priorityFilter}
                onChange={(val) => setPriorityFilter(val)}
                options={PRIORITY_OPTIONS}
                placeholder="All Priorities"
                buttonClassName="bg-[#FFFBF7] py-2.5 rounded-xl border-stone-200"
              />
            </div>
          </div>
        </div>

        {/* Tickets Table / List */}
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden relative z-10">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-stone-400">Loading your tickets...</div>
          ) : tickets.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {tickets.map((t) => (
                <Link
                  key={t.id}
                  href={`${basePath}/tickets/${t.id}`}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-orange-50/50 transition-all group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-orange-700 bg-orange-100/90 px-2 py-0.5 rounded-md">
                        #{t.ticket_number}
                      </span>
                      <h3 className="font-bold text-sm text-stone-900 group-hover:text-[#FF6B00] transition-colors">
                        {t.subject}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                      <span>Category: <strong className="text-stone-700">{t.category}</strong></span>
                      <span>&bull;</span>
                      <span>Module: <strong className="text-stone-700">{t.related_module || 'General'}</strong></span>
                      <span>&bull;</span>
                      <span>Created {new Date(t.created_at).toLocaleDateString()}</span>
                    </div>

                    {t.support_ticket_messages?.[0] && (
                      <p className="text-xs text-stone-500 line-clamp-1 pt-1 italic font-normal">
                        Last reply: {t.support_ticket_messages[0].message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border shadow-2xs ${
                        t.status === 'RESOLVED' || t.status === 'CLOSED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : t.status === 'WAITING_FOR_USER'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {t.status.replace(/_/g, ' ')}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        t.priority === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : t.priority === 'HIGH'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {t.priority}
                    </span>

                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center space-y-3">
              <FileQuestion className="w-10 h-10 text-stone-400 mx-auto" />
              <h3 className="font-bold text-sm text-stone-800">No support tickets found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                No tickets match your filter criteria or you have not submitted any inquiries yet.
              </p>
              <Link
                href={`${basePath}/raise-ticket`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF6B00] text-white text-xs font-bold rounded-xl shadow-md hover:bg-orange-700"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Submit Ticket</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
