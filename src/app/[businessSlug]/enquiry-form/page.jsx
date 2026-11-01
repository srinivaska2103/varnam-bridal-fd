'use client';

import React, { useState, use } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Sparkles,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  X,
  Plus,
} from 'lucide-react';
import { publicFormApi } from '@/services/api/modules';
import { ModernDropdown, ModernDatePicker } from '@/components/ui';

const EVENT_TYPE_OPTIONS = [
  { value: 'WEDDING', label: 'Wedding / Muhurtham' },
  { value: 'ENGAGEMENT', label: 'Engagement' },
  { value: 'RECEPTION', label: 'Reception' },
  { value: 'SANGEET', label: 'Sangeet / Mehendi' },
  { value: 'TRIAL', label: 'Bridal Trial' },
  { value: 'OTHER', label: 'Other Party / Event' },
];

export default function PublicEnquiryFormPage({ params }) {
  // Unwrap Next.js App Router params
  const resolvedParams = use(params);
  const { businessSlug } = resolvedParams;

  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Form field answers
  const [answers, setAnswers] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    event_kind: 'WEDDING',
    event_date: '',
    event_venue: '',
    consultation_date: '',
    consultation_time: '',
    custom_answers: {},
  });

  // Fetch consultation slots when customer chooses a consultation date
  const {
    data: slotRes,
    isLoading: isSlotLoading,
  } = useQuery({
    queryKey: ['public-form-consultation-slots', businessSlug, answers.consultation_date],
    queryFn: () => publicFormApi.getConsultationSlots(businessSlug, answers.consultation_date),
    enabled: !!(businessSlug && answers.consultation_date),
  });

  const availableSlots = slotRes?.data?.slots || slotRes?.slots || [];

  // Fetch published enquiry form
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-enquiry-form', businessSlug],
    queryFn: () => publicFormApi.getFormBySlug(businessSlug),
    retry: 1,
  });

  // Fetch booked/unavailable dates for this studio
  const {
    data: availabilityData,
    isLoading: isAvailabilityLoading,
    isError: isAvailabilityError,
    refetch: refetchAvailability,
  } = useQuery({
    queryKey: ['public-availability', businessSlug],
    queryFn: () => publicFormApi.getAvailability(businessSlug),
    staleTime: 60 * 1000,
    retry: 2,
  });

  const unavailableDates = availabilityData?.data?.unavailable_dates || [];
  const unavailableDatesSet = React.useMemo(
    () => new Set(unavailableDates),
    [unavailableDates]
  );

  const formPayload = data?.data || data;
  const formConfig = formPayload?.form;
  const business = formPayload?.business;

  // Selected date status check
  const isSelectedDateBooked = Boolean(
    answers.event_date && unavailableDatesSet.has(answers.event_date)
  );

  const handleCustomAnswerChange = (fieldId, value) => {
    setAnswers((prev) => ({
      ...prev,
      custom_answers: {
        ...prev.custom_answers,
        [fieldId]: value,
      },
    }));
  };

  const handleCheckboxToggle = (fieldId, option) => {
    const current = Array.isArray(answers.custom_answers[fieldId])
      ? [...answers.custom_answers[fieldId]]
      : [];
    const index = current.indexOf(option);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(option);
    }
    handleCustomAnswerChange(fieldId, current);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);

    try {
      if (!answers.customer_name.trim()) throw new Error('Please enter your full name');
      if (!answers.customer_phone.trim()) throw new Error('Please enter your phone number');

      if (answers.event_date && unavailableDatesSet.has(answers.event_date)) {
        throw new Error('This date is already booked. Please select another available date.');
      }

      const customAnswersPayload = { ...answers.custom_answers };
      if (answers.consultation_date && answers.consultation_time) {
        customAnswersPayload._requested_consultation = {
          date: answers.consultation_date,
          time: answers.consultation_time,
          label: `Requested Consultation on ${answers.consultation_date} at ${answers.consultation_time}`,
        };
      }

      const payload = {
        customer_name: answers.customer_name.trim(),
        customer_phone: answers.customer_phone.trim(),
        customer_email: answers.customer_email.trim() || undefined,
        event_kind: answers.event_kind || 'WEDDING',
        event_date: answers.event_date || undefined,
        event_venue: answers.event_venue.trim() || undefined,
        custom_answers: customAnswersPayload,
      };

      const res = await publicFormApi.submitForm(businessSlug, payload);

      // If user also picked consultation date/time, trigger consultation request
      if (answers.consultation_date && answers.consultation_time) {
        try {
          await publicWebsiteApi.submitConsultation(businessSlug, {
            name: answers.customer_name.trim(),
            phone: answers.customer_phone.trim(),
            preferred_date: answers.consultation_date,
            preferred_time: answers.consultation_time,
            notes: `Requested via Public Enquiry Form. Event: ${answers.event_kind} on ${answers.event_date || 'TBD'}`,
          });
        } catch (consErr) {
          console.warn('[Public Form] Consultation creation notice:', consErr.message);
        }
      }
      setSuccessData(res.data);
      setSubmitted(true);
    } catch (err) {
      refetchAvailability();
      const msg = err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Failed to submit enquiry';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-stone-600">Loading bridal enquiry form...</p>
        </div>
      </div>
    );
  }

  // 2. Unavailable / Unpublished State
  if (isError || !formConfig || formConfig.status === 'UNPUBLISHED') {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#F0E7DE] p-8 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[#292524]">Enquiry Form Unavailable</h2>
          <p className="text-xs text-[#78716C] leading-relaxed">
            This bridal studio enquiry form is currently not accepting new online submissions or does not exist.
          </p>
          <div className="pt-2 text-[11px] text-stone-400">
            Powered by <span className="font-semibold text-stone-600">VARNAM</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Submitted Success State (Comprehensive Consultation & WhatsApp Coordination)
  if (submitted) {
    // Merge returned backend data with fetched business snapshot
    const effectiveBiz = successData?.business || business || {};
    const effectiveEnquiry = successData?.enquiry || answers || {};
    const referenceNumber = successData?.reference_number || (successData?.enquiry_id ? successData.enquiry_id.slice(0, 8).toUpperCase() : null);

    // Format address components
    const addressParts = [
      effectiveBiz.address_line1,
      effectiveBiz.address_line2,
      effectiveBiz.city,
      effectiveBiz.state,
      effectiveBiz.postal_code,
    ].filter(Boolean);
    const hasAddress = addressParts.length > 0;
    const fullAddress = hasAddress ? addressParts.join(', ') : effectiveBiz.public_address || '';

    // Directions URL: Use map_url if configured, otherwise construct Google Maps search query
    const directionsUrl =
      effectiveBiz.map_url ||
      (fullAddress
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${effectiveBiz.name || ''} ${fullAddress}`.trim())}`
        : null);

    // Normalize WhatsApp number (E.164 without '+' or leading zeros, with 91 fallback for 10-digit Indian numbers)
    const rawWa = effectiveBiz.whatsapp_phone || effectiveBiz.business_phone || '';
    const digitsOnly = rawWa.replace(/\D/g, '');
    let normalizedWa = '';
    if (digitsOnly.length === 10) {
      normalizedWa = `91${digitsOnly}`;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      normalizedWa = digitsOnly;
    } else if (digitsOnly.length >= 11) {
      normalizedWa = digitsOnly;
    }

    const studioTitle = effectiveBiz.name || 'Bridal Studio';
    const brideName = effectiveEnquiry.customer_name || 'Customer';
    const eventKind = effectiveEnquiry.event_kind || 'Wedding';
    const eventDate = effectiveEnquiry.event_date || 'To be decided';
    const eventLoc = effectiveEnquiry.event_venue || effectiveBiz.city || 'Chennai';

    return (
      <div className="min-h-screen bg-[#FFFDF9] py-10 px-4 sm:px-6 flex flex-col justify-between animate-in fade-in duration-200">
        <div className="max-w-xl w-full mx-auto space-y-6">
          {/* Main Success Card */}
          <div className="bg-white rounded-[28px] border border-[#F0E7DE] shadow-xl p-6 sm:p-8 text-center space-y-5">
            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#292524] tracking-tight">
                Your Enquiry Has Been Received!
              </h1>
              <p className="text-xs sm:text-sm text-[#78716C] leading-relaxed max-w-md mx-auto">
                Thank you for choosing <strong className="text-stone-800">{studioTitle}</strong>. We&apos;ve received your bridal enquiry. Please review your enquiry details below or visit our studio for consultation.
              </p>
            </div>

            {/* Reference Number Pill */}
            {referenceNumber && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-[#C2410C] text-xs font-bold">
                <span>Enquiry Reference:</span>
                <span className="font-mono text-stone-900 tracking-wider">#{referenceNumber}</span>
              </div>
            )}

            {/* Studio Location Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#F0E7DE] text-left space-y-3 shadow-2xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#C2410C] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#292524]">
                      Visit Our Studio
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      In-person consultations and bridal trials by appointment
                    </p>
                  </div>
                </div>

                {directionsUrl && (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#F0E7DE] bg-[#FFFDF9] hover:bg-stone-50 text-[11px] font-bold text-[#C2410C] transition-colors shrink-0 cursor-pointer shadow-2xs"
                  >
                    <span>Get Directions</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {fullAddress ? (
                <div className="p-3.5 bg-[#FFFDF9] rounded-xl border border-[#F0E7DE] text-xs text-stone-700 leading-relaxed space-y-1">
                  <div className="font-bold text-stone-900">{studioTitle}</div>
                  <div>{fullAddress}</div>
                  {effectiveBiz.business_phone && (
                    <div className="pt-1 text-[11px] text-stone-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#F97316]" />
                      <span>{effectiveBiz.business_phone}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 leading-relaxed italic">
                  Studio location has not been added yet. Please contact the studio directly to confirm the consultation location.
                </div>
              )}
            </div>

            {/* Summary of Submitted Details */}
            <div className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/80 text-left space-y-2">
              <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Submitted Details Summary
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 font-semibold block">Client Name</span>
                  <span className="font-bold text-stone-800">{brideName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-semibold block">Phone</span>
                  <span className="font-bold text-stone-800">{effectiveEnquiry.customer_phone || answers.customer_phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-semibold block">Event Type</span>
                  <span className="font-bold text-stone-800">{eventKind}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-semibold block">Event Date</span>
                  <span className="font-bold text-stone-800">{eventDate}</span>
                </div>
              </div>
            </div>

            {/* Actions: Return / Back to studio */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setAnswers({
                    customer_name: '',
                    customer_phone: '',
                    customer_email: '',
                    event_kind: 'WEDDING',
                    event_date: '',
                    event_venue: '',
                    custom_answers: {},
                  });
                }}
                className="text-xs font-semibold text-stone-500 hover:text-stone-800 underline transition-colors cursor-pointer"
              >
                Submit another enquiry
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[11px] text-stone-400">
            Powered by <span className="font-semibold text-stone-600">VARNAM</span> • Bridal Studio Management
          </div>
        </div>
      </div>
    );
  }

  // 4. Public Form Rendering
  const fields = formConfig.fields || [];

  return (
    <div className="min-h-screen bg-[#FFFDF9] py-8 sm:py-14 px-4 sm:px-6 flex flex-col justify-between">
      <div className="max-w-xl w-full mx-auto bg-white rounded-3xl border border-[#F0E7DE] shadow-xl overflow-hidden">
        {/* Studio Branding Header */}
        <div className="p-6 sm:p-8 bg-[#FFFDF9] border-b border-[#F0E7DE] text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white border border-[#F0E7DE] shadow-xs flex items-center justify-center mx-auto overflow-hidden p-1.5">
            <img
              src={business?.logo_url || '/varnam-logo.png'}
              alt={business?.name || 'Studio Logo'}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = '/varnam-logo.png';
              }}
            />
          </div>

          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#292524]">{business?.name}</h1>
            {(business?.city || business?.state) && (
              <div className="text-xs text-[#78716C] flex items-center justify-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-[#F97316]" />
                <span>{[business?.city, business?.state].filter(Boolean).join(', ')}</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[#F0E7DE]/70">
            <h2 className="text-sm sm:text-base font-bold text-[#F97316]">{formConfig.title}</h2>
            {formConfig.welcome_message && (
              <p className="text-xs text-[#78716C] mt-1.5 leading-relaxed max-w-md mx-auto">
                {formConfig.welcome_message}
              </p>
            )}
          </div>
        </div>

        {/* Public Enquiry Submission Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {submitError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {fields.map((field) => {
            // Check if system field
            if (field.id === 'customer_name') {
              return (
                <div key={field.id} className="space-y-1">
                  <label className="block text-xs font-semibold text-[#292524]">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    required={field.required}
                    placeholder={field.placeholder || 'Enter your full name'}
                    value={answers.customer_name}
                    onChange={(e) => setAnswers({ ...answers, customer_name: e.target.value })}
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white text-[#292524] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] shadow-2xs"
                  />
                </div>
              );
            }

            if (field.id === 'consultation_slots' || field.id === 'consultation_preference') {
              return null;
            }

            if (field.id === 'customer_phone') {
              return (
                <div key={field.id} className="space-y-1">
                  <label className="block text-xs font-semibold text-[#292524]">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="tel"
                    required={field.required}
                    placeholder={field.placeholder || 'Enter 10-digit mobile number'}
                    value={answers.customer_phone}
                    onChange={(e) => setAnswers({ ...answers, customer_phone: e.target.value })}
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white text-[#292524] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] shadow-2xs"
                  />
                </div>
              );
            }

            if (field.id === 'consultation_slots' || field.id === 'consultation_preference') {
              return null;
            }

            if (field.id === 'customer_email') {
              return (
                <div key={field.id} className="space-y-1">
                  <label className="block text-xs font-semibold text-[#292524]">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="email"
                    required={field.required}
                    placeholder={field.placeholder || 'e.g. bride@example.com'}
                    value={answers.customer_email}
                    onChange={(e) => setAnswers({ ...answers, customer_email: e.target.value })}
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white text-[#292524] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] shadow-2xs"
                  />
                </div>
              );
            }

            if (field.id === 'consultation_slots' || field.id === 'consultation_preference') {
              return null;
            }

            if (field.id === 'event_kind') {
              return (
                <div key={field.id} className="space-y-1">
                  <label className="block text-xs font-semibold text-[#292524]">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <ModernDropdown
                    value={answers.event_kind}
                    onChange={(val) => setAnswers({ ...answers, event_kind: val })}
                    options={EVENT_TYPE_OPTIONS}
                  />
                </div>
              );
            }

            if (field.id === 'event_date') {
              return (
                <div key={field.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-[#292524]">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {isAvailabilityLoading && (
                      <span className="text-[11px] font-medium text-orange-600 animate-pulse">
                        Checking date availability...
                      </span>
                    )}
                    {isAvailabilityError && (
                      <span className="text-[11px] font-medium text-amber-600">
                        We couldn&apos;t verify availability right now. Please try again.
                      </span>
                    )}
                  </div>
                  <ModernDatePicker
                    value={answers.event_date}
                    onChange={(val) => {
                      setAnswers({ ...answers, event_date: val });
                      if (submitError) setSubmitError('');
                    }}
                    placeholder="Select wedding / event date"
                    required={field.required}
                    unavailableDates={unavailableDates}
                    disablePastDates={true}
                    error={isSelectedDateBooked}
                  />
                  {isSelectedDateBooked && (
                    <p className="text-xs font-semibold text-rose-600 flex items-center gap-1.5 pt-0.5 animate-in fade-in">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      This date is already booked. Please select another available date.
                    </p>
                  )}
                  {answers.event_date && !isSelectedDateBooked && (
                    <p className="text-xs font-medium text-emerald-600 flex items-center gap-1.5 pt-0.5 animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Date is available for bridal booking!
                    </p>
                  )}
                </div>
              );
            }

            if (field.id === 'event_venue') {
              return (
                <div key={field.id} className="space-y-1">
                  <label className="block text-xs font-semibold text-[#292524]">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    required={field.required}
                    placeholder={field.placeholder || 'e.g. Chennai / Madurai'}
                    value={answers.event_venue}
                    onChange={(e) => setAnswers({ ...answers, event_venue: e.target.value })}
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white text-[#292524] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] shadow-2xs"
                  />
                </div>
              );
            }

            if (field.id === 'consultation_slots' || field.id === 'consultation_preference') {
              return null;
            }

            // Custom Questions / Fields
            const customVal = answers.custom_answers[field.id] || '';

            if (field.type === 'textarea') {
              return (
                <div key={field.id} className="space-y-1">
                  <label className="block text-xs font-semibold text-[#292524]">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    rows={3}
                    required={field.required}
                    placeholder={field.placeholder || 'Your response...'}
                    value={customVal}
                    onChange={(e) => handleCustomAnswerChange(field.id, e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white text-[#292524] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] resize-none shadow-2xs"
                  />
                </div>
              );
            }

            if (field.type === 'select') {
              return (
                <div key={field.id} className="space-y-1">
                  <label className="block text-xs font-semibold text-[#292524]">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <ModernDropdown
                    value={customVal}
                    onChange={(val) => handleCustomAnswerChange(field.id, val)}
                    options={(field.options || []).map((o) => ({ value: o, label: o }))}
                    placeholder={`Select ${field.label.toLowerCase()}...`}
                  />
                </div>
              );
            }

            if (field.type === 'multiselect') {
              const selectedList = Array.isArray(customVal) ? customVal : [];
              return (
                <div key={field.id} className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#292524]">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                    {field.options?.map((opt) => {
                      const isChecked = selectedList.includes(opt);
                      return (
                        <label
                          key={opt}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-orange-50 border-[#F97316] text-[#C2410C] font-semibold'
                              : 'bg-white border-[#F0E7DE] text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCheckboxToggle(field.id, opt)}
                            className="w-4 h-4 text-[#F97316] rounded border-stone-300 focus:ring-[#F97316]"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (field.type === 'checkbox') {
              return (
                <div key={field.id} className="pt-1">
                  <label className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      required={field.required}
                      checked={!!customVal}
                      onChange={(e) => handleCustomAnswerChange(field.id, e.target.checked)}
                      className="w-4 h-4 text-[#F97316] rounded border-stone-300 focus:ring-[#F97316]"
                    />
                    <span className="font-semibold text-[#292524]">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </span>
                  </label>
                </div>
              );
            }

            if (field.type === 'image_upload' || field.id === 'reference_images') {
              return (
                <div key={field.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-[#292524]">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <span className="text-[11px] text-stone-400">Optional • Max 5MB</span>
                  </div>

                  {customVal ? (
                    <div className="relative border border-[#F0E7DE] bg-stone-50/50 rounded-2xl p-2.5 flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl border border-stone-200 overflow-hidden bg-white shrink-0">
                        <img
                          src={customVal}
                          alt="Reference look preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#292524] truncate">
                          Reference Look Attached
                        </p>
                        <p className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          Ready to submit with enquiry
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCustomAnswerChange(field.id, '')}
                        className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-[#F0E7DE] hover:border-[#F97316]/60 rounded-2xl p-4 bg-[#FFFDF9] hover:bg-orange-50/30 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group shadow-2xs">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            alert('Image file size must be less than 5MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            const dataUrl = evt.target?.result;
                            if (dataUrl) {
                              handleCustomAnswerChange(field.id, dataUrl);
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      <div className="w-10 h-10 rounded-full bg-orange-50 text-[#F97316] group-hover:scale-110 transition-transform flex items-center justify-center">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#292524] group-hover:text-[#F97316] transition-colors">
                          Click to upload inspiration / reference photo
                        </p>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                          Attach hairstyle, makeup look, or bridal outfit image (PNG, JPG, WebP)
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              );
            }

            return (
              <div key={field.id} className="space-y-1">
                <label className="block text-xs font-semibold text-[#292524]">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'date' ? (
                  <ModernDatePicker
                    value={customVal}
                    onChange={(val) => handleCustomAnswerChange(field.id, val)}
                    placeholder={`Select ${field.label.toLowerCase()}...`}
                    required={field.required}
                  />
                ) : (
                  <input
                    type={field.type === 'phone' ? 'tel' : field.type}
                    required={field.required}
                    placeholder={field.placeholder || `Enter your ${field.label.toLowerCase()}`}
                    value={customVal}
                    onChange={(e) => handleCustomAnswerChange(field.id, e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white text-[#292524] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] shadow-2xs"
                  />
                )}
              </div>
            );
          })}

          {/* Consultation Appointment Availability Picker */}
          <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F97316]" />
              <span className="font-bold text-[#292524] text-xs sm:text-sm">
                Book Studio Consultation / Trial (Optional)
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              Select an available studio date and appointment time slot for your bridal consultation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-semibold text-stone-700 block mb-1 text-[11px]">
                  Preferred Consultation Date
                </label>
                <ModernDatePicker
                  value={answers.consultation_date}
                  onChange={(val) => {
                    setAnswers((prev) => ({
                      ...prev,
                      consultation_date: val,
                      consultation_time: '',
                    }));
                  }}
                  placeholder="Select consultation date..."
                  disablePastDates={true}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1 text-[11px]">
                  Available Studio Time Slot
                </label>
                {!answers.consultation_date ? (
                  <div className="px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-400 text-xs">
                    Select a consultation date first
                  </div>
                ) : isSlotLoading ? (
                  <div className="px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-500 text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    Checking available studio slots...
                  </div>
                ) : availableSlots.filter((s) => s.is_available).length === 0 ? (
                  <div className="px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs">
                    No open slots on this date. Please pick another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-32 overflow-y-auto p-1 bg-white rounded-xl border border-stone-200">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.is_available}
                        onClick={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            consultation_time: slot.time,
                          }))
                        }
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer ${
                          answers.consultation_time === slot.time
                            ? 'bg-[#F97316] text-white shadow-xs'
                            : slot.is_available
                            ? 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200'
                            : 'bg-stone-100 text-stone-300 border border-stone-100 cursor-not-allowed line-through'
                        }`}
                      >
                        {slot.display_time}
                      </button>
                    ))}
                  </div>
                )}
                {answers.consultation_time && (
                  <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Slot {answers.consultation_time} selected
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting || isSelectedDateBooked}
              className="w-full py-3.5 bg-[#F97316] hover:bg-[#C2410C] text-white font-bold text-sm rounded-xl shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Submitting Enquiry...'
                : isSelectedDateBooked
                ? 'Selected Date is Unavailable'
                : formConfig.submit_button_label || 'Submit Enquiry'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-[#FFFDF9] border-t border-[#F0E7DE] text-center text-[11px] text-stone-400">
          Powered by <span className="font-semibold text-stone-600">VARNAM</span> • Bridal Studio Management
        </div>
      </div>
    </div>
  );
}
