'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  User,
  KeyRound,
  ExternalLink,
  Trash2,
  Upload,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Card, PageHeader, Button, Input, Badge, LoadingSpinner } from '@/components/ui';
import { businessApi } from '@/services/api/modules';
import { useAuthStore } from '@/store/authStore';
import { useFeatureAccess } from '@/hooks/use-feature-access';
import { useToast } from '@/components/ui/Toast';

// Predefined Brand Logo Options for the custom dropdown
const BRAND_LOGO_OPTIONS = [
  {
    id: 'varnam',
    label: 'VARNAM Official Bridal Logo (Default)',
    subtitle: 'Standard high-resolution orange studio insignia',
    value: '/varnam-logo.png',
    preview: '/varnam-logo.png',
  },
  {
    id: 'vexa',
    label: 'VEXA TECH Corporate Logo',
    subtitle: 'Dark corporate emblem for multi-brand studios',
    value: '/vexa-tech-logo.png',
    preview: '/vexa-tech-logo.png',
  },
  {
    id: 'none',
    label: 'No Logo (Plain Text)',
    subtitle: 'Use plain typography without graphics on receipts',
    value: '',
    preview: null,
  },
  {
    id: 'custom_upload',
    label: 'Upload Custom File',
    subtitle: 'PNG, JPG, WebP, SVG, AVIF from your device',
    value: '__custom__',
    isUpload: true,
  },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { user, currentBusiness, setCurrentBusiness, memberships } = useAuthStore();
  const { planName, hasActiveSubscription } = useFeatureAccess();
  
  // Safe resolution of businessId across currentBusiness, memberships fallback, and localStorage
  const businessId = useMemo(() => {
    if (currentBusiness?.id) return currentBusiness.id;
    if (currentBusiness?.business_id) return currentBusiness.business_id;
    if (currentBusiness?.businessId) return currentBusiness.businessId;
    if (memberships?.length > 0) {
      const first = memberships[0];
      return first.businessId || first.business_id || first.id || first.businesses?.id;
    }
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vexa_active_business_id');
      if (stored && stored !== 'undefined' && stored !== 'null') return stored;
    }
    return null;
  }, [currentBusiness, memberships]);

  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Fetch live business profile from backend
  const {
    data: businessRes,
    isLoading: loadingProfile,
    isError: profileError,
    refetch,
  } = useQuery({
    queryKey: ['business-profile', businessId],
    queryFn: () => businessApi.getById(businessId),
    enabled: !!businessId,
  });

  // Auto-heal currentBusiness if memberships exist but currentBusiness was not populated
  useEffect(() => {
    if (!currentBusiness && memberships?.length > 0) {
      const first = memberships[0];
      const synced = {
        id: first.businessId || first.business_id || first.id || first.businesses?.id,
        name: first.businessName || first.name || first.businesses?.name || 'VARNAM Bridal Studio',
        slug: first.businessSlug || first.slug || first.businesses?.slug,
        logo_url: first.businessLogo || first.logo_url || first.logoUrl || first.businesses?.logo_url,
        role: first.role || 'OWNER',
        ...first,
      };
      setCurrentBusiness(synced);
    }
  }, [currentBusiness, memberships, setCurrentBusiness]);

  const businessData = useMemo(() => {
    return businessRes?.data || currentBusiness || memberships?.[0]?.businesses || memberships?.[0] || null;
  }, [businessRes?.data, currentBusiness, memberships]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    business_phone: '',
    business_email: '',
    city: '',
    state: '',
    address_line1: '',
    logo_url: '',
  });

  // Track initial snapshot for dirty state check and cancellation
  const [initialData, setInitialData] = useState({
    name: '',
    slug: '',
    business_phone: '',
    business_email: '',
    city: '',
    state: '',
    address_line1: '',
    logo_url: '',
  });

  const [selectedLogoPreset, setSelectedLogoPreset] = useState('varnam');
  const [formErrors, setFormErrors] = useState({});
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const lastLoadedBusinessIdRef = useRef(null);

  // Determine preset from logo_url value
  const determinePreset = (url) => {
    if (!url) return '';
    if (url === '/varnam-logo.png') return '/varnam-logo.png';
    if (url === '/vexa-tech-logo.png') return '/vexa-tech-logo.png';
    return '__custom__';
  };

  // Synchronize form when business data arrives or businessId changes
  useEffect(() => {
    if (!businessData) return;

    const currentBizId = businessData.id || businessId;
    const isNewBusiness = lastLoadedBusinessIdRef.current !== currentBizId;

    const stateObj = {
      name: businessData.name || '',
      slug: businessData.slug || '',
      business_phone: businessData.businessPhone || businessData.business_phone || '',
      business_email: businessData.businessEmail || businessData.business_email || '',
      city: businessData.city || '',
      state: businessData.state || '',
      address_line1: businessData.addressLine1 || businessData.address_line1 || '',
      logo_url: businessData.logoUrl || businessData.logo_url || '/varnam-logo.png',
    };

    // If new business or first load, populate form
    if (isNewBusiness) {
      lastLoadedBusinessIdRef.current = currentBizId;
      setFormData(stateObj);
      setInitialData(stateObj);
      setSelectedLogoPreset(determinePreset(stateObj.logo_url));
      setLogoPreviewError(false);
    } else {
      // Check if backend data differs from initialData to prevent infinite update loop
      setInitialData((prevInitial) => {
        const isSame = JSON.stringify(prevInitial) === JSON.stringify(stateObj);
        if (isSame) return prevInitial;
        setFormData(stateObj);
        setSelectedLogoPreset(determinePreset(stateObj.logo_url));
        return stateObj;
      });
    }
  }, [businessData, businessId]);

  // Determine if form has unsaved modifications
  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  // Handle Preset Dropdown Selection
  const handleSelectOption = (option) => {
    setDropdownOpen(false);
    setLogoPreviewError(false);

    if (option.isUpload) {
      setSelectedLogoPreset('__custom__');
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } else {
      setSelectedLogoPreset(option.value);
      setFormData((prev) => ({ ...prev, logo_url: option.value }));
    }
  };

  const [isDragging, setIsDragging] = useState(false);

  // Common file processor for both drop and file picker
  const processFile = (file) => {
    if (!file) return;

    // Check valid image types
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
      setFormErrors((prev) => ({
        ...prev,
        logo_url: 'Please upload a supported image (PNG, JPG, WebP, SVG, AVIF, GIF)',
      }));
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setFormErrors((prev) => ({
        ...prev,
        logo_url: 'Image file size must be less than 4MB',
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result;
      if (dataUri) {
        setFormData((prev) => ({ ...prev, logo_url: dataUri }));
        setSelectedLogoPreset('__custom__');
        setLogoPreviewError(false);
        setFormErrors((prev) => ({ ...prev, logo_url: null }));
        addToast({
          title: 'Logo Loaded',
          description: `Loaded "${file.name}" ready to save.`,
          variant: 'success',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle local file upload via picker
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
    // Reset file input value so re-selecting same file triggers change
    if (e.target) e.target.value = '';
  };

  // Handle Drag and Drop events
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer?.files?.[0];
    processFile(file);
  };

  // Validation function
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Studio Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Studio Name must be at least 2 characters';
    }

    if (formData.business_email && formData.business_email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.business_email.trim())) {
        errors.business_email = 'Please enter a valid email address';
      }
    }

    if (formData.slug && formData.slug.trim()) {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(formData.slug.trim().toLowerCase())) {
        errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 2. Save Business Mutation
  const updateMutation = useMutation({
    mutationFn: (payload) => {
      if (!businessId) {
        throw new Error('No active studio selected. Please select or create a studio profile.');
      }
      return businessApi.update(businessId, payload);
    },
    onSuccess: (res) => {
      setInitialData({ ...formData });

      queryClient.invalidateQueries({ queryKey: ['business-profile', businessId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview', businessId] });

      setCurrentBusiness({
        ...currentBusiness,
        name: formData.name,
        slug: formData.slug || currentBusiness?.slug,
        business_phone: formData.business_phone,
        business_email: formData.business_email,
        city: formData.city,
        state: formData.state,
        address_line1: formData.address_line1,
        logo_url: formData.logo_url,
      });

      addToast({
        title: 'Settings Saved',
        description: 'Your studio profile, URL slug, and branding have been updated successfully.',
        variant: 'success',
      });
    },
    onError: (err) => {
      addToast({
        title: 'Update Failed',
        description: err.message || 'Could not save studio settings.',
        variant: 'error',
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!businessId) {
      addToast({
        title: 'Studio Required',
        description: 'No active studio selected. Please select a valid studio first.',
        variant: 'warning',
      });
      return;
    }
    if (!validateForm()) return;

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim().toLowerCase() || undefined,
      business_phone: formData.business_phone.trim() || undefined,
      business_email: formData.business_email.trim() || undefined,
      city: formData.city.trim() || undefined,
      state: formData.state.trim() || undefined,
      address_line1: formData.address_line1.trim() || undefined,
      logo_url: formData.logo_url || '',
    };

    updateMutation.mutate(payload);
  };

  const handleCancel = () => {
    setFormData({ ...initialData });
    setSelectedLogoPreset(determinePreset(initialData.logo_url));
    setFormErrors({});
    setLogoPreviewError(false);
  };

  // Resolve current active selected option label & preview
  const currentOption = useMemo(() => {
    if (selectedLogoPreset === '__custom__') {
      return {
        label: 'Custom Image Uploaded',
        subtitle: 'Stored locally in studio branding',
        preview: formData.logo_url,
      };
    }
    return (
      BRAND_LOGO_OPTIONS.find((opt) => opt.value === selectedLogoPreset) ||
      BRAND_LOGO_OPTIONS[0]
    );
  }, [selectedLogoPreset, formData.logo_url]);

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title="Studio Settings"
        subtitle="Manage your studio profile, branding, and account information."
      />

      {loadingProfile ? (
        <Card>
          <LoadingSpinner text="Loading studio settings..." />
        </Card>
      ) : profileError ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Could not load studio profile. Please try again.</span>
          </div>
          <button
            onClick={() => refetch()}
            className="text-xs font-semibold underline text-rose-700 hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Studio Profile Form (Left 2 Columns) */}
            <div className="lg:col-span-2 space-y-6">
              <Card
                title="Studio Profile"
                subtitle="Public contact information, studio name, and address displayed to clients"
              >
                <div className="space-y-4 pt-1">
                  {/* Studio Name */}
                  <Input
                    label="Studio Name *"
                    placeholder="e.g. Saritha Bridal Studio"
                    value={formData.name}
                    error={formErrors.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: null });
                    }}
                  />

                  {/* Public Studio URL Slug */}
                  <Input
                    label="Studio Public URL Slug *"
                    placeholder="e.g. saritha-brindal-studio"
                    value={formData.slug}
                    error={formErrors.slug}
                    onChange={(e) => {
                      const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setFormData({ ...formData, slug: sanitized });
                      if (formErrors.slug) setFormErrors({ ...formErrors, slug: null });
                    }}
                    helperText={
                      typeof window !== 'undefined'
                        ? `Public URL: ${window.location.origin}/${formData.slug || 'studio-slug'}/enquiry-form`
                        : `Public URL: /${formData.slug || 'studio-slug'}/enquiry-form`
                    }
                  />

                  {/* Contact Fields (Phone & Email) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Studio Phone"
                      placeholder="e.g. 9876543210"
                      value={formData.business_phone}
                      onChange={(e) =>
                        setFormData({ ...formData, business_phone: e.target.value })
                      }
                      helperText="Official telephone or mobile for client communications"
                    />

                    <Input
                      label="Studio Email"
                      type="email"
                      placeholder="e.g. contact@varnamstudio.in"
                      value={formData.business_email}
                      error={formErrors.business_email}
                      onChange={(e) => {
                        setFormData({ ...formData, business_email: e.target.value });
                        if (formErrors.business_email) setFormErrors({ ...formErrors, business_email: null });
                      }}
                      helperText="Public client email (separate from your personal login email)"
                    />
                  </div>

                  {/* Address & Location */}
                  <div className="pt-2 border-t border-[#F0E7DE]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <Input
                        label="City"
                        placeholder="e.g. Chennai"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />

                      <Input
                        label="State"
                        placeholder="e.g. Tamil Nadu"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      />
                    </div>

                    <Input
                      label="Studio Address / Street"
                      placeholder="e.g. 42 Bridal Avenue, T. Nagar"
                      value={formData.address_line1}
                      onChange={(e) =>
                        setFormData({ ...formData, address_line1: e.target.value })
                      }
                      helperText="Location printed on booking confirmations and quotations"
                    />
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="flex items-center justify-between pt-5 mt-6 border-t border-[#F0E7DE] flex-wrap gap-3">
                  <div className="text-xs text-[#78716C]">
                    {isDirty ? (
                      <span className="text-[#F97316] font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Unsaved modifications
                      </span>
                    ) : (
                      <span className="text-stone-400">All changes saved</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={!isDirty || updateMutation.isPending}
                      className="border-[#F0E7DE] text-stone-700 hover:bg-stone-50 gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      size="sm"
                      disabled={!isDirty || updateMutation.isPending}
                      isLoading={updateMutation.isPending}
                      className="bg-[#F97316] hover:bg-[#C2410C] text-white shadow-xs gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Card>

              {/* 2. Studio Branding Card with Custom Modern Dropdown */}
              <Card
                title="Studio Branding"
                subtitle="Select your studio brand logo or upload custom artwork (PNG, JPG, WebP, SVG, AVIF)"
              >
                <div className="space-y-5 pt-1">
                  {/* Modern Custom UI Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Select Studio Logo
                    </label>

                    {/* Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="w-full flex items-center justify-between p-3 bg-white border border-[#F0E7DE] rounded-2xl shadow-xs hover:border-[#F97316]/50 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 transition-all cursor-pointer text-left"
                      aria-haspopup="listbox"
                      aria-expanded={dropdownOpen}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center overflow-hidden shrink-0 p-1">
                          {currentOption.preview ? (
                            <img
                              src={currentOption.preview}
                              alt="Selected Logo"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-stone-400" />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs font-bold text-stone-900 truncate">
                            {currentOption.label}
                          </div>
                          <div className="text-[11px] text-[#78716C] truncate mt-0.5">
                            {currentOption.subtitle || 'Click to change studio logo'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-2 shrink-0">
                        <span className="text-[10px] font-semibold text-[#F97316] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full hidden sm:inline">
                          Change
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                            dropdownOpen ? 'rotate-180 text-[#F97316]' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {/* Dropdown Menu Panel */}
                    {dropdownOpen && (
                      <div className="absolute left-0 right-0 mt-2 bg-white border border-[#F0E7DE] rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 divide-y divide-[#F0E7DE]/50">
                        <div className="px-3.5 py-1.5 text-[10px] font-bold text-[#A8A29E] uppercase tracking-wider">
                          Choose Logo Source
                        </div>

                        <div className="py-1">
                          {BRAND_LOGO_OPTIONS.map((opt) => {
                            const isSelected =
                              opt.isUpload
                                ? selectedLogoPreset === '__custom__'
                                : selectedLogoPreset === opt.value;

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleSelectOption(opt)}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors cursor-pointer hover:bg-orange-50/60 ${
                                  isSelected ? 'bg-orange-50/80' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-8 h-8 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-center overflow-hidden shrink-0 p-1">
                                    {opt.isUpload ? (
                                      <Upload className="w-4 h-4 text-[#F97316]" />
                                    ) : opt.preview ? (
                                      <img
                                        src={opt.preview}
                                        alt={opt.label}
                                        className="w-full h-full object-contain"
                                      />
                                    ) : (
                                      <ImageIcon className="w-4 h-4 text-stone-300" />
                                    )}
                                  </div>

                                  <div className="overflow-hidden">
                                    <div
                                      className={`text-xs font-semibold truncate ${
                                        isSelected ? 'text-[#C2410C]' : 'text-stone-800'
                                      }`}
                                    >
                                      {opt.label}
                                    </div>
                                    <div className="text-[10px] text-[#78716C] truncate">
                                      {opt.subtitle}
                                    </div>
                                  </div>
                                </div>

                                {isSelected && (
                                  <Check className="w-4 h-4 text-[#F97316] shrink-0 ml-2" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hidden Native File Input for Multi-format Local Upload */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif,image/gif"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Interactive Drag & Drop Upload Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${
                      isDragging
                        ? 'border-[#F97316] bg-orange-50/80 scale-[1.01]'
                        : 'border-[#F0E7DE] hover:border-[#F97316]/50 hover:bg-orange-50/30 bg-[#FFFDF9]/60'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                          isDragging
                            ? 'bg-[#F97316] text-white'
                            : 'bg-orange-100/70 text-[#F97316]'
                        }`}
                      >
                        <Upload className="w-6 h-6 animate-pulse" />
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-stone-800">
                          {isDragging ? (
                            <span className="text-[#F97316]">Drop your logo here to load</span>
                          ) : (
                            <>
                              <span className="text-[#F97316] hover:underline">Click to upload</span>{' '}
                              or drag and drop your logo file
                            </>
                          )}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          Supports PNG, JPG, JPEG, WebP, SVG, AVIF, GIF (Up to 4MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-stone-500">
                      Or pick from the curated brand gallery above
                    </span>

                    {formData.logo_url && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData((prev) => ({ ...prev, logo_url: '' }));
                          setSelectedLogoPreset('');
                          setLogoPreviewError(false);
                        }}
                        className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer font-semibold py-1 px-2 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove Logo
                      </button>
                    )}
                  </div>

                  {formErrors.logo_url && (
                    <p className="text-xs text-rose-600 font-medium">{formErrors.logo_url}</p>
                  )}

                  {/* Logo Live Preview */}
                  <div className="p-4 rounded-xl border border-[#F0E7DE] bg-[#FFFDF9]">
                    <div className="text-xs font-semibold text-[#78716C] uppercase tracking-wider mb-2">
                      Studio Receipt & Header Preview
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-white border border-[#F0E7DE]">
                      <div className="w-28 h-24 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center overflow-hidden shrink-0 relative p-2">
                        {formData.logo_url && !logoPreviewError ? (
                          <img
                            src={formData.logo_url}
                            alt="Studio Logo Preview"
                            className="w-full h-full object-contain"
                            onError={() => setLogoPreviewError(true)}
                          />
                        ) : (
                          <div className="text-center p-2">
                            <ImageIcon className="w-6 h-6 text-stone-300 mx-auto" />
                            <span className="text-[10px] text-stone-400 block mt-1">
                              {logoPreviewError ? 'Failed to load' : 'No Logo Selected'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-center sm:text-left">
                        <div className="text-sm font-bold text-[#292524]">
                          {formData.name || 'Studio Name'}
                        </div>
                        <div className="text-xs text-[#78716C] mt-0.5">
                          {formData.city ? `${formData.city}, ${formData.state || 'India'}` : 'Location'}
                        </div>
                        <div className="text-[11px] text-[#F97316] font-medium mt-1">
                          {formData.business_phone || formData.business_email || 'Bridal & Makeup Artistry'}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-[10px] text-stone-400">Supported Formats:</span>
                          <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                            PNG, JPG, WebP, SVG, AVIF
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* 3. Account Information & Security (Right Column) */}
            <div className="space-y-6">
              {/* Account Information Card */}
              <Card
                title="Account Information"
                subtitle="Your personal credentials and platform identity"
              >
                <div className="space-y-4 text-xs pt-1">
                  <div>
                    <span className="text-[#78716C] block mb-0.5">Account Name:</span>
                    <span className="font-semibold text-[#292524] text-sm flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[#F97316]" />
                      {user?.name || 'Studio User'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#78716C] block mb-0.5">Login Email Address:</span>
                    <span className="font-medium text-[#292524] text-xs break-all flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-stone-400" />
                      {user?.email || '—'}
                    </span>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      Used for authentication and OTP verification.
                    </p>
                  </div>

                  <div>
                    <span className="text-[#78716C] block mb-1">Email Verification Status:</span>
                    {user?.is_email_verified !== false ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Email Verified
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        Verification Pending
                      </Badge>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#F0E7DE]">
                    <span className="text-[#78716C] block mb-1">Assigned Studio Role:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-[#C2410C] border border-orange-200">
                      {businessData?.myRole || currentBusiness?.role || 'OWNER'}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Security & Access Card */}
              <Card
                title="Security & Access"
                subtitle="Password and authentication controls"
              >
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-[#78716C]">
                    Manage your credentials or reset your password if needed.
                  </p>

                  <Link href="/forgot-password" className="block">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full justify-between text-xs border-[#F0E7DE] hover:bg-stone-50 text-stone-700"
                    >
                      <span className="flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5 text-[#F97316]" />
                        Reset / Change Password
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Active Plan Entitlement Badge */}
              <Card
                title="Current Subscription"
                subtitle="Active SaaS entitlement tier"
              >
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Tier:</span>
                    <span className="font-bold text-stone-900">
                      {businessData?.subscription?.planName || planName || 'No Active Plan'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Status:</span>
                    <Badge variant={hasActiveSubscription ? 'success' : 'warning'}>
                      {hasActiveSubscription ? 'Active' : 'No Plan'}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
