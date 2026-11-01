'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layout,
  Palette,
  Share2,
  Navigation,
  Phone,
  Mail,
  MapPin,
  Clock,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Check,
  Eye,
  AlertCircle,
  HelpCircle,
  Smartphone,
  Tablet,
  Monitor,
  Upload,
  Image as ImageIcon,
  X,
  FileImage,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import CustomizableFooter, {
  SOCIAL_PLATFORM_CONFIG,
  validateSocialLink,
  formatWhatsAppUrl,
} from './CustomizableFooter';

const DEFAULT_QUICK_LINKS = [
  { id: 'home', label: 'Home', url: '#', enabled: true },
  { id: 'about', label: 'About Us', url: '#about', enabled: true },
  { id: 'services', label: 'Services', url: '#services', enabled: true },
  { id: 'packages', label: 'Packages', url: '#packages', enabled: true },
  { id: 'portfolio', label: 'Portfolio', url: '#portfolio', enabled: true },
  { id: 'contact', label: 'Contact Us', url: '#contact', enabled: true },
];

const PRESET_BG_COLORS = [
  { label: 'Obsidian Dark', value: '#1C1917' },
  { label: 'Deep Charcoal', value: '#111827' },
  { label: 'Warm Espresso', value: '#271B16' },
  { label: 'Midnight Blue', value: '#0F172A' },
  { label: 'Plum Noir', value: '#231224' },
  { label: 'Clean Ivory', value: '#FDFBF7' },
];

const PRESET_TEXT_COLORS = [
  { label: 'Muted Stone', value: '#A8A29E' },
  { label: 'Cool Slate', value: '#94A3B8' },
  { label: 'Warm Cream', value: '#E7E5E4' },
  { label: 'Pure White', value: '#F8FAFC' },
  { label: 'Charcoal (for light bg)', value: '#374151' },
];

const PRESET_ACCENT_COLORS = [
  { label: 'Primary Orange', value: '#F97316' },
  { label: 'Bridal Gold', value: '#D4AF37' },
  { label: 'Rose Gold', value: '#E07A5F' },
  { label: 'Emerald Green', value: '#059669' },
  { label: 'Crimson Vermillion', value: '#DC2626' },
];

export default function FooterBuilderSection({
  footerData = null,
  business = {},
  businessHours = [],
  servicesCount = 0,
  packagesCount = 0,
  portfolioCount = 0,
  slug = '',
  onSave,
  onChange,
  isSaving = false,
  onPreviewWebsite,
  onPublishWebsite,
  isPublishing = false,
}) {
  const currentYear = new Date().getFullYear();

  // Primary State
  const [footerState, setFooterState] = useState({
    studio_name: '',
    logo_url: '',
    description: 'Bridal makeup artistry for your most memorable moments.',
    layout: 'multi_column',
    background_color: '#1C1917',
    text_color: '#A8A29E',
    accent_color: '#F97316',
    copyright_text: `© {currentYear} {businessName}. All rights reserved.`,
    show_logo: true,
    show_social_links: true,
    show_quick_links: true,
    show_contact_info: true,
    show_copyright: true,
    social_links: [
      { platform: 'instagram', url: '', enabled: true },
      { platform: 'facebook', url: '', enabled: false },
      { platform: 'youtube', url: '', enabled: false },
      { platform: 'whatsapp', url: '', enabled: true },
      { platform: 'pinterest', url: '', enabled: false },
      { platform: 'linkedin', url: '', enabled: false },
    ],
    quick_links: DEFAULT_QUICK_LINKS,
    contact_settings: {
      phone: '',
      show_phone: true,
      email: '',
      show_email: true,
      address: '',
      show_address: true,
      map_url: '',
      show_map: true,
      show_hours: true,
    },
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [activeBuilderTab, setActiveBuilderTab] = useState('branding'); // 'branding' | 'social' | 'links' | 'contact' | 'layout'
  const [isDirty, setIsDirty] = useState(false);
  const [previewViewport, setPreviewViewport] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [logoUploadMode, setLogoUploadMode] = useState('upload'); // 'upload' | 'url'

  const processLogoFile = (file) => {
    if (!file) return;

    const validTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/svg+xml',
      'image/avif',
      'image/gif',
    ];

    if (!validTypes.includes(file.type)) {
      setValidationErrors((prev) => ({
        ...prev,
        logo: 'Please upload a PNG, JPG, WebP, SVG, AVIF, or GIF image.',
      }));
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setValidationErrors((prev) => ({
        ...prev,
        logo: 'Logo file size must be less than 4MB.',
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result;
      if (dataUri) {
        updateState({ logo_url: dataUri });
        setValidationErrors((prev) => ({ ...prev, logo: '' }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Sync initial / fetched footerData
  useEffect(() => {
    if (footerData) {
      const socialPlatforms = ['instagram', 'facebook', 'youtube', 'whatsapp', 'pinterest', 'linkedin'];
      const existingSocial = Array.isArray(footerData.social_links) ? footerData.social_links : [];
      const mergedSocial = socialPlatforms.map((p) => {
        const found = existingSocial.find((s) => s.platform === p);
        if (found) return found;
        if (p === 'whatsapp') {
          return {
            platform: p,
            url: business?.business_phone || '',
            enabled: Boolean(business?.business_phone),
          };
        }
        return { platform: p, url: '', enabled: false };
      });

      setFooterState({
        studio_name: footerData.studio_name || business.name || '',
        logo_url: footerData.logo_url || business.logo_url || '',
        description:
          footerData.description || 'Bridal makeup artistry for your most memorable moments.',
        layout: footerData.layout || 'multi_column',
        background_color: footerData.background_color || '#1C1917',
        text_color: footerData.text_color || '#A8A29E',
        accent_color: footerData.accent_color || '#F97316',
        copyright_text:
          footerData.copyright_text || `© {currentYear} {businessName}. All rights reserved.`,
        show_logo: footerData.show_logo ?? true,
        show_social_links: footerData.show_social_links ?? true,
        show_quick_links: footerData.show_quick_links ?? true,
        show_contact_info: footerData.show_contact_info ?? true,
        show_copyright: footerData.show_copyright ?? true,
        social_links: mergedSocial,
        quick_links:
          Array.isArray(footerData.quick_links) && footerData.quick_links.length > 0
            ? footerData.quick_links
            : DEFAULT_QUICK_LINKS,
        contact_settings: {
          phone: footerData.contact_settings?.phone ?? (business?.business_phone || ''),
          show_phone: footerData.contact_settings?.show_phone ?? true,
          email: footerData.contact_settings?.email ?? (business?.business_email || ''),
          show_email: footerData.contact_settings?.show_email ?? true,
          address:
            footerData.contact_settings?.address ??
            (business?.city && business?.state
              ? `${business.city}, ${business.state}`
              : business?.city || ''),
          show_address: footerData.contact_settings?.show_address ?? true,
          map_url: footerData.contact_settings?.map_url ?? '',
          show_map: footerData.contact_settings?.show_map ?? true,
          show_hours: footerData.contact_settings?.show_hours ?? true,
        },
      });
      setIsDirty(false);
    }
  }, [footerData, business]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes in your website footer builder.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Helper to mutate nested state and mark dirty
  const updateState = (updater) => {
    setFooterState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      return next;
    });
    setIsDirty(true);
  };

  // Synchronize state changes to parent outside the render phase
  useEffect(() => {
    if (onChange && isDirty) {
      onChange(footerState);
    }
  }, [footerState, isDirty, onChange]);

  // Social link change
  const handleSocialChange = (platform, field, val) => {
    updateState((prev) => {
      const list = prev.social_links.map((s) => {
        if (s.platform === platform) {
          return { ...s, [field]: val };
        }
        return s;
      });
      return { ...prev, social_links: list };
    });

    if (field === 'url') {
      const res = validateSocialLink(platform, val);
      setValidationErrors((prev) => ({
        ...prev,
        [`social_${platform}`]: res.isValid ? '' : res.message,
      }));
    }
  };

  // Quick links helpers
  const handleAddQuickLink = () => {
    const newId = `link_${Date.now()}`;
    updateState((prev) => ({
      ...prev,
      quick_links: [
        ...prev.quick_links,
        { id: newId, label: 'New Link', url: '#', enabled: true },
      ],
    }));
  };

  const handleUpdateQuickLink = (idx, field, val) => {
    updateState((prev) => {
      const updated = [...prev.quick_links];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, quick_links: updated };
    });
  };

  const handleDeleteQuickLink = (idx) => {
    updateState((prev) => {
      const updated = prev.quick_links.filter((_, i) => i !== idx);
      return { ...prev, quick_links: updated };
    });
  };

  const handleMoveQuickLink = (idx, direction) => {
    updateState((prev) => {
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.quick_links.length) return prev;
      const updated = [...prev.quick_links];
      const temp = updated[idx];
      updated[idx] = updated[targetIdx];
      updated[targetIdx] = temp;
      return { ...prev, quick_links: updated };
    });
  };

  const handleRestoreDefaultLinks = () => {
    updateState({ quick_links: DEFAULT_QUICK_LINKS });
  };

  // Save validation check
  const handleSubmitSave = (e) => {
    if (e) e.preventDefault();

    // Check all enabled social links for validation errors
    let hasErr = false;
    const newErrors = {};

    footerState.social_links.forEach((s) => {
      if (s.enabled && s.url && s.url.trim()) {
        const valRes = validateSocialLink(s.platform, s.url);
        if (!valRes.isValid) {
          hasErr = true;
          newErrors[`social_${s.platform}`] = valRes.message;
        }
      }
    });

    setValidationErrors(newErrors);

    if (hasErr) {
      setActiveBuilderTab('social');
      return;
    }

    if (onSave) {
      onSave(footerState, () => setIsDirty(false));
    }
  };

  return (
    <div id="website-footer-builder" className="pt-8 mt-12 border-t border-stone-200">
      {/* Header section with brand orange accents */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">
              Website Footer Customization
            </h2>
            {isDirty && (
              <Badge variant="warning" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                Unsaved Changes
              </Badge>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Personalize your luxury studio brand footer, social presence, quick navigation, and contact columns.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onPreviewWebsite && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPreviewWebsite}
              className="text-xs border-stone-300 text-stone-700 hover:bg-stone-50"
            >
              <Eye className="w-3.5 h-3.5 mr-1 text-stone-500" />
              Preview Website
            </Button>
          )}

          {onPublishWebsite && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onPublishWebsite}
              isLoading={isPublishing}
              className="text-xs bg-stone-900 hover:bg-stone-800 text-white"
            >
              Publish Website
            </Button>
          )}

          {onSave && (
            <Button
              type="button"
              size="sm"
              onClick={handleSubmitSave}
              isLoading={isSaving}
              disabled={isSaving}
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs"
            >
              Save Footer Settings
            </Button>
          )}
        </div>
      </div>

      {/* Vertical Stack: Full-Width Settings Cards on Top, Full-Width Live Preview at Bottom */}
      <div className="space-y-10">
        {/* TOP: BUILDER SETTINGS CARD */}
        <div className="w-full space-y-6">
          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100/90 rounded-2xl border border-stone-200/80 overflow-x-auto text-xs scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveBuilderTab('branding')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeBuilderTab === 'branding'
                  ? 'bg-white text-orange-600 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Branding &amp; Colors</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveBuilderTab('social')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeBuilderTab === 'social'
                  ? 'bg-white text-orange-600 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Social Media</span>
              {footerState.social_links.filter((s) => s.enabled && s.url).length > 0 && (
                <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold flex items-center justify-center">
                  {footerState.social_links.filter((s) => s.enabled && s.url).length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveBuilderTab('links')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeBuilderTab === 'links'
                  ? 'bg-white text-orange-600 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Quick Links</span>
              <span className="w-4 h-4 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold flex items-center justify-center">
                {footerState.quick_links.filter((l) => l.enabled).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveBuilderTab('contact')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeBuilderTab === 'contact'
                  ? 'bg-white text-orange-600 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Contact Info</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveBuilderTab('layout')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeBuilderTab === 'layout'
                  ? 'bg-white text-orange-600 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Layout &amp; Visibility</span>
            </button>
          </div>

          {/* TAB 1: FOOTER BRANDING & COLORS */}
          {activeBuilderTab === 'branding' && (
            <Card className="p-6 border border-stone-200 shadow-xs bg-white space-y-6">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  Footer Branding &amp; Palette
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Configure studio identity, personalized footer bio, custom colors, and copyright attribution.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Studio / Business Name
                  </label>
                  <input
                    type="text"
                    value={footerState.studio_name}
                    onChange={(e) => updateState({ studio_name: e.target.value })}
                    placeholder={business.name || 'Your Bridal Studio'}
                    className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">Prepopulated from your business profile.</p>
                </div>

                {/* Footer Logo Drag & Drop UI */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                      <span>Footer Logo</span>
                      <span className="text-[10px] font-normal text-stone-400">(Drag & Drop or Upload)</span>
                    </label>
                    <div className="flex items-center gap-1 text-[11px] bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                      <button
                        type="button"
                        onClick={() => setLogoUploadMode('upload')}
                        className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
                          logoUploadMode === 'upload'
                            ? 'bg-white text-orange-600 font-bold shadow-xs'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        File Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoUploadMode('url')}
                        className={`px-2.5 py-0.5 rounded-md font-medium transition-all ${
                          logoUploadMode === 'url'
                            ? 'bg-white text-orange-600 font-bold shadow-xs'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        Image URL
                      </button>
                    </div>
                  </div>

                  {logoUploadMode === 'upload' ? (
                    <div>
                      {footerState.logo_url ? (
                        <div className="relative p-3 bg-orange-50/30 border border-orange-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:border-orange-300 transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-14 h-14 rounded-xl bg-white border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center p-1.5 shadow-2xs">
                              <img
                                src={footerState.logo_url}
                                alt="Footer Logo Preview"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-stone-800 truncate">
                                  Footer Logo Active
                                </span>
                                <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                                  Ready
                                </span>
                              </div>
                              <span className="text-[11px] text-stone-500 block truncate mt-0.5">
                                Drag new image over this card to replace
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <label
                              className="px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-orange-600 bg-white hover:bg-orange-50 border border-stone-200 hover:border-orange-200 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Replace Logo"
                            >
                              <Upload className="w-3.5 h-3.5 text-orange-500" />
                              <span>Replace</span>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/avif"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) processLogoFile(e.target.files[0]);
                                }}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                updateState({ logo_url: '' });
                                setValidationErrors((prev) => {
                                  const n = { ...prev };
                                  delete n.logo;
                                  return n;
                                });
                              }}
                              className="p-1.5 text-stone-400 hover:text-red-600 bg-white hover:bg-red-50 border border-stone-200 hover:border-red-200 rounded-lg transition-all shadow-2xs"
                              title="Remove Logo"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingLogo(true);
                          }}
                          onDragEnter={(e) => {
                            e.preventDefault();
                            setIsDraggingLogo(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            setIsDraggingLogo(false);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingLogo(false);
                            if (e.dataTransfer.files?.[0]) {
                              processLogoFile(e.dataTransfer.files[0]);
                            }
                          }}
                          className={`group relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
                            isDraggingLogo
                              ? 'border-orange-500 bg-orange-100/50 scale-[0.99] ring-4 ring-orange-500/10'
                              : 'border-stone-300 hover:border-orange-400 bg-stone-50/70 hover:bg-orange-50/30'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-110 shadow-2xs ${
                            isDraggingLogo ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'
                          }`}>
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-stone-800 text-center">
                            {isDraggingLogo ? 'Drop image here to upload' : 'Drag & drop footer logo here'}
                          </span>
                          <span className="text-[11px] text-stone-500 mt-0.5 text-center">
                            or <span className="text-orange-600 font-semibold underline underline-offset-2">browse from computer</span>
                          </span>
                          <span className="text-[10px] text-stone-400 mt-1">
                            Supports PNG, JPG, WebP, SVG, AVIF (Max 4MB)
                          </span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/avif"
                            onChange={(e) => {
                              if (e.target.files?.[0]) processLogoFile(e.target.files[0]);
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="relative">
                        <input
                          type="url"
                          value={footerState.logo_url}
                          onChange={(e) => updateState({ logo_url: e.target.value })}
                          placeholder={business.logo_url || 'https://example.com/logo.png'}
                          className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                        {footerState.logo_url && (
                          <button
                            type="button"
                            onClick={() => updateState({ logo_url: '' })}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1">Leave empty to use main business logo.</p>
                    </div>
                  )}

                  {validationErrors.logo && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-red-600 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{validationErrors.logo}</span>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Short Business Footer Description
                  </label>
                  <textarea
                    rows={2}
                    value={footerState.description}
                    onChange={(e) => updateState({ description: e.target.value })}
                    placeholder="Bridal makeup artistry for your most memorable moments."
                    className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Editable here independently without modifying your main website description.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Copyright Line
                  </label>
                  <input
                    type="text"
                    value={footerState.copyright_text}
                    onChange={(e) => updateState({ copyright_text: e.target.value })}
                    placeholder="© {currentYear} {businessName}. All rights reserved."
                    className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Supports <code className="text-orange-600 font-mono font-semibold">{"{currentYear}"}</code> and{' '}
                    <code className="text-orange-600 font-mono font-semibold">{"{businessName}"}</code> tags.
                  </p>
                </div>
              </div>

              {/* Color Customizer */}
              <div className="pt-4 border-t border-stone-100 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                  Color Palette
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Background Color */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Footer Background
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={footerState.background_color}
                        onChange={(e) => updateState({ background_color: e.target.value })}
                        className="w-9 h-9 rounded-xl border border-stone-300 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={footerState.background_color}
                        onChange={(e) => updateState({ background_color: e.target.value })}
                        className="w-24 px-2 py-1.5 border border-stone-200 rounded-lg text-xs font-mono uppercase"
                      />
                    </div>
                    {/* Preset Swatches */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {PRESET_BG_COLORS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => updateState({ background_color: p.value })}
                          title={p.label}
                          className="w-5 h-5 rounded-md border border-stone-300 shadow-2xs hover:scale-110 transition-transform"
                          style={{ backgroundColor: p.value }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Text Color */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={footerState.text_color}
                        onChange={(e) => updateState({ text_color: e.target.value })}
                        className="w-9 h-9 rounded-xl border border-stone-300 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={footerState.text_color}
                        onChange={(e) => updateState({ text_color: e.target.value })}
                        className="w-24 px-2 py-1.5 border border-stone-200 rounded-lg text-xs font-mono uppercase"
                      />
                    </div>
                    {/* Preset Swatches */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {PRESET_TEXT_COLORS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => updateState({ text_color: p.value })}
                          title={p.label}
                          className="w-5 h-5 rounded-md border border-stone-300 shadow-2xs hover:scale-110 transition-transform"
                          style={{ backgroundColor: p.value }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={footerState.accent_color}
                        onChange={(e) => updateState({ accent_color: e.target.value })}
                        className="w-9 h-9 rounded-xl border border-stone-300 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={footerState.accent_color}
                        onChange={(e) => updateState({ accent_color: e.target.value })}
                        className="w-24 px-2 py-1.5 border border-stone-200 rounded-lg text-xs font-mono uppercase"
                      />
                    </div>
                    {/* Preset Swatches */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {PRESET_ACCENT_COLORS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => updateState({ accent_color: p.value })}
                          title={p.label}
                          className="w-5 h-5 rounded-md border border-stone-300 shadow-2xs hover:scale-110 transition-transform"
                          style={{ backgroundColor: p.value }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* TAB 2: SOCIAL MEDIA LINKS */}
          {activeBuilderTab === 'social' && (
            <Card className="p-6 border border-stone-200 shadow-xs bg-white space-y-5">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-orange-600" />
                  Social Media Presence
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Link your studio Instagram, WhatsApp, YouTube, and Facebook accounts. Only enabled channels with valid URLs will appear.
                </p>
              </div>

              <div className="space-y-3.5">
                {footerState.social_links.map((item) => {
                  const conf = SOCIAL_PLATFORM_CONFIG[item.platform] || {};
                  const Icon = conf.icon;
                  const err = validationErrors[`social_${item.platform}`];

                  return (
                    <div
                      key={item.platform}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        item.enabled ? 'bg-white border-stone-200 shadow-2xs' : 'bg-stone-50/70 border-stone-200/60 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-[140px]">
                          <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                            {Icon && <Icon className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-stone-800 block">{conf.name}</span>
                            <span className="text-[10px] text-stone-400">
                              {item.enabled ? 'Active channel' : 'Disabled'}
                            </span>
                          </div>
                        </div>

                        {/* Input & Toggle */}
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={item.url}
                            disabled={!item.enabled}
                            onChange={(e) => handleSocialChange(item.platform, 'url', e.target.value)}
                            placeholder={conf.placeholder}
                            className={`w-full px-3 py-1.5 bg-white border rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                              err ? 'border-red-400 focus:border-red-500' : 'border-stone-200 focus:border-orange-500'
                            }`}
                          />

                          {/* Toggle switch */}
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={item.enabled}
                              onChange={(e) => handleSocialChange(item.platform, 'enabled', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600" />
                          </label>
                        </div>
                      </div>

                      {err && (
                        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-red-600">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{err}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* TAB 3: QUICK LINKS MANAGER */}
          {activeBuilderTab === 'links' && (
            <Card className="p-6 border border-stone-200 shadow-xs bg-white space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-orange-600" />
                    Quick Navigation Links
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Customize footer links. Reorder, add custom links, or restore defaults.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleRestoreDefaultLinks}
                    className="text-xs text-stone-600"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Restore Defaults
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddQuickLink}
                    className="text-xs bg-orange-600 hover:bg-orange-700 text-white font-medium"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Custom Link
                  </Button>
                </div>
              </div>

              {/* Link rows */}
              <div className="space-y-2.5 pt-1">
                {footerState.quick_links.map((link, idx) => (
                  <div
                    key={link.id || idx}
                    className="p-3 bg-stone-50/70 border border-stone-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Order buttons */}
                    <div className="flex items-center gap-1 text-stone-400 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveQuickLink(idx, 'up')}
                        className="p-1 hover:text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === footerState.quick_links.length - 1}
                        onClick={() => handleMoveQuickLink(idx, 'down')}
                        className="p-1 hover:text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Inputs */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => handleUpdateQuickLink(idx, 'label', e.target.value)}
                        placeholder="Link Label (e.g. Services)"
                        className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:border-orange-500"
                      />
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => handleUpdateQuickLink(idx, 'url', e.target.value)}
                        placeholder="Destination URL (e.g. #services)"
                        className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-mono text-stone-700 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* Actions: Enable Toggle & Delete */}
                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={link.enabled}
                          onChange={(e) => handleUpdateQuickLink(idx, 'enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-orange-600" />
                      </label>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuickLink(idx)}
                        className="p-1.5 text-stone-400 hover:text-red-600 transition-colors"
                        title="Delete Link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl flex items-start gap-2 text-xs text-amber-800">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Entitlement Guard:</strong> Links to Services, Packages, or Portfolio will automatically hide from the published website if the corresponding feature is empty or not enabled in your plan.
                </span>
              </div>
            </Card>
          )}

          {/* TAB 4: CONTACT INFORMATION */}
          {activeBuilderTab === 'contact' && (
            <Card className="p-6 border border-stone-200 shadow-xs bg-white space-y-5">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-orange-600" />
                  Studio Contact Information
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Prepopulated from your business profile. Toggle visibility for each detail shown in the footer.
                </p>
              </div>

              <div className="space-y-4">
                {/* Phone */}
                <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Business Phone Number
                    </label>
                    <input
                      type="text"
                      value={footerState.contact_settings.phone}
                      onChange={(e) =>
                        updateState((prev) => ({
                          ...prev,
                          contact_settings: { ...prev.contact_settings, phone: e.target.value },
                        }))
                      }
                      placeholder={business.business_phone || '+91 98765 43210'}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className="text-xs text-stone-500">Show on footer</span>
                    <input
                      type="checkbox"
                      checked={footerState.contact_settings.show_phone}
                      onChange={(e) =>
                        updateState((prev) => ({
                          ...prev,
                          contact_settings: { ...prev.contact_settings, show_phone: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 accent-orange-600 rounded"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Business Email Address
                    </label>
                    <input
                      type="email"
                      value={footerState.contact_settings.email}
                      onChange={(e) =>
                        updateState((prev) => ({
                          ...prev,
                          contact_settings: { ...prev.contact_settings, email: e.target.value },
                        }))
                      }
                      placeholder={business.business_email || 'studio@example.com'}
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className="text-xs text-stone-500">Show on footer</span>
                    <input
                      type="checkbox"
                      checked={footerState.contact_settings.show_email}
                      onChange={(e) =>
                        updateState((prev) => ({
                          ...prev,
                          contact_settings: { ...prev.contact_settings, show_email: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 accent-orange-600 rounded"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Studio Address
                    </label>
                    <input
                      type="text"
                      value={footerState.contact_settings.address}
                      onChange={(e) =>
                        updateState((prev) => ({
                          ...prev,
                          contact_settings: { ...prev.contact_settings, address: e.target.value },
                        }))
                      }
                      placeholder="e.g. 12 Anna Nagar, Madurai, Tamil Nadu"
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className="text-xs text-stone-500">Show on footer</span>
                    <input
                      type="checkbox"
                      checked={footerState.contact_settings.show_address}
                      onChange={(e) =>
                        updateState((prev) => ({
                          ...prev,
                          contact_settings: { ...prev.contact_settings, show_address: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 accent-orange-600 rounded"
                    />
                  </div>
                </div>

                {/* Google Maps URL */}
                <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Google Maps Direction URL
                    </label>
                    <input
                      type="url"
                      value={footerState.contact_settings.map_url}
                      onChange={(e) =>
                        updateState((prev) => ({
                          ...prev,
                          contact_settings: { ...prev.contact_settings, map_url: e.target.value },
                        }))
                      }
                      placeholder="https://maps.google.com/..."
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-orange-500"
                    />
                    <p className="text-[11px] text-stone-400 mt-1">
                      When provided, the footer address links directly to Google Maps navigation for clients.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className="text-xs text-stone-500">Make clickable</span>
                    <input
                      type="checkbox"
                      checked={footerState.contact_settings.show_map}
                      onChange={(e) =>
                        updateState((prev) => ({
                          ...prev,
                          contact_settings: { ...prev.contact_settings, show_map: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 accent-orange-600 rounded"
                    />
                  </div>
                </div>

                {/* Studio Hours toggle */}
                <div className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-stone-800 block">
                      Include Daily Studio Working Hours
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Renders the opening &amp; closing schedule configured in Business Hours.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={footerState.contact_settings.show_hours}
                    onChange={(e) =>
                      updateState((prev) => ({
                        ...prev,
                        contact_settings: { ...prev.contact_settings, show_hours: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 accent-orange-600 rounded"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* TAB 5: LAYOUT & VISIBILITY TOGGLES */}
          {activeBuilderTab === 'layout' && (
            <Card className="p-6 border border-stone-200 shadow-xs bg-white space-y-6">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Layout className="w-4 h-4 text-orange-600" />
                  Footer Layout Structure
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Choose from 3 elegant layouts crafted for wedding salons and bridal makeup studios.
                </p>
              </div>

              {/* 3 Layout Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Multi-column */}
                <div
                  onClick={() => updateState({ layout: 'multi_column' })}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    footerState.layout === 'multi_column'
                      ? 'border-orange-500 bg-orange-50/40 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-900">Multi-column</span>
                    {footerState.layout === 'multi_column' && (
                      <Check className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  <div className="h-14 rounded-lg bg-stone-100 p-2 flex gap-1">
                    <div className="w-1/3 bg-stone-300 rounded-sm" />
                    <div className="w-1/4 bg-stone-300 rounded-sm" />
                    <div className="w-1/4 bg-stone-300 rounded-sm" />
                    <div className="w-1/4 bg-stone-300 rounded-sm" />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-2">
                    Separate columns for branding, quick links, hours, and contact info.
                  </p>
                </div>

                {/* Centered */}
                <div
                  onClick={() => updateState({ layout: 'centered' })}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    footerState.layout === 'centered'
                      ? 'border-orange-500 bg-orange-50/40 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-900">Centered</span>
                    {footerState.layout === 'centered' && (
                      <Check className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  <div className="h-14 rounded-lg bg-stone-100 p-2 flex flex-col items-center justify-center gap-1">
                    <div className="w-10 h-3 bg-stone-300 rounded-sm" />
                    <div className="w-20 h-2 bg-stone-300 rounded-sm" />
                    <div className="w-16 h-2 bg-stone-300 rounded-sm" />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-2">
                    Sleek, symmetrical presentation with centered branding, links, and social icons.
                  </p>
                </div>

                {/* Classic */}
                <div
                  onClick={() => updateState({ layout: 'classic' })}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    footerState.layout === 'classic'
                      ? 'border-orange-500 bg-orange-50/40 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-900">Classic</span>
                    {footerState.layout === 'classic' && (
                      <Check className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  <div className="h-14 rounded-lg bg-stone-100 p-2 flex justify-between items-center">
                    <div className="w-1/3 h-8 bg-stone-300 rounded-sm" />
                    <div className="w-1/3 h-8 bg-stone-300 rounded-sm" />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-2">
                    Branding &amp; contact on the left; navigation &amp; social media on the right.
                  </p>
                </div>
              </div>

              {/* Master Visibility Toggles */}
              <div className="pt-4 border-t border-stone-100 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                  Element Visibility Toggles
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50/60">
                    <span className="text-xs font-medium text-stone-800">Show Studio Logo</span>
                    <input
                      type="checkbox"
                      checked={footerState.show_logo}
                      onChange={(e) => updateState({ show_logo: e.target.checked })}
                      className="w-4 h-4 accent-orange-600 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50/60">
                    <span className="text-xs font-medium text-stone-800">Show Social Media Links</span>
                    <input
                      type="checkbox"
                      checked={footerState.show_social_links}
                      onChange={(e) => updateState({ show_social_links: e.target.checked })}
                      className="w-4 h-4 accent-orange-600 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50/60">
                    <span className="text-xs font-medium text-stone-800">Show Quick Navigation Links</span>
                    <input
                      type="checkbox"
                      checked={footerState.show_quick_links}
                      onChange={(e) => updateState({ show_quick_links: e.target.checked })}
                      className="w-4 h-4 accent-orange-600 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50/60">
                    <span className="text-xs font-medium text-stone-800">Show Contact Details</span>
                    <input
                      type="checkbox"
                      checked={footerState.show_contact_info}
                      onChange={(e) => updateState({ show_contact_info: e.target.checked })}
                      className="w-4 h-4 accent-orange-600 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50/60 sm:col-span-2">
                    <span className="text-xs font-medium text-stone-800">Show Copyright Line</span>
                    <input
                      type="checkbox"
                      checked={footerState.show_copyright}
                      onChange={(e) => updateState({ show_copyright: e.target.checked })}
                      className="w-4 h-4 accent-orange-600 rounded"
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Bottom Save Bar inside Settings Column */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-stone-400">
              {isDirty ? 'Unsaved changes pending' : 'All changes saved'}
            </span>
            {onSave && (
              <Button
                type="button"
                size="md"
                onClick={handleSubmitSave}
                isLoading={isSaving}
                disabled={isSaving}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs shadow-sm"
              >
                Save Footer Settings
              </Button>
            )}
          </div>
        </div>

        {/* FULL-WIDTH BOTTOM SECTION: LIVE FOOTER PREVIEW */}
        <div className="w-full space-y-4 pt-4 border-t border-stone-200">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800">
                Live Footer Preview
              </h3>
              <Badge variant="outline" className="text-[10px] text-stone-500 font-mono">
                Full Width
              </Badge>
            </div>

            {/* Viewport switch buttons (Desktop / Tablet / Mobile) */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200 text-stone-600 text-xs">
              <button
                type="button"
                onClick={() => setPreviewViewport('desktop')}
                title="Desktop View (Full Width)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  previewViewport === 'desktop'
                    ? 'bg-white text-orange-600 shadow-2xs font-bold'
                    : 'hover:text-stone-900 font-medium'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewViewport('tablet')}
                title="Tablet View (768px)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  previewViewport === 'tablet'
                    ? 'bg-white text-orange-600 shadow-2xs font-bold'
                    : 'hover:text-stone-900 font-medium'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tablet</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewViewport('mobile')}
                title="Mobile View (375px)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  previewViewport === 'mobile'
                    ? 'bg-white text-orange-600 shadow-2xs font-bold'
                    : 'hover:text-stone-900 font-medium'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>
          </div>

          {/* Preview Container with browser-like frame and full-width canvas */}
          <div className="flex justify-center w-full transition-all duration-300">
            <div
              className={`rounded-2xl border border-stone-300/80 shadow-lg overflow-hidden bg-stone-900 transition-all duration-300 w-full ${
                previewViewport === 'mobile'
                  ? 'max-w-[390px]'
                  : previewViewport === 'tablet'
                  ? 'max-w-[768px]'
                  : 'max-w-full'
              }`}
            >
              {/* Mock browser header */}
              <div className="px-4 py-2.5 bg-stone-800 border-b border-stone-700 flex items-center justify-between text-xs text-stone-400 select-none">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                  {footerState.layout.replace('_', ' ')}
                </span>
              </div>

              {/* Embedded Live Customizable Footer Component */}
              <div className="w-full overflow-hidden">
                <CustomizableFooter
                  footerSettings={footerState}
                  business={business}
                  businessHours={businessHours}
                  servicesCount={servicesCount}
                  packagesCount={packagesCount}
                  portfolioCount={portfolioCount}
                  slug={slug}
                  isPreview={true}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 text-xs text-stone-400">
            <span>Viewing as: <strong className="text-stone-700 capitalize">{previewViewport}</strong></span>
            <span>Real-time live reflection of your studio footer settings</span>
          </div>
        </div>
      </div>
    </div>
  );
}
