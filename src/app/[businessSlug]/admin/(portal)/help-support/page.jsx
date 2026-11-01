'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { supportApi } from '@/services/supportApi';
import {
  Search,
  HelpCircle,
  LifeBuoy,
  MessageSquare,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Compass,
  Inbox,
  Calendar,
  CalendarCheck,
  CreditCard,
  Globe,
  ShieldCheck,
  ChevronRight,
  PlusCircle,
  FileQuestion,
  Headphones,
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,
  PhoneCall,
  Zap,
} from 'lucide-react';

const CATEGORY_ICON_MAP = {
  Compass: Compass,
  Inbox: Inbox,
  Calendar: Calendar,
  Sparkles: Sparkles,
  CalendarCheck: CalendarCheck,
  CreditCard: CreditCard,
  MessageSquare: MessageSquare,
  Globe: Globe,
  ShieldCheck: ShieldCheck,
};

export default function HelpSupportPage() {
  const params = useParams();
  const pathname = usePathname();
  const studioSlug = params?.businessSlug;
  const isUserPortal = pathname?.includes('/user/');
  const basePath = studioSlug ? (isUserPortal ? `/${studioSlug}/user/help-support` : `/${studioSlug}/admin/help-support`) : '/help-support';

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // 1. Fetch categories
  const { data: categoriesRes, isLoading: loadingCategories } = useQuery({
    queryKey: ['help-categories'],
    queryFn: () => supportApi.getCategories(),
  });
  const categories = categoriesRes?.data || [];

  // 2. Fetch articles (with search filter)
  const { data: articlesRes, isLoading: loadingArticles } = useQuery({
    queryKey: ['help-articles', searchQuery, selectedCategory],
    queryFn: () =>
      supportApi.getArticles({
        search: searchQuery,
        category: selectedCategory,
        limit: 30,
      }),
  });
  const articles = articlesRes?.data || [];

  // 3. Fetch user's recent tickets
  const { data: ticketsRes } = useQuery({
    queryKey: ['user-support-tickets-recent'],
    queryFn: () => supportApi.getUserTickets({ limit: 5 }),
  });
  const recentTickets = ticketsRes?.data || [];

  return (
    <div className="min-h-screen bg-[#FFFBF7] pb-24 font-sans text-stone-900 -m-3 sm:-m-6 lg:-m-8">
      {/* Modern Gradient Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#EA580C] via-[#FF6B00] to-[#F97316] text-white px-4 sm:px-8 pt-12 pb-20 shadow-lg">
        {/* Decorative backdrop elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none transform translate-x-20 -translate-y-20" />
        <div className="absolute -bottom-16 left-12 w-80 h-80 bg-amber-300/20 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/20 hover:bg-white/25 backdrop-blur-md rounded-full text-xs font-bold text-white tracking-wider uppercase border border-white/25 shadow-sm transition-all">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>VARNAM Studio Concierge & Knowledge Base</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
            How can we help you?
          </h1>

          <p className="text-xs sm:text-base text-orange-50 max-w-2xl mx-auto leading-relaxed font-medium">
            Search step-by-step bridal workflows, explore tutorials, or connect directly with our dedicated VARNAM support team.
          </p>

          {/* Interactive Modern Search Bar */}
          <div className="pt-3 max-w-2xl mx-auto relative">
            <div className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-md border border-white/60 focus-within:ring-4 focus-within:ring-white/30 transition-all">
              <Search className="w-5 h-5 text-stone-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics (e.g. WhatsApp, reschedule, bridal package, website)..."
                className="w-full pl-12 pr-28 py-4 text-xs sm:text-sm text-stone-800 placeholder-stone-400 bg-transparent focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-24 text-xs font-bold text-stone-400 hover:text-stone-700 p-1"
                >
                  Clear
                </button>
              )}
              <Link
                href={`${basePath}/raise-ticket`}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 mr-2 bg-gradient-to-r from-[#FF6B00] to-[#EA580C] hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Ticket</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 relative z-20 space-y-10">
        {/* Modern Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => setSelectedCategory('getting-started')}
            className="group bg-white rounded-3xl p-5 border border-orange-100 shadow-sm hover:shadow-xl hover:border-orange-300 transition-all duration-200 cursor-pointer flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 flex items-center justify-center text-[#FF6B00] shrink-0 group-hover:scale-105 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-stone-900 text-sm group-hover:text-[#FF6B00] transition-colors">
                Getting Started Guide
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Step-by-step tutorials to set up studio hours, artist profile, and bridal packages.
              </p>
              <div className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-[#FF6B00] group-hover:translate-x-0.5 transition-transform">
                <span>Explore guide</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          <div
            onClick={() => setSelectedCategory('whatsapp-automation')}
            className="group bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-200 cursor-pointer flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-stone-900 text-sm group-hover:text-emerald-700 transition-colors">
                WhatsApp Concierge
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Learn how automatic client trial reminders and booking updates are delivered.
              </p>
              <div className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                <span>Learn WhatsApp</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>

          <Link
            href={`${basePath}/raise-ticket`}
            className="group bg-white rounded-3xl p-5 border border-amber-100 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all duration-200 flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-105 transition-transform">
              <Headphones className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-stone-900 text-sm group-hover:text-amber-700 transition-colors">
                Dedicated VARNAM Support
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Facing an issue? Submit a support ticket to get direct assistance from VARNAM technical specialists.
              </p>
              <div className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:translate-x-0.5 transition-transform">
                <span>Raise a ticket</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </Link>
        </div>

        {/* My Support Tickets Section */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-[#FF6B00]" />
                My Support Tickets
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Track status and chat with VARNAM support engineers regarding technical inquiries.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`${basePath}/tickets`}
                className="px-3.5 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-all"
              >
                View All Tickets
              </Link>
              <Link
                href={`${basePath}/raise-ticket`}
                className="px-4 py-2 bg-gradient-to-r from-[#FF6B00] to-[#EA580C] hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Ticket</span>
              </Link>
            </div>
          </div>

          {recentTickets.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {recentTickets.map((t) => (
                <Link
                  key={t.id}
                  href={`${basePath}/tickets/${t.id}`}
                  className="py-3.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-orange-50/60 rounded-2xl transition-all group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-orange-700 bg-orange-100/90 px-2 py-0.5 rounded-md">
                        #{t.ticket_number}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-[#FF6B00] transition-colors">
                        {t.subject}
                      </h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-stone-500">
                      <span>Category: <strong className="text-stone-700">{t.category}</strong></span>
                      <span>&bull;</span>
                      <span>Priority: <strong className={t.priority === 'CRITICAL' ? 'text-rose-600' : 'text-stone-700'}>{t.priority}</strong></span>
                      <span>&bull;</span>
                      <span>Updated {new Date(t.updated_at || t.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
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
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-4 bg-[#FFFBF7] rounded-2xl border border-dashed border-orange-200/80">
              <FileQuestion className="w-9 h-9 text-orange-400/80 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-stone-800">No active support tickets</h4>
              <p className="text-[11px] text-stone-500 mt-1 max-w-sm mx-auto">
                Everything looks running smoothly! If you ever encounter an issue or have a question, raise a ticket here.
              </p>
            </div>
          )}
        </div>

        {/* Categories Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-stone-900">Explore by Category</h2>
              <p className="text-xs text-stone-500">Browse detailed articles covering every module in VARNAM.</p>
            </div>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-xs font-bold text-[#FF6B00] hover:underline"
              >
                Show All Categories
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              const IconComp = CATEGORY_ICON_MAP[cat.icon] || BookOpen;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? null : cat.slug)}
                  className={`p-5 rounded-3xl text-left border transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-orange-50/90 border-orange-500 shadow-md ring-2 ring-orange-500/20'
                      : 'bg-white border-stone-200/80 hover:border-orange-300 hover:shadow-lg'
                  }`}
                >
                  <div className="space-y-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform ${
                        isSelected
                          ? 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-md'
                          : 'bg-orange-50 text-[#FF6B00]'
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">{cat.name}</h3>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold">
                    <span className="text-stone-400">
                      {cat._count?.help_articles || 0} articles
                    </span>
                    <span className={`inline-flex items-center gap-1 font-bold ${isSelected ? 'text-[#FF6B00]' : 'text-stone-600'}`}>
                      Explore <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Articles List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-stone-900">
              {searchQuery
                ? `Search Results for "${searchQuery}"`
                : selectedCategory
                ? `Articles in ${categories.find((c) => c.slug === selectedCategory)?.name || 'Category'}`
                : 'Popular Help Articles'}
            </h2>
            <span className="text-xs text-stone-500 font-semibold">{articles.length} articles</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {articles.map((art) => (
              <Link
                key={art.id}
                href={`${basePath}/article/${art.slug}`}
                className="bg-white rounded-3xl p-5 border border-stone-200/80 hover:border-orange-300 hover:shadow-lg transition-all duration-200 group flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200/60">
                    {art.help_categories?.name || 'General'}
                  </div>
                  <h3 className="font-bold text-sm text-stone-900 group-hover:text-[#FF6B00] transition-colors leading-snug">
                    {art.title}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {art.short_description}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                  <span>Updated {new Date(art.updated_at).toLocaleDateString()}</span>
                  <span className="text-[#FF6B00] font-bold inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Read article <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}

            {articles.length === 0 && (
              <div className="col-span-full bg-white rounded-3xl p-10 border border-stone-200 text-center space-y-3">
                <FileQuestion className="w-10 h-10 text-stone-400 mx-auto" />
                <h3 className="font-bold text-sm text-stone-800">No articles matched your search</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Try searching with different terms or submit a direct support ticket to the VARNAM engineering team.
                </p>
                <Link
                  href={`${basePath}/raise-ticket`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
                >
                  <Headphones className="w-4 h-4" />
                  <span>Contact VARNAM Support</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Modern FAQs Section */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-lg sm:text-xl font-extrabold text-stone-900">Frequently Asked Questions</h2>
            <p className="text-xs text-stone-500">Quick answers to common questions about VARNAM Bridal Software.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-5 bg-[#FFFBF7] border border-orange-100 rounded-2xl space-y-1.5 hover:border-orange-200 transition-all">
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#FF6B00]" />
                Does WhatsApp messaging work automatically?
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Yes! Every enquiry submission, consultation rescheduling, and booking confirmation triggers an automatic WhatsApp notification directly via Meta Cloud API.
              </p>
            </div>

            <div className="p-5 bg-[#FFFBF7] border border-orange-100 rounded-2xl space-y-1.5 hover:border-orange-200 transition-all">
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#FF6B00]" />
                Can brides submit enquiries from our website?
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Yes. Your studio has a public URL (e.g. <code>/[your-studio-slug]</code>) with an enquiry form that checks date availability and instantly synchronizes with your dashboard.
              </p>
            </div>

            <div className="p-5 bg-[#FFFBF7] border border-orange-100 rounded-2xl space-y-1.5 hover:border-orange-200 transition-all">
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#FF6B00]" />
                How are multiple event dates handled for one wedding?
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Under Bookings, you can add multi-day events such as Mehendi, Sangeet, Muhurtham, and Reception with distinct artist timings and venue locations.
              </p>
            </div>

            <div className="p-5 bg-[#FFFBF7] border border-orange-100 rounded-2xl space-y-1.5 hover:border-orange-200 transition-all">
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#FF6B00]" />
                What if I need custom feature development?
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Submit a support ticket with the category <strong>Feature Request</strong>. Our product engineers actively review studio feedback for monthly software updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
