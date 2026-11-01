'use client';

import React, { useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '@/services/supportApi';
import {
  ArrowLeft,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  LifeBuoy,
  CheckCircle2,
  ChevronRight,
  Clock,
  Sparkles,
  CheckCircle,
  HelpCircle,
  ListOrdered,
  Layers,
} from 'lucide-react';

/**
 * Clean markdown helper that removes any leftover formatting tokens
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .trim();
}

/**
 * Parses raw text into semantic sections:
 * - headings (### )
 * - step/feature blocks (#### )
 * - numbered lists (1. 2. 3.)
 * - bullet lists (- )
 * - regular paragraphs
 */
function parseGuideContent(rawContent) {
  if (!rawContent) return [];

  // Normalize newlines and split by double-newline paragraphs
  const chunks = rawContent
    .replace(/\r\n/g, '\n')
    .split(/\n\n+/)
    .map((c) => c.trim())
    .filter(Boolean);

  const sections = [];

  for (const chunk of chunks) {
    const cleaned = cleanText(chunk);

    if (cleaned.startsWith('### ')) {
      sections.push({
        type: 'HEADING',
        title: cleaned.replace(/^###\s+/, ''),
      });
      continue;
    }

    if (cleaned.startsWith('#### ')) {
      // Check if there are list items immediately attached
      const lines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);
      const title = lines[0].replace(/^####\s+/, '');
      const subItems = [];

      for (let i = 1; i < lines.length; i++) {
        const l = lines[i];
        if (/^[0-9]+\.\s+/.test(l)) {
          subItems.push({
            type: 'NUMBERED',
            text: l.replace(/^[0-9]+\.\s+/, ''),
          });
        } else if (/^-\s+/.test(l)) {
          subItems.push({
            type: 'BULLET',
            text: l.replace(/^-\s+/, ''),
          });
        } else {
          subItems.push({
            type: 'TEXT',
            text: l,
          });
        }
      }

      sections.push({
        type: 'STEP_BLOCK',
        title,
        items: subItems,
      });
      continue;
    }

    // Numbered or bullet list chunk
    const lines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);
    const isNumbered = lines.some((l) => /^[0-9]+\.\s+/.test(l));
    const isBullet = lines.some((l) => /^-\s+/.test(l));

    if (isNumbered || isBullet) {
      const listItems = lines.map((l) => {
        if (/^[0-9]+\.\s+/.test(l)) {
          return { type: 'NUMBERED', text: l.replace(/^[0-9]+\.\s+/, '') };
        }
        if (/^-\s+/.test(l)) {
          return { type: 'BULLET', text: l.replace(/^-\s+/, '') };
        }
        return { type: 'TEXT', text: l };
      });

      sections.push({
        type: 'LIST_BLOCK',
        items: listItems,
      });
      continue;
    }

    // Default regular paragraph
    sections.push({
      type: 'PARAGRAPH',
      text: cleaned,
    });
  }

  return sections;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const studioSlug = params?.businessSlug;
  const isUserPortal = pathname?.includes('/user/');
  const basePath = studioSlug ? (isUserPortal ? `/${studioSlug}/user/help-support` : `/${studioSlug}/admin/help-support`) : '/help-support';

  const router = useRouter();
  const queryClient = useQueryClient();
  const slug = params?.slug;

  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);

  const { data: articleRes, isLoading, isError } = useQuery({
    queryKey: ['help-article-detail', slug],
    queryFn: () => supportApi.getArticleBySlug(slug),
    enabled: !!slug,
  });
  const article = articleRes?.data;

  const feedbackMutation = useMutation({
    mutationFn: (isHelpful) =>
      supportApi.recordFeedback(article.id, {
        is_helpful: isHelpful,
        comment: feedbackComment,
      }),
    onSuccess: (_, isHelpful) => {
      setFeedbackGiven(isHelpful ? 'helpful' : 'not_helpful');
      setShowCommentBox(false);
      queryClient.invalidateQueries(['help-article-detail', slug]);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFBF7] p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-500 font-medium">Loading guide...</p>
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="min-h-screen bg-[#FFFBF7] p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border border-stone-200 shadow-sm space-y-4">
          <BookOpen className="w-10 h-10 text-stone-400 mx-auto" />
          <h2 className="text-base font-bold text-stone-900">Guide Not Found</h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            The guide you requested could not be found or has been updated.
          </p>
          <Link
            href={basePath}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B00] text-white text-xs font-bold rounded-xl shadow-md hover:bg-orange-700 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Help Center</span>
          </Link>
        </div>
      </div>
    );
  }

  const sections = parseGuideContent(article.content);

  return (
    <div className="min-h-screen bg-[#FFFBF7] pb-24 font-sans text-stone-900 -m-3 sm:-m-6 lg:-m-8">
      {/* Top Breadcrumb Header - Clean, In-Flow, Never Overlapping */}
      <div className="bg-white border-b border-stone-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <Link
            href={basePath}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors truncate"
          >
            <ArrowLeft className="w-4 h-4 text-[#FF6B00] shrink-0" />
            <span className="truncate">Help Center</span>
            <span className="text-stone-300">/</span>
            <span className="text-[#FF6B00] truncate">{article.help_categories?.name}</span>
          </Link>

          <Link
            href={`${basePath}/raise-ticket`}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#FF6B00] rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Need 1-on-1 Help?</span>
            <span className="sm:hidden">Support</span>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Main Article Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-8 md:p-10 border border-stone-200/90 shadow-sm space-y-6 sm:space-y-8">
            {/* Header info */}
            <div className="space-y-3 pb-6 border-b border-stone-100">
              <span className="inline-block px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200/60 rounded-full text-xs font-extrabold uppercase tracking-wide">
                {article.help_categories?.name}
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight leading-snug">
                {cleanText(article.title)}
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed border-l-2 border-[#FF6B00] pl-3.5">
                {cleanText(article.short_description)}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-400 pt-2">
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  Last updated {new Date(article.updated_at).toLocaleDateString()}
                </span>
                <span>&bull;</span>
                <span className="font-medium">{article.view_count || 1} views</span>
              </div>
            </div>

            {/* Line-by-Line Structured Sections */}
            <div className="space-y-6">
              {sections.map((sec, idx) => {
                if (sec.type === 'HEADING') {
                  return (
                    <div key={idx} className="pt-2">
                      <h2 className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight flex items-center gap-2 text-stone-900">
                        <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />
                        <span>{sec.title}</span>
                      </h2>
                    </div>
                  );
                }

                if (sec.type === 'STEP_BLOCK') {
                  return (
                    <div
                      key={idx}
                      className="bg-[#FFFBF7] border border-orange-200/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs"
                    >
                      {/* Step Title Header */}
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-orange-100">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF6B00] shrink-0" />
                        <h3 className="text-xs sm:text-sm font-bold text-stone-900">
                          {sec.title}
                        </h3>
                      </div>

                      {/* Line-by-line Instructions */}
                      {sec.items && sec.items.length > 0 && (
                        <div className="space-y-2.5 pl-1 sm:pl-2">
                          {sec.items.map((item, itemIdx) => {
                            const isNumbered = item.type === 'NUMBERED';

                            return (
                              <div
                                key={itemIdx}
                                className="flex items-start gap-3 text-xs sm:text-sm text-stone-700 leading-relaxed group"
                              >
                                {isNumbered ? (
                                  <span className="w-5 h-5 rounded-full bg-[#FF6B00] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                                    {itemIdx + 1}
                                  </span>
                                ) : (
                                  <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0 mt-1.5" />
                                )}
                                <span className="flex-1 font-medium text-stone-800">
                                  {item.text}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                if (sec.type === 'LIST_BLOCK') {
                  return (
                    <div
                      key={idx}
                      className="bg-stone-50/70 border border-stone-200/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-3"
                    >
                      {sec.items.map((item, itemIdx) => {
                        const isNumbered = item.type === 'NUMBERED';

                        return (
                          <div
                            key={itemIdx}
                            className="flex items-start gap-3 text-xs sm:text-sm leading-relaxed"
                          >
                            {isNumbered ? (
                              <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {itemIdx + 1}
                              </span>
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-[#FF6B00] shrink-0 mt-1.5" />
                            )}
                            <span className="flex-1 font-medium text-stone-800">
                              {item.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                // Default Paragraph
                return (
                  <p key={idx} className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal">
                    {sec.text}
                  </p>
                );
              })}
            </div>

            {/* Helpful Studio Pro-Tip Box */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-50 to-amber-50/60 border border-orange-200 rounded-2xl sm:rounded-3xl flex items-start gap-3.5 text-xs text-orange-950">
              <Sparkles className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-stone-900 block text-xs">Studio Pro Tip</strong>
                <span className="text-stone-600 mt-0.5 block leading-relaxed">
                  All settings and customer actions update your live website and studio WhatsApp queue automatically in real-time.
                </span>
              </div>
            </div>

            {/* Guide Feedback Section */}
            <div className="pt-6 border-t border-stone-200 space-y-4">
              <div className="bg-[#FFFBF7] rounded-3xl p-5 sm:p-6 border border-orange-200/70 text-center space-y-3">
                <h4 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
                  Was this guide helpful?
                </h4>

                {feedbackGiven ? (
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-700 py-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Thank you for your feedback!</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 pt-1">
                    <button
                      onClick={() => feedbackMutation.mutate(true)}
                      disabled={feedbackMutation.isPending}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 border border-stone-200 hover:border-emerald-300 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Yes ({article.helpful_count || 0})</span>
                    </button>
                    <button
                      onClick={() => setShowCommentBox(true)}
                      disabled={feedbackMutation.isPending}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-200 hover:border-rose-300 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>No</span>
                    </button>
                  </div>
                )}

                {showCommentBox && !feedbackGiven && (
                  <div className="pt-3 max-w-md mx-auto space-y-2 text-left">
                    <label className="text-[11px] font-bold text-stone-700">
                      How can we improve this guide? (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Tell us what was missing or confusing..."
                      className="w-full p-3 bg-white border border-stone-300 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowCommentBox(false)}
                        className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => feedbackMutation.mutate(false)}
                        className="px-4 py-1.5 bg-[#FF6B00] text-white text-xs font-bold rounded-xl"
                      >
                        Submit Feedback
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Related Articles Card */}
          {article.related_articles && article.related_articles.length > 0 && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
                <BookOpen className="w-4 h-4 text-[#FF6B00]" />
                Related Guides
              </h3>
              <div className="divide-y divide-stone-100">
                {article.related_articles.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`${basePath}/article/${rel.slug}`}
                    className="py-3 block group hover:bg-orange-50/40 rounded-xl px-2 transition-all"
                  >
                    <h4 className="text-xs font-bold text-stone-800 group-hover:text-[#FF6B00] transition-colors leading-snug">
                      {cleanText(rel.title)}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">
                      {cleanText(rel.short_description)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 1-on-1 Support Card */}
          <div className="bg-gradient-to-br from-orange-600 via-[#FF6B00] to-amber-600 rounded-3xl p-6 text-white shadow-lg space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <LifeBuoy className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-extrabold tracking-tight">Need 1-on-1 Studio Support?</h3>
            <p className="text-xs text-orange-100 leading-relaxed">
              Our VARNAM support engineers can inspect your studio account, verify WhatsApp Cloud logs, and resolve technical issues directly.
            </p>
            <Link
              href={`${basePath}/raise-ticket`}
              className="mt-2 w-full py-2.5 px-4 bg-white hover:bg-orange-50 text-[#FF6B00] font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span>Submit Support Ticket</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
