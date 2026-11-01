'use client';

import React, { useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Star,
  Send,
  AlertCircle,
  Menu,
  X,
  Heart,
  Crown,
  Instagram,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { publicWebsiteApi } from '@/services/api/modules';
import {
  Button,
  Card,
  Badge,
  LoadingSpinner,
  ModernDropdown,
  ModernDatePicker,
} from '@/components/ui';
import CustomizableFooter from '@/components/website/CustomizableFooter';

const CEREMONY_TYPE_OPTIONS = [
  { value: 'Bridal', label: 'Wedding / Muhurtham' },
  { value: 'Reception', label: 'Reception' },
  { value: 'Engagement', label: 'Engagement' },
  { value: 'Sangeet', label: 'Sangeet / Mehendi' },
  { value: 'Party', label: 'Party / Event Makeover' },
];

export default function PublicStudioWebsitePage({ params }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.businessSlug;
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  // Mobile navigation drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Contact / Direct Enquiry form state
  const [enquiryForm, setEnquiryForm] = useState({
    name: '',
    phone: '',
    email: '',
    service_interested: '',
    event_date: '',
    event_type: 'Bridal',
    message: '',
    consultation_date: '',
    consultation_time: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Consultation slot selection query
  const {
    data: slotRes,
    isLoading: isSlotLoading,
  } = useQuery({
    queryKey: ['public-consultation-slots', slug, enquiryForm.consultation_date],
    queryFn: () => publicWebsiteApi.getConsultationSlots(slug, enquiryForm.consultation_date),
    enabled: !!(slug && enquiryForm.consultation_date),
  });

  const availableSlots = slotRes?.data?.slots || slotRes?.slots || [];

  // 1. Fetch website info
  const {
    data: siteRes,
    isLoading: isSiteLoading,
    isError: isSiteError,
  } = useQuery({
    queryKey: ['public-website', slug, isPreview],
    queryFn: () => publicWebsiteApi.getWebsite(slug, isPreview ? { preview: 'true' } : {}),
    retry: 1,
  });

  // 2. Fetch services
  const { data: servicesRes } = useQuery({
    queryKey: ['public-services', slug, isPreview],
    queryFn: () => publicWebsiteApi.getServices(slug, isPreview ? { preview: 'true' } : {}),
    enabled: !!(siteRes?.data?.site_title || siteRes?.site_title || siteRes?.data?.subdomain || siteRes?.subdomain),
  });

  // 3. Fetch packages
  const { data: packagesRes } = useQuery({
    queryKey: ['public-packages', slug, isPreview],
    queryFn: () => publicWebsiteApi.getPackages(slug, isPreview ? { preview: 'true' } : {}),
    enabled: !!(siteRes?.data?.site_title || siteRes?.site_title || siteRes?.data?.subdomain || siteRes?.subdomain),
  });

  // 4. Fetch portfolio
  const { data: portfolioRes } = useQuery({
    queryKey: ['public-portfolio', slug, isPreview],
    queryFn: () => publicWebsiteApi.getPortfolio(slug, isPreview ? { preview: 'true' } : {}),
    enabled: !!(siteRes?.data?.site_title || siteRes?.site_title || siteRes?.data?.subdomain || siteRes?.subdomain),
  });

  // 5. Fetch date availability (booked/unavailable dates) for this studio
  const { data: availabilityRes } = useQuery({
    queryKey: ['public-website-availability', slug],
    queryFn: () => publicWebsiteApi.getAvailability(slug),
    staleTime: 60 * 1000,
    retry: 2,
    enabled: !!slug,
  });

  const unavailableDates = availabilityRes?.data?.unavailable_dates || availabilityRes?.unavailable_dates || [];
  const unavailableDatesSet = React.useMemo(() => new Set(unavailableDates), [unavailableDates]);

  // Robust extraction of payload (handles either raw payload or axios-unwrapped payload)
  const site = siteRes?.data?.site_title ? siteRes.data : siteRes;
  const services = (servicesRes?.data ?? servicesRes) || [];
  const packages = (packagesRes?.data ?? packagesRes) || [];
  const portfolio = (portfolioRes?.data ?? portfolioRes) || [];

  const isSelectedDateBooked = Boolean(
    enquiryForm.event_date && unavailableDatesSet.has(enquiryForm.event_date)
  );

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);
    try {
      if (!enquiryForm.name.trim()) throw new Error('Please enter your full name');
      if (!enquiryForm.phone.trim()) throw new Error('Please enter your contact phone number');
      if (isSelectedDateBooked) throw new Error('The selected date is already booked. Please choose another date.');

      let customMessage = enquiryForm.message.trim();
      if (enquiryForm.consultation_date && enquiryForm.consultation_time) {
        const slotNote = `[Requested Consultation: ${enquiryForm.consultation_date} at ${enquiryForm.consultation_time}]`;
        customMessage = customMessage ? `${slotNote}\n${customMessage}` : slotNote;
      }

      await publicWebsiteApi.submitEnquiry(slug, {
        name: enquiryForm.name.trim(),
        phone: enquiryForm.phone.trim(),
        email: enquiryForm.email.trim() || undefined,
        service_interested: enquiryForm.service_interested || undefined,
        event_date: enquiryForm.event_date || undefined,
        event_type: enquiryForm.event_type || undefined,
        message: customMessage || undefined,
      });

      // If user also requested a consultation slot, register the consultation request
      if (enquiryForm.consultation_date && enquiryForm.consultation_time) {
        try {
          await publicWebsiteApi.submitConsultation(slug, {
            name: enquiryForm.name.trim(),
            phone: enquiryForm.phone.trim(),
            preferred_date: enquiryForm.consultation_date,
            preferred_time: enquiryForm.consultation_time,
            notes: `Requested via Public Studio Website. Event Date: ${enquiryForm.event_date || 'TBD'}`,
          });
        } catch (consErr) {
          console.warn('[Public Website] Consultation booking notice:', consErr.message);
        }
      }

      setSubmitSuccess(true);
      setEnquiryForm({
        name: '',
        phone: '',
        email: '',
        service_interested: '',
        event_date: '',
        event_type: 'Bridal',
        message: '',
        consultation_date: '',
        consultation_time: '',
      });
    } catch (err) {
      const data = err.response?.data;
      let msg = data?.message || err.message || 'Failed to submit enquiry';
      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        msg = data.errors.map((e) => `${e.field || e.path || 'Error'}: ${e.message}`).join(', ');
      }
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSiteLoading) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center p-6 space-y-4">
        <LoadingSpinner text="Welcoming you to the studio..." size="lg" />
        <span className="text-xs text-stone-400 font-serif italic tracking-wide">
          Curating bridal collections &amp; looks
        </span>
      </div>
    );
  }

  if (isSiteError || !site) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex items-center justify-center p-4 sm:p-6">
        <Card className="max-w-md w-full p-8 text-center bg-white shadow-xl rounded-3xl border border-orange-100">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4 border border-orange-200/60 shadow-2xs">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-stone-900 mb-2">Studio Website Not Found</h1>
          <p className="text-xs sm:text-sm text-stone-500 mb-6 leading-relaxed">
            The studio website you are looking for may be unpublished or the link could be misspelled.
          </p>
          <a
            href={`/${slug}/enquiry-form`}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs transition-colors shadow-sm"
          >
            Visit Studio Enquiry Form
          </a>
        </Card>
      </div>
    );
  }

  const primaryColor = site.primary_color || '#F97316';
  const studioName = site.site_title || site.business?.name || 'Bridal Studio';
  const studioCity = site.business?.city || 'Madurai';
  const studioState = site.business?.state || 'Tamil Nadu';

  const cleanWaNumber = site.whatsapp_phone ? site.whatsapp_phone.replace(/\D/g, '').slice(-10) : '';
  const waUrl = cleanWaNumber
    ? `https://wa.me/91${cleanWaNumber}?text=${encodeURIComponent(
        `Hi ${studioName}, I would like to enquire about bridal makeover availability and wedding packages!`
      )}`
    : null;

  // Dynamic brand color styling
  const customBrandStyle = (
    <style dangerouslySetInnerHTML={{
      __html: `
        :root {
          --brand-primary: ${primaryColor};
        }
        /* Buttons, gradients & accents driven by studio primary color */
        .btn-brand-primary {
          background-color: ${primaryColor} !important;
          color: #ffffff !important;
        }
        .text-brand-primary {
          color: ${primaryColor} !important;
        }
        .border-brand-primary {
          border-color: ${primaryColor} !important;
        }
        .bg-brand-primary {
          background-color: ${primaryColor} !important;
        }
        .brand-gradient {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%) !important;
          color: #ffffff !important;
        }
        .brand-gradient:hover {
          filter: brightness(0.92);
        }
      `
    }} />
  );
  return (
    <div className="min-h-screen bg-[#FFFDF9] text-stone-900 selection:bg-orange-100 selection:text-orange-900 font-sans">
      {customBrandStyle}
      {/* Studio Preview Mode Banner */}
      {isPreview && (
        <div className="sticky top-0 z-[60] bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 text-xs sm:text-sm font-medium shadow-md flex items-center justify-between border-b border-orange-400/30">
          <div className="flex items-center gap-2 max-w-3xl truncate">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white font-bold text-[10px] uppercase tracking-wider shrink-0">
              <Eye className="w-3 h-3" />
              Preview Mode
            </span>
            <span className="truncate">
              {site.status === 'PUBLISHED'
                ? 'Viewing live preview of this studio website.'
                : 'Viewing draft preview — this website is not yet visible to the general public.'}
            </span>
          </div>
          <a
            href="/website"
            className="shrink-0 ml-3 inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white text-orange-900 hover:bg-orange-50 font-bold text-xs transition-colors shadow-2xs"
          >
            Studio Dashboard
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* 1. Header & Navigation Bar */}
      <header className={`sticky ${isPreview ? 'top-10 sm:top-11' : 'top-0'} z-50 bg-white/90 backdrop-blur-md border-b border-orange-100/80 shadow-2xs`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Studio Identity */}
          <a href="#" className="flex items-center gap-3.5 group">
            {site.logo_url ? (
              <img
                src={site.logo_url}
                alt={studioName}
                className="w-11 h-11 rounded-2xl object-cover shadow-xs border border-orange-200/80 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm group-hover:scale-105 transition-transform bg-gradient-to-br from-orange-500 to-amber-600"
              >
                {studioName.charAt(0)}
              </div>
            )}
            <div>
              <span className="font-extrabold text-stone-900 text-base sm:text-lg block tracking-tight leading-tight group-hover:text-orange-600 transition-colors">
                {studioName}
              </span>
              <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                {studioCity}, {studioState}
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-stone-600">
            <a href="#about" className="hover:text-orange-600 transition-colors py-1">About</a>
            <a href="#packages" className="hover:text-orange-600 transition-colors py-1">Bridal Packages</a>
            <a href="#services" className="hover:text-orange-600 transition-colors py-1">Services Menu</a>
            {portfolio.length > 0 && (
              <a href="#portfolio" className="hover:text-orange-600 transition-colors py-1">Lookbook</a>
            )}
            <a href="#contact" className="hover:text-orange-600 transition-colors py-1">Contact &amp; Enquiry</a>
          </nav>

          {/* CTA Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all inline-flex items-center gap-2 border border-emerald-200/80 shadow-2xs active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            )}
            <a
              href="#contact"
              className="px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md brand-gradient active:scale-95 cursor-pointer"
            >
              Book Consultation
            </a>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200"
                aria-label="WhatsApp Us"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-orange-100 px-5 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col gap-2.5 text-sm font-semibold text-stone-700">
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-600"
              >
                About Studio
              </a>
              <a
                href="#packages"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-600"
              >
                Bridal Packages
              </a>
              <a
                href="#services"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-600"
              >
                A La Carte Services
              </a>
              {portfolio.length > 0 && (
                <a
                  href="#portfolio"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-600"
                >
                  Bridal Lookbook
                </a>
              )}
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-orange-50 hover:text-orange-600"
              >
                Contact &amp; Booking
              </a>
            </nav>
            <div className="pt-2 border-t border-stone-100 flex flex-col gap-2">
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl text-center text-white text-xs font-bold brand-gradient shadow-sm"
              >
                Book Consultation
              </a>
              <a
                href={`/${slug}/enquiry-form`}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl text-center text-stone-700 text-xs font-bold border border-stone-200 bg-stone-50"
              >
                Open Custom Enquiry Form
              </a>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section: Warm Amber Glow & Elegant Aesthetics */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-orange-100/60 bg-gradient-to-b from-orange-50/50 via-[#FFFDF9] to-[#FFFDF9]">
        {/* Decorative background blurs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-orange-200/30 via-amber-100/40 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-orange-200/80 shadow-2xs text-xs font-bold text-orange-800 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            <span>Luxury Bridal Makeover &amp; Styling Artistry</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-stone-900 leading-[1.15]">
            {studioName}
          </h1>

          <p className="text-base sm:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed font-serif italic">
            &ldquo;{site.tagline || 'Exquisite bridal makeovers, authentic muhurtham styling, and modern reception elegance.'}&rdquo;
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <a
              href="#packages"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] brand-gradient inline-flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4 text-amber-200" />
              <span>Explore Bridal Packages</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={`/${slug}/enquiry-form`}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-orange-50/50 text-stone-800 font-bold text-sm border border-orange-200/80 shadow-xs transition-colors inline-flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4 text-orange-600" />
              <span>Custom Enquiry Form</span>
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
            <div className="p-3.5 rounded-2xl bg-white border border-orange-100 shadow-2xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 block">Ceremonies</span>
              <span className="text-xs font-bold text-stone-900 block mt-0.5">Muhurtham &amp; Reception</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-orange-100 shadow-2xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 block">Artistry Style</span>
              <span className="text-xs font-bold text-stone-900 block mt-0.5">HD &amp; Glass Skin Makeover</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-orange-100 shadow-2xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 block">Location</span>
              <span className="text-xs font-bold text-stone-900 block mt-0.5">{studioCity}, {studioState}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-orange-100 shadow-2xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 block">Consultation</span>
              <span className="text-xs font-bold text-emerald-700 block mt-0.5">Trials by Appointment</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Modern Interactive About Section (Story, Photos & Trust Badges) */}
      {Boolean(site.about_section || site.about_text) && (
        <section id="about" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Visual Photography Showcase */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Primary Studio / Artistry Photo */}
                <div className="relative rounded-3xl overflow-hidden aspect-[4/5] bg-stone-100 shadow-xl border-4 border-white">
                  <img
                    src={
                      site.about_section?.image_url ||
                      'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=1200&q=80'
                    }
                    alt={site.about_section?.title || 'Bridal Makeup Artist'}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white p-3 rounded-2xl bg-stone-900/60 backdrop-blur-md border border-white/20">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-orange-300 block">
                      Lead Bridal Artist
                    </span>
                    <span className="font-bold text-sm text-white block mt-0.5">
                      {studioName}
                    </span>
                  </div>
                </div>

                {/* Secondary Offset Photo / Highlight Card */}
                {site.about_section?.secondary_image_url ? (
                  <div className="hidden sm:block absolute -bottom-6 -right-6 w-44 h-56 rounded-2xl overflow-hidden border-4 border-white shadow-2xl">
                    <img
                      src={site.about_section.secondary_image_url}
                      alt="Artistry Detail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="hidden sm:block absolute -bottom-6 -right-6 p-4 rounded-2xl bg-white border border-orange-100 shadow-xl max-w-[210px] space-y-1">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-stone-900 block mt-1">100% Genuine HD</span>
                    <span className="text-[11px] text-stone-500 block leading-tight">
                      Waterproof, sweat-resistant bridal glamour designed for Indian weddings.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Story, Philosophy & Trust Metrics */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold shadow-2xs">
                <Heart className="w-3.5 h-3.5 text-orange-600 fill-orange-500" />
                <span>Our Artistry &amp; Heritage</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight">
                  {site.about_section?.title || 'Crafting Timeless Bridal Perfection'}
                </h2>
                {site.about_section?.subtitle && (
                  <p className="text-xs sm:text-sm font-semibold text-orange-600">
                    {site.about_section.subtitle}
                  </p>
                )}
              </div>

              <p className="text-stone-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-serif">
                {site.about_section?.description || site.about_text || 'Welcome to our bespoke bridal styling studio. We specialize in authentic Muhurtham makeovers, glamorous reception looks, saree draping, and contemporary pre-wedding glam.'}
              </p>

              {/* Trust Metric Badges */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-100 text-center">
                  <span className="text-base sm:text-lg font-black text-stone-900 block">
                    {site.about_section?.experience_years || '8+ Years'}
                  </span>
                  <span className="text-[10px] sm:text-xs text-stone-500 font-medium block mt-0.5">
                    Experience
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 text-center">
                  <span className="text-base sm:text-lg font-black text-stone-900 block">
                    {site.about_section?.brides_styled || '500+'}
                  </span>
                  <span className="text-[10px] sm:text-xs text-stone-500 font-medium block mt-0.5">
                    Happy Brides
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-100 text-center">
                  <span className="text-base sm:text-lg font-black text-stone-900 block">
                    {site.about_section?.awards_count || '15+'}
                  </span>
                  <span className="text-[10px] sm:text-xs text-stone-500 font-medium block mt-0.5">
                    Bridal Awards
                  </span>
                </div>
              </div>



              <div className="pt-2">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl brand-gradient text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02]"
                >
                  <span>Book Consultation &amp; Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Signature Bridal Packages */}
      {packages.length > 0 && (
        <section id="packages" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold">
              <Crown className="w-3.5 h-3.5 text-orange-600" />
              <span>Signature Collections</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              Curated Bridal Packages
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              Complete, worry-free bridal packages including HD makeup, traditional saree draping, floral hair design, and bridal touch-ups.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {packages.map((pkg, idx) => {
              const isPopular = idx === 0 || packages.length === 1;
              const priceRupees = Number(pkg.price_paise || 0) / 100;
              return (
                <div
                  key={pkg.id}
                  className={`p-6 sm:p-8 rounded-3xl transition-all flex flex-col justify-between relative bg-white ${
                    isPopular
                      ? 'border-2 border-orange-500 shadow-xl shadow-orange-500/10 scale-[1.01]'
                      : 'border border-orange-100 shadow-sm hover:shadow-md'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[11px] font-extrabold shadow-sm tracking-wide uppercase">
                      Most Popular Bridal Choice
                    </span>
                  )}

                  <div className="space-y-5">
                    <div>
                      <h3 className="text-xl font-bold text-stone-900">{pkg.name}</h3>
                      {pkg.description && (
                        <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                          {pkg.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-orange-50 flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-stone-900">
                        ₹{priceRupees.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-stone-400 font-medium">all-inclusive</span>
                    </div>

                    {pkg.included_services?.length > 0 && (
                      <div className="space-y-3 pt-3 border-t border-stone-100">
                        <span className="text-[11px] font-bold text-orange-900 uppercase tracking-wider block">
                          Included Services
                        </span>
                        <ul className="space-y-2 text-xs text-stone-700">
                          {pkg.included_services.map((svc) => (
                            <li key={svc.id} className="flex items-start gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="font-medium">{svc.name}</span>
                              {svc.duration_minutes > 0 && (
                                <span className="text-[10px] text-stone-400 ml-auto shrink-0">
                                  {svc.duration_minutes}m
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="pt-8">
                    <a
                      href="#contact"
                      onClick={() =>
                        setEnquiryForm((prev) => ({
                          ...prev,
                          service_interested: `Package: ${pkg.name}`,
                        }))
                      }
                      className={`w-full py-3 rounded-xl text-xs font-bold text-center block transition-all shadow-sm ${
                        isPopular
                          ? 'brand-gradient shadow-md text-white'
                          : 'bg-stone-900 hover:bg-black text-white'
                      }`}
                    >
                      Enquire for this Package
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. A La Carte Services Menu */}
      {services.length > 0 && (
        <section id="services" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>A La Carte Offerings</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              Individual Makeover &amp; Styling Menu
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              Standalone bridal and ceremony services crafted with premium international cosmetics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((svc) => {
              const priceRupees = Number(svc.default_price_paise || 0) / 100;
              return (
                <div
                  key={svc.id}
                  className="p-6 bg-white border border-orange-100/90 rounded-2xl shadow-2xs hover:shadow-md hover:border-orange-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-stone-900 text-base">{svc.name}</h3>
                      {svc.duration_minutes > 0 && (
                        <span className="text-[11px] font-semibold text-stone-600 px-2 py-0.5 rounded-lg bg-orange-50 border border-orange-200/60 shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-orange-500" />
                          {svc.duration_minutes}m
                        </span>
                      )}
                    </div>

                    {svc.description && (
                      <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                        {svc.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-orange-50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-400 block font-medium">Starting from</span>
                      <span className="font-black text-stone-900 text-base">
                        {priceRupees > 0 ? `₹${priceRupees.toLocaleString('en-IN')}` : 'Custom Quote'}
                      </span>
                    </div>
                    <a
                      href="#contact"
                      onClick={() =>
                        setEnquiryForm((prev) => ({
                          ...prev,
                          service_interested: svc.name,
                        }))
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
                    >
                      Enquire &rarr;
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. Portfolio / Bridal Lookbook Showcase */}
      {portfolio.length > 0 && (
        <section id="portfolio" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold">
              <Star className="w-3.5 h-3.5 text-orange-600 fill-orange-500" />
              <span>Bridal Lookbook</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              Real Muhurtham &amp; Reception Artistry
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              Moments of grace, happiness, and authentic bridal radiance captured by our studio.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {portfolio.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl overflow-hidden border border-orange-100 shadow-sm hover:shadow-2xl transition-all duration-300 group flex flex-col"
              >
                {/* Full portrait aspect ratio (3/4) so whole face, jewelry and saree are clearly visible */}
                <div className="relative aspect-[3/4] w-full bg-stone-900 overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title || 'Bridal work'}
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Subtle luxury gradient shadow overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  {item.category && (
                    <span className="absolute top-4 right-4 text-[11px] font-bold px-3 py-1.5 rounded-full bg-stone-900/80 text-white shadow-md backdrop-blur-md border border-white/20">
                      {item.category}
                    </span>
                  )}

                  {/* Title & description floating over image or at bottom for maximum clarity */}
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-white space-y-1.5">
                    {item.title && (
                      <h3 className="font-extrabold text-white text-base sm:text-lg tracking-tight drop-shadow-sm">
                        {item.title}
                      </h3>
                    )}
                    {item.description && (
                      <p className="text-xs text-stone-200 line-clamp-2 leading-relaxed drop-shadow-xs">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Contact & Direct Online Booking Enquiry */}
      <section id="contact" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Studio Contact Information Card */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold">
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
                <span>Reserve Your Wedding Date</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 mt-2 tracking-tight">
                Plan Your Big Day With Us
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-2 leading-relaxed">
                Connect directly with our senior bridal artists. Share your wedding date, venue, and styling wishes to block your date in advance.
              </p>
            </div>

            <div className="p-6 sm:p-7 bg-white border border-orange-100 rounded-3xl shadow-sm space-y-5 text-xs">
              {site.public_address && (
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 mt-0.5 border border-orange-200/60">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 block text-sm">Studio Location</span>
                    <span className="text-stone-600 leading-relaxed block mt-1">
                      {site.public_address}
                    </span>
                  </div>
                </div>
              )}

              {site.contact_phone && (
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 mt-0.5 border border-orange-200/60">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 block text-sm">Phone Enquiries</span>
                    <a href={`tel:${site.contact_phone}`} className="text-orange-700 font-semibold hover:underline mt-1 block">
                      {site.contact_phone}
                    </a>
                  </div>
                </div>
              )}

              {site.contact_email && (
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 mt-0.5 border border-orange-200/60">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 block text-sm">Email Address</span>
                    <a href={`mailto:${site.contact_email}`} className="text-orange-700 font-semibold hover:underline mt-1 block">
                      {site.contact_email}
                    </a>
                  </div>
                </div>
              )}

              {cleanWaNumber && (
                <div className="flex items-start gap-3.5 pt-2 border-t border-orange-50">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/60">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-900 block text-sm">WhatsApp Concierge</span>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 font-bold hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      Chat on WhatsApp (+91 {cleanWaNumber}) &rarr;
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Direct Booking Enquiry Form */}
          <div className="lg:col-span-7">
            <div className="p-7 sm:p-10 bg-white border border-orange-100 rounded-[32px] shadow-md shadow-orange-500/5">
              <h3 className="text-xl font-bold text-stone-900">
                Send a Direct Booking Enquiry
              </h3>
              <p className="text-xs text-stone-500 mt-1 mb-6">
                Tell us about your wedding timeline and chosen makeup services for a personalized quote.
              </p>

              {submitSuccess ? (
                <div className="p-8 sm:p-10 text-center bg-gradient-to-b from-emerald-50/80 to-white rounded-3xl border border-emerald-200 text-emerald-950 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="font-black text-xl">Enquiry Sent Successfully!</h4>
                  <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
                    Thank you for choosing <strong className="text-stone-800">{studioName}</strong>. Our bridal artist will review your details and reach out to you shortly.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSubmitSuccess(false)}
                    className="mt-2 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="space-y-4 text-xs">
                  {submitError && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-stone-800 block mb-1.5">
                        Your Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={enquiryForm.name}
                        onChange={(e) => setEnquiryForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Priyadarshini R"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDF9]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-stone-800 block mb-1.5">
                        Contact Phone <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={enquiryForm.phone}
                        onChange={(e) => setEnquiryForm((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="e.g. 98765 43210"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDF9]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-stone-800 block mb-1.5">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={enquiryForm.email}
                        onChange={(e) => setEnquiryForm((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="name@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDF9]"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-stone-800 block mb-1.5">
                        Ceremony Date
                      </label>
                      <ModernDatePicker
                        value={enquiryForm.event_date}
                        onChange={(val) => {
                          setEnquiryForm((prev) => ({ ...prev, event_date: val }));
                          if (submitError) setSubmitError('');
                        }}
                        placeholder="Pick wedding / ceremony date..."
                        unavailableDates={unavailableDates}
                        disablePastDates={true}
                        error={isSelectedDateBooked}
                        className="w-full"
                      />
                      {isSelectedDateBooked && (
                        <p className="text-xs font-semibold text-rose-600 flex items-center gap-1.5 pt-1 animate-in fade-in">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          This date is already booked. Please choose an available date.
                        </p>
                      )}
                      {enquiryForm.event_date && !isSelectedDateBooked && (
                        <p className="text-xs font-medium text-emerald-600 flex items-center gap-1.5 pt-1 animate-in fade-in">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          Date is available for booking!
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-stone-800 block mb-1.5">
                        Ceremony Type
                      </label>
                      <ModernDropdown
                        value={enquiryForm.event_type}
                        onChange={(val) => setEnquiryForm((prev) => ({ ...prev, event_type: val }))}
                        options={CEREMONY_TYPE_OPTIONS}
                        placeholder="Select ceremony type..."
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-stone-800 block mb-1.5">
                        Selected Service / Package
                      </label>
                      <input
                        type="text"
                        value={enquiryForm.service_interested}
                        onChange={(e) => setEnquiryForm((prev) => ({ ...prev, service_interested: e.target.value }))}
                        placeholder="e.g. Signature Bridal Package"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDF9]"
                      />
                    </div>
                  </div>

                  {/* Consultation Appointment Availability Picker */}
                  <div className="p-4 rounded-2xl bg-orange-50/40 border border-orange-200/70 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#F97316]" />
                      <span className="font-bold text-stone-900 text-xs sm:text-sm">
                        Schedule a Free Bridal Consultation / Trial (Optional)
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Pick a preferred consultation date and available studio slot. Slots are requested until confirmed by the studio.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="font-semibold text-stone-700 block mb-1 text-[11px]">
                          Preferred Consultation Date
                        </label>
                        <ModernDatePicker
                          value={enquiryForm.consultation_date}
                          onChange={(val) => {
                            setEnquiryForm((prev) => ({
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
                        {!enquiryForm.consultation_date ? (
                          <div className="px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-400 text-xs">
                            Select a consultation date first
                          </div>
                        ) : isSlotLoading ? (
                          <div className="px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-500 text-xs flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            Checking real-time studio availability...
                          </div>
                        ) : availableSlots.filter((s) => s.is_available).length === 0 ? (
                          <div className="px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs">
                            No available slots on this date. Please choose another date.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-32 overflow-y-auto p-1 bg-white rounded-xl border border-stone-200">
                            {availableSlots.map((slot) => (
                              <button
                                key={slot.time}
                                type="button"
                                disabled={!slot.is_available}
                                onClick={() =>
                                  setEnquiryForm((prev) => ({
                                    ...prev,
                                    consultation_time: slot.time,
                                  }))
                                }
                                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all text-center cursor-pointer ${
                                  enquiryForm.consultation_time === slot.time
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
                        {enquiryForm.consultation_time && (
                          <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Slot {enquiryForm.consultation_time} selected
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-stone-800 block mb-1.5">
                      Event Venue &amp; Special Notes
                    </label>
                    <textarea
                      rows={3}
                      value={enquiryForm.message}
                      onChange={(e) => setEnquiryForm((prev) => ({ ...prev, message: e.target.value }))}
                      placeholder="Share details like ceremony venue location, timings, or how many guests require styling..."
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-[#FFFDF9]"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      size="md"
                      isLoading={isSubmitting}
                      className="w-full text-white font-bold py-3.5 rounded-2xl shadow-md brand-gradient transition-all text-sm cursor-pointer"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submit Bridal Booking Enquiry
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 8. Modern Interactive Footer */}
      {/* 8. Modern Interactive Footer with Customizable Settings */}
      <div className="w-full">
        {/* Glow decoration */}
        <div className="w-full bg-[#FFFDF9] pt-8 pb-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 border border-orange-500/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Wedding Dates 2026-2027 Open</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Ready to Experience Your Dream Bridal Look?
                </h3>
                <p className="text-xs text-stone-400 max-w-xl leading-relaxed">
                  Book early to lock in senior artists, complimentary trial consultations, and priority styling slots.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Instant WhatsApp</span>
                  </a>
                )}
                <a
                  href="#contact"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-orange-900/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>Reserve Consultation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Customizable Footer */}
        <CustomizableFooter
          footerSettings={site.footer_settings || {}}
          business={site.business || { name: studioName, city: studioCity, state: studioState }}
          businessHours={site.business_hours || []}
          servicesCount={services.length}
          packagesCount={packages.length}
          portfolioCount={portfolio.length}
          slug={slug}
          isPreview={false}
        />
      </div>
    </div>
  );
}
