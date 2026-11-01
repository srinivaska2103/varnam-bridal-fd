'use client';

import React, { useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '@/services/supportApi';
import {
  ArrowLeft,
  LifeBuoy,
  Send,
  User,
  ShieldCheck,
  Paperclip,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  X,
  Upload,
} from 'lucide-react';

export default function UserTicketDetailPage() {
  const params = useParams();
  const pathname = usePathname();
  const studioSlug = params?.businessSlug;
  const isUserPortal = pathname?.includes('/user/');
  const basePath = studioSlug ? (isUserPortal ? `/${studioSlug}/user/help-support` : `/${studioSlug}/admin/help-support`) : '/help-support';

  const router = useRouter();
  const queryClient = useQueryClient();
  const ticketId = params?.id;

  const [replyMessage, setReplyMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [replyError, setReplyError] = useState('');

  const { data: ticketRes, isLoading, isError } = useQuery({
    queryKey: ['user-support-ticket-detail', ticketId],
    queryFn: () => supportApi.getUserTicketById(ticketId),
    enabled: !!ticketId,
    refetchInterval: 15000, // Poll every 15s for live support responses
  });
  const ticket = ticketRes?.data;

  const replyMutation = useMutation({
    mutationFn: (payload) => supportApi.addUserReply(ticketId, payload),
    onSuccess: () => {
      setReplyMessage('');
      setAttachments([]);
      setReplyError('');
      queryClient.invalidateQueries(['user-support-ticket-detail', ticketId]);
      queryClient.invalidateQueries(['user-support-tickets']);
    },
    onError: (err) => {
      setReplyError(err.response?.data?.message || err.message || 'Failed to send reply');
    },
  });

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setReplyError(`File "${file.name}" exceeds 5MB limit`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUri = event.target?.result;
        if (dataUri) {
          setAttachments((prev) => [
            ...prev,
            {
              file_name: file.name,
              file_url: dataUri,
              file_size: file.size,
              mime_type: file.type,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    replyMutation.mutate({
      message: replyMessage,
      attachments,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-500 font-medium">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center border border-stone-200 shadow-sm space-y-4">
          <LifeBuoy className="w-10 h-10 text-stone-400 mx-auto" />
          <h2 className="text-base font-bold text-stone-900">Ticket Not Found</h2>
          <p className="text-xs text-stone-500">
            This ticket could not be found or you do not have permission to view it.
          </p>
          <Link
            href={`${basePath}/tickets`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B00] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-orange-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Tickets</span>
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = ticket.status === 'CLOSED';

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-24 -m-3 sm:-m-6 lg:-m-8">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href={`${basePath}/tickets`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#FF6B00]" />
            <span>My Support Tickets</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-lg">
              #{ticket.ticket_number}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : ticket.status === 'WAITING_FOR_USER'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              {ticket.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Conversation History & Reply Box */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Header Card */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                {ticket.category} &bull; {ticket.related_module || 'General'}
              </span>
              <span className="text-xs text-stone-400">
                Created {new Date(ticket.created_at).toLocaleString()}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
              {ticket.subject}
            </h1>
          </div>

          {/* Messages Thread */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 px-1">
              Conversation Thread ({ticket.support_ticket_messages?.length || 0})
            </h3>

            {ticket.support_ticket_messages?.map((msg) => {
              const isAdmin = msg.sender_type === 'ADMIN';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col rounded-3xl p-5 border transition-all ${
                    isAdmin
                      ? 'bg-orange-50/70 border-orange-200 text-stone-900 ml-2 sm:ml-6'
                      : 'bg-white border-stone-200 text-stone-900 mr-2 sm:mr-6 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-stone-200/60 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isAdmin
                            ? 'bg-orange-600 text-white'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-bold">
                        {isAdmin ? 'VARNAM Technical Support' : msg.users?.name || 'Studio Staff'}
                      </span>
                      {isAdmin && (
                        <span className="text-[10px] bg-orange-200/70 text-orange-900 font-bold px-1.5 py-0.2 rounded uppercase">
                          VARNAM Official
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(msg.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-stone-800">
                    {msg.message}
                  </div>

                  {/* Message Attachments */}
                  {msg.support_ticket_attachments && msg.support_ticket_attachments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-stone-200/50 flex flex-wrap gap-2">
                      {msg.support_ticket_attachments.map((att) => (
                        <a
                          key={att.id}
                          href={att.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-700 hover:text-[#FF6B00] hover:border-orange-300 transition-all shadow-2xs"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-[#FF6B00]" />
                          <span className="truncate max-w-[150px]">{att.file_name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* User Reply Box */}
          {!isClosed ? (
            <form onSubmit={handleReplySubmit} className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Reply to Support Team
              </h4>

              {replyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {replyError}
                </div>
              )}

              <textarea
                required
                rows={4}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your response here..."
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] transition-all leading-relaxed"
              />

              {/* Upload & Attached list */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-xl cursor-pointer border border-stone-200 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#FF6B00]" />
                  <span>Attach File</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="submit"
                  disabled={replyMutation.isPending || !replyMessage.trim()}
                  className="px-5 py-2.5 bg-[#FF6B00] hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {replyMutation.isPending ? (
                    <span>Sending Reply...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Reply</span>
                    </>
                  )}
                </button>
              </div>

              {/* Attachments preview */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700"
                    >
                      <Paperclip className="w-3 h-3 text-[#FF6B00]" />
                      <span className="truncate max-w-[120px]">{att.file_name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                        className="text-stone-400 hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </form>
          ) : (
            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 text-center text-xs text-stone-500">
              This support ticket has been closed. If you require further assistance, please raise a new support ticket.
            </div>
          )}
        </div>

        {/* Right Sidebar: Ticket Metadata & Audit Trail */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-3">
              Ticket Details
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-stone-400 block text-[11px]">Ticket ID</span>
                <span className="font-mono font-bold text-stone-900">#{ticket.ticket_number}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Status</span>
                <span className="font-bold text-stone-800">{ticket.status.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Priority</span>
                <span className={`font-bold ${ticket.priority === 'CRITICAL' ? 'text-rose-600' : 'text-stone-800'}`}>
                  {ticket.priority}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Category</span>
                <span className="font-semibold text-stone-800">{ticket.category}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Module</span>
                <span className="font-semibold text-stone-800">{ticket.related_module || 'General'}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Submitted By</span>
                <span className="font-semibold text-stone-800">{ticket.users?.name} ({ticket.users?.email})</span>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          {ticket.support_ticket_activities && ticket.support_ticket_activities.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-2">
                Activity Timeline
              </h3>
              <div className="space-y-3">
                {ticket.support_ticket_activities.map((act) => (
                  <div key={act.id} className="text-xs space-y-0.5 border-l-2 border-orange-300 pl-3 py-0.5">
                    <div className="font-bold text-stone-800">
                      {act.activity_type.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[10px] text-stone-400">
                      {new Date(act.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

