'use client';

// Dynamically load official Razorpay SDK script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  Globe,
  Sparkles,
  ExternalLink,
  Upload,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Image as ImageIcon,
  Palette,
  Package,
  Scissors,
  Server,
  Settings,
  Eye,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  Check,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  HelpCircle,
  ChevronRight,
  Share2,
  CreditCard,
  History,
  Shield,
  MessageSquare,
  X,
  Link as LinkIcon,
  FileImage,
  Copy,
} from 'lucide-react';

import {
  Card,
  Button,
  Input,
  LoadingSpinner,
  Badge,
  EmptyState,
  ModernDropdown,
} from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useModalAlert } from '@/components/ui/ModalAlert';
import { useAuthStore } from '@/store/authStore';
import { websiteService } from '@/services/website';
import { formatINR, formatDate } from '@/utils/formatters';
import { getPublicStudioUrl, getPreviewStudioUrl } from '@/utils/urlConfig';
import { ContactSalesModal } from '@/components/subscription/ContactSalesModal';
import FooterBuilderSection from '@/components/website/FooterBuilderSection';


export default function WebsitePage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const modalAlert = useModalAlert();
  const { user, currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id;

  // Active navigation tab for Growth & Premium businesses
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'branding' | 'portfolio' | 'catalog' | 'domain'
  const [isContactSalesOpen, setIsContactSalesOpen] = useState(false);

  // Portfolio modal state
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({
    title: '',
    description: '',
    image_url: '',
    category: 'Bridal Makeup',
    display_order: 0,
    is_public: true,
  });
  const [portfolioImageMode, setPortfolioImageMode] = useState('upload'); // 'upload' | 'preset' | 'url'
  const [isDraggingPortfolio, setIsDraggingPortfolio] = useState(false);

  // About Section Drag and Drop Photo states & modes
  const [aboutPrimaryMode, setAboutPrimaryMode] = useState('upload'); // 'upload' | 'url'
  const [isDraggingAboutPrimary, setIsDraggingAboutPrimary] = useState(false);
  const [aboutSecondaryMode, setAboutSecondaryMode] = useState('upload'); // 'upload' | 'url'
  const [isDraggingAboutSecondary, setIsDraggingAboutSecondary] = useState(false);

  // Branding Logo Drag and Drop states
  const [brandingLogoMode, setBrandingLogoMode] = useState('upload'); // 'upload' | 'url'
  const [isDraggingBrandingLogo, setIsDraggingBrandingLogo] = useState(false);

  const processBrandingLogoFile = (file) => {
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
      addToast({
        title: 'Unsupported Image',
        description: 'Please upload a PNG, JPG, WebP, SVG, AVIF, or GIF logo.',
        variant: 'danger',
      });
      return;
    }

    if (file.size > 4.5 * 1024 * 1024) {
      addToast({
        title: 'File Too Large',
        description: 'Logo file size must be less than 4.5MB.',
        variant: 'danger',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result;
      if (dataUri) {
        setBrandingForm((prev) => ({
          ...prev,
          logo_url: dataUri,
        }));
        addToast({
          title: 'Logo Uploaded',
          description: `Studio logo loaded successfully.`,
          variant: 'success',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Process About image uploads
  const processAboutImageFile = (file, targetField = 'image_url') => {
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
      addToast({
        title: 'Unsupported Image',
        description: 'Please upload a PNG, JPG, WebP, SVG, AVIF, or GIF photo.',
        variant: 'danger',
      });
      return;
    }

    if (file.size > 4.5 * 1024 * 1024) {
      addToast({
        title: 'File Too Large',
        description: 'Image file size must be less than 4.5MB.',
        variant: 'danger',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result;
      if (dataUri) {
        setAboutForm((prev) => ({
          ...prev,
          [targetField]: dataUri,
        }));
        addToast({
          title: 'Photo Uploaded',
          description: `Loaded image ready for About Studio story.`,
          variant: 'success',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Portfolio Bridal Category Options for ModernDropdown
  const PORTFOLIO_CATEGORY_OPTIONS = [
    { value: 'Bridal Makeup', label: 'Bridal Makeup' },
    { value: 'Muhurtham Look', label: 'Muhurtham Look' },
    { value: 'Reception Look', label: 'Reception Look' },
    { value: 'Engagement', label: 'Engagement' },
    { value: 'Sangeet & Mehendi', label: 'Sangeet & Mehendi' },
    { value: 'Editorial & Pre-Wedding', label: 'Editorial & Pre-Wedding' },
  ];

  // Curated Luxury Bridal Photography Presets for quick selection
  const BRIDAL_PHOTO_PRESETS = [
    {
      id: 'muhurtham_gold',
      title: 'South Indian Muhurtham Look',
      category: 'Muhurtham Look',
      url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'glam_reception',
      title: 'Royal Reception Bridal Glam',
      category: 'Reception Look',
      url: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'classic_bridal',
      title: 'Signature HD Bridal Makeover',
      category: 'Bridal Makeup',
      url: 'https://images.unsplash.com/photo-1546804784-896d0dca3805?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'sangeet_vibrant',
      title: 'Vibrant Sangeet & Mehendi Glow',
      category: 'Sangeet & Mehendi',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'dewy_engagement',
      title: 'Romantic Dewy Engagement Finish',
      category: 'Engagement',
      url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'editorial_couture',
      title: 'Editorial Haute Couture Bridal',
      category: 'Editorial & Pre-Wedding',
      url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  // Process uploaded image file into Data URI
  const processPortfolioImageFile = (file) => {
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
      addToast({
        title: 'Unsupported Image',
        description: 'Please upload a PNG, JPG, WebP, SVG, AVIF, or GIF photo.',
        variant: 'danger',
      });
      return;
    }

    if (file.size > 4.5 * 1024 * 1024) {
      addToast({
        title: 'File Too Large',
        description: 'Image file size must be less than 4.5MB.',
        variant: 'danger',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result;
      if (dataUri) {
        setPortfolioForm((prev) => ({
          ...prev,
          image_url: dataUri,
          title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        }));
        addToast({
          title: 'Photo Uploaded',
          description: `Loaded "${file.name}" ready to publish.`,
          variant: 'success',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // 1. Fetch Subscription & Feature Entitlements
  const {
    data: subscriptionData,
    isLoading: isSubLoading,
    isError: isSubError,
    error: subError,
    refetch: refetchSubscription,
  } = useQuery({
    queryKey: ['subscription-features', businessId],
    queryFn: () => websiteService.getSubscriptionFeatures(businessId),
    enabled: !!businessId,
  });

  // 2. Fetch Available Commercial Plans
  const { data: plansData } = useQuery({
    queryKey: ['commercial-plans'],
    queryFn: () => websiteService.getAllPlans(),
  });

  // 3. Fetch Business Website Configuration
  const {
    data: websiteData,
    isLoading: isWebsiteLoading,
    isError: isWebsiteError,
    refetch: refetchWebsite,
  } = useQuery({
    queryKey: ['website-config', businessId],
    queryFn: () => websiteService.getWebsite(businessId),
    enabled: !!businessId && Boolean(subscriptionData?.features?.BRANDED_WEBSITE),
  });

  // 4. Fetch Website Preview & Live Catalog Metrics
  const {
    data: previewData,
    isLoading: isPreviewLoading,
    refetch: refetchPreview,
  } = useQuery({
    queryKey: ['website-preview', businessId],
    queryFn: () => websiteService.previewWebsite(businessId),
    enabled: !!businessId && Boolean(subscriptionData?.features?.BRANDED_WEBSITE),
  });

  // 5. Fetch Portfolio items
  const {
    data: portfolioItems = [],
    isLoading: isPortfolioLoading,
    refetch: refetchPortfolio,
  } = useQuery({
    queryKey: ['portfolio-items', businessId],
    queryFn: () => websiteService.listPortfolio(),
    enabled: !!businessId && Boolean(subscriptionData?.features?.PORTFOLIO_SHOWCASE),
  });

  // 6. Fetch Business Payment Orders History (Razorpay)
  const {
    data: paymentHistory = [],
    isLoading: isHistoryLoading,
    refetch: refetchPaymentHistory,
  } = useQuery({
    queryKey: ['payment-history', businessId],
    queryFn: () => websiteService.getPaymentHistory(businessId),
    enabled: !!businessId,
  });

  // 7. Fetch Studio Business Hours
  const {
    data: hoursData = [],
    isLoading: isHoursLoading,
    refetch: refetchHours,
  } = useQuery({
    queryKey: ['website-hours', businessId],
    queryFn: () => websiteService.getBusinessHours(businessId),
    enabled: !!businessId && Boolean(subscriptionData?.features?.BRANDED_WEBSITE),
  });

  // 8. Fetch Studio About Section
  const {
    data: aboutData,
    isLoading: isAboutLoading,
    refetch: refetchAbout,
  } = useQuery({
    queryKey: ['website-about', businessId],
    queryFn: async () => {
      const res = await websiteService.getStudioAbout(businessId);
      return res ?? null;
    },
    enabled: !!businessId && Boolean(subscriptionData?.features?.BRANDED_WEBSITE),
  });

  // 9. Fetch Studio Footer Settings
  const {
    data: footerData,
    isLoading: isFooterLoading,
    refetch: refetchFooter,
  } = useQuery({
    queryKey: ['website-footer', businessId],
    queryFn: async () => {
      const res = await websiteService.getFooterSettings(businessId);
      return res ?? null;
    },
    enabled: !!businessId && Boolean(subscriptionData?.features?.BRANDED_WEBSITE),
  });

  // Verify payment if redirected back with ?order_id=... or ?sub_id=...
  const searchParams = useSearchParams();
  const rawOrderId = searchParams.get('order_id') || searchParams.get('sub_id');
  // Avoid literal string templates like '{subscription_id}' or '{order_id}'
  const orderIdParam = rawOrderId && !rawOrderId.includes('{') ? rawOrderId : null;
  const [isVerifyingParam, setIsVerifyingParam] = useState(false);

  useEffect(() => {
    if (orderIdParam && businessId && !isVerifyingParam) {
      setIsVerifyingParam(true);
      websiteService
        .verifyPayment(businessId, orderIdParam)
        .then((res) => {
          if (res?.isPaid) {
            addToast({
              title: 'Payment Successful!',
              description: `Your subscription to ${res.planName || 'the selected plan'} has been activated.`,
              variant: 'success',
            });
            queryClient.invalidateQueries({ queryKey: ['subscription-features'] });
            queryClient.invalidateQueries({ queryKey: ['payment-history'] });
            queryClient.invalidateQueries({ queryKey: ['website-config'] });
            // Clean URL query params without reloading
            if (typeof window !== 'undefined') {
              window.history.replaceState({}, '', '/website');
            }
          } else {
            addToast({
              title: 'Payment Incomplete',
              description: res?.message || 'We are awaiting final confirmation from Razorpay.',
              variant: 'warning',
            });
          }
        })
        .catch((err) => {
          const msg = err.response?.data?.message || err.message || 'Payment verification failed';
          addToast({ title: 'Verification Error', description: msg, variant: 'danger' });
        });
    }
  }, [orderIdParam, businessId]);

  // Form state for Website Branding and Profile
  const [brandingForm, setBrandingForm] = useState({
    subdomain: '',
    site_title: '',
    tagline: '',
    about_text: '',
    contact_email: '',
    contact_phone: '',
    whatsapp_phone: '',
    public_address: '',
    map_url: '',
    primary_color: '#F97316',
    logo_url: '',
    seo_title: '',
    seo_description: '',
    custom_domain: '',
  });

  // Populate branding form when website data arrives
  useEffect(() => {
    if (websiteData) {
      setBrandingForm({
        subdomain: websiteData.subdomain || currentBusiness?.slug || '',
        site_title: websiteData.site_title || currentBusiness?.name || '',
        tagline: websiteData.tagline || '',
        about_text: websiteData.about_text || '',
        contact_email: websiteData.contact_email || currentBusiness?.email || '',
        contact_phone: websiteData.contact_phone || currentBusiness?.phone || '',
        whatsapp_phone: websiteData.whatsapp_phone || currentBusiness?.whatsapp_phone || '',
        public_address: websiteData.public_address || currentBusiness?.address || '',
        map_url: websiteData.map_url || '',
        primary_color: websiteData.primary_color || '#F97316',
        logo_url: websiteData.logo_url || currentBusiness?.logo_url || '',
        seo_title: websiteData.seo_title || '',
        seo_description: websiteData.seo_description || '',
        custom_domain: websiteData.custom_domain || '',
      });
    }
  }, [websiteData, currentBusiness]);

  // Form state for Studio Business Hours (7 days)
  const [hoursForm, setHoursForm] = useState([
    { day_of_week: 0, day_name: 'Sunday', is_closed: true, open_time: '10:00 AM', close_time: '06:00 PM' },
    { day_of_week: 1, day_name: 'Monday', is_closed: false, open_time: '09:00 AM', close_time: '08:00 PM' },
    { day_of_week: 2, day_name: 'Tuesday', is_closed: false, open_time: '09:00 AM', close_time: '08:00 PM' },
    { day_of_week: 3, day_name: 'Wednesday', is_closed: false, open_time: '09:00 AM', close_time: '08:00 PM' },
    { day_of_week: 4, day_name: 'Thursday', is_closed: false, open_time: '09:00 AM', close_time: '08:00 PM' },
    { day_of_week: 5, day_name: 'Friday', is_closed: false, open_time: '09:00 AM', close_time: '08:00 PM' },
    { day_of_week: 6, day_name: 'Saturday', is_closed: false, open_time: '09:00 AM', close_time: '08:30 PM' },
  ]);

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (hoursData && Array.isArray(hoursData) && hoursData.length > 0) {
      const merged = [0, 1, 2, 3, 4, 5, 6].map((dayNum) => {
        const found = hoursData.find((h) => h.day_of_week === dayNum);
        return {
          day_of_week: dayNum,
          day_name: DAY_NAMES[dayNum],
          is_closed: found ? Boolean(found.is_closed) : dayNum === 0,
          open_time: found?.open_time || '09:00 AM',
          close_time: found?.close_time || (dayNum === 6 ? '08:30 PM' : '08:00 PM'),
        };
      });
      setHoursForm(merged);
    }
  }, [hoursData]);

  // Form state for Studio About Section (Rich Story, Highlights, Images)
  const [aboutForm, setAboutForm] = useState({
    title: 'About Our Studio',
    subtitle: 'Where Bridal Artistry Meets Timeless Elegance',
    description: '',
    experience_years: '8+ Years',
    brides_styled: '500+ Happy Brides',
    awards_count: '15+ Bridal Awards',
    image_url: '',
    secondary_image_url: '',
    is_active: true,
  });

  useEffect(() => {
    if (aboutData) {
      setAboutForm({
        title: aboutData.title || 'About Our Studio',
        subtitle: aboutData.subtitle || 'Where Bridal Artistry Meets Timeless Elegance',
        description: aboutData.description || '',
        experience_years: aboutData.experience_years || '8+ Years',
        brides_styled: aboutData.brides_styled || '500+ Happy Brides',
        awards_count: aboutData.awards_count || '15+ Bridal Awards',
        image_url: aboutData.image_url || '',
        secondary_image_url: aboutData.secondary_image_url || '',
        is_active: aboutData.is_active ?? true,
      });
    }
  }, [aboutData]);

  // Mutation: Save Studio Business Hours
  const saveHoursMutation = useMutation({
    mutationFn: (hours) => websiteService.updateBusinessHours(businessId, hours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-hours'] });
      queryClient.invalidateQueries({ queryKey: ['website-preview'] });
      addToast({
        title: 'Business Hours Saved',
        description: 'Studio opening and closing hours updated successfully.',
        variant: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update business hours';
      addToast({ title: 'Error', description: msg, variant: 'danger' });
    },
  });

  // Mutation: Save Studio About Section
  const saveAboutMutation = useMutation({
    mutationFn: (data) => websiteService.saveStudioAbout(businessId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-about'] });
      queryClient.invalidateQueries({ queryKey: ['website-preview'] });
      addToast({
        title: 'About Section Saved',
        description: 'Studio story, highlights, and photography updated successfully.',
        variant: 'success',
      });
    },
    onError: (err) => {
      const issues = err.response?.data?.errors;
      const details = Array.isArray(issues) && issues.length > 0 ? `: ${issues.map((i) => i.message || i.field).join(', ')}` : '';
      const msg = (err.response?.data?.message || err.message || 'Failed to save about section') + details;
      addToast({ title: 'Error', description: msg, variant: 'danger' });
    },
  });

  // Mutation: Save Studio Footer Settings
  const saveFooterMutation = useMutation({
    mutationFn: (data) => websiteService.saveFooterSettings(businessId, data),
    onSuccess: (res, vars, context) => {
      queryClient.invalidateQueries({ queryKey: ['website-footer'] });
      queryClient.invalidateQueries({ queryKey: ['website-preview'] });
      queryClient.invalidateQueries({ queryKey: ['website-config'] });
      addToast({
        title: 'Footer Settings Saved',
        description: 'Your customizable website footer has been updated successfully.',
        variant: 'success',
      });
      if (typeof context === 'function') {
        context();
      }
    },
    onError: (err) => {
      const issues = err.response?.data?.errors;
      const details = Array.isArray(issues) && issues.length > 0 ? `: ${issues.map((i) => i.message || i.field).join(', ')}` : '';
      const msg = (err.response?.data?.message || err.message || 'Failed to save footer settings') + details;
      addToast({ title: 'Error', description: msg, variant: 'danger' });
    },
  });

  // Lock ref to prevent duplicate concurrent checkout requests
  const isSubmittingCheckoutRef = React.useRef(false);

  // Razorpay Checkout Mutation
  const checkoutMutation = useMutation({
    mutationFn: async (targetPlanCode) => {
      if (isSubmittingCheckoutRef.current) {
        throw new Error('Checkout request already in progress');
      }
      isSubmittingCheckoutRef.current = true;
      try {
        return await websiteService.createCheckout(businessId, targetPlanCode);
      } finally {
        isSubmittingCheckoutRef.current = false;
      }
    },
    onSuccess: async (data) => {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || typeof window === 'undefined' || !window.Razorpay) {
        addToast({
          title: 'Gateway Error',
          description: 'Failed to load Razorpay SDK. Please check your internet connection and try again.',
          variant: 'danger',
        });
        return;
      }

      if (!data?.keyId) {
        addToast({
          title: 'Configuration Error',
          description: 'Payment gateway configuration missing. Please contact support.',
          variant: 'danger',
        });
        return;
      }

      try {
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency || 'INR',
          name: 'VARNAM Bridal Software',
          description: `Subscription: ${data.planName || 'Growth Plan'}`,
          order_id: data.orderId || data.rzpOrderId || undefined,
          notes: {
            businessId,
            planCode: data.planCode,
            subscription_id: data.subscriptionId || '',
          },
          prefill: {
            name: user?.name || user?.email?.split('@')[0] || data.customer?.name || '',
            email: user?.email || data.customer?.email || '',
            contact: user?.phone || data.customer?.contact || '',
          },
          theme: {
            color: '#F97316', // VARNAM Orange
          },
          handler: async (response) => {
            try {
              addToast({
                title: 'Processing Payment',
                description: 'Verifying payment with bank. Please wait...',
                variant: 'info',
              });

              await websiteService.verifyPayment(businessId, {
                orderId: data.orderId || response.razorpay_order_id,
                subscriptionId: data.subscriptionId || response.razorpay_subscription_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id || data.orderId,
                razorpay_subscription_id: response.razorpay_subscription_id || data.subscriptionId,
                razorpay_signature: response.razorpay_signature,
              });

              queryClient.invalidateQueries({ queryKey: ['subscription-features'] });
              queryClient.invalidateQueries({ queryKey: ['payment-history'] });
              queryClient.invalidateQueries({ queryKey: ['website-config'] });

              addToast({
                title: 'Payment Successful!',
                description: `Your ${data.planName} has been activated.`,
                variant: 'success',
              });
            } catch (err) {
              addToast({
                title: 'Payment Recorded',
                description: err.response?.data?.message || 'Payment completed. Verifying with gateway...',
                variant: 'warning',
              });
              queryClient.invalidateQueries({ queryKey: ['subscription-features'] });
              queryClient.invalidateQueries({ queryKey: ['payment-history'] });
            }
          },
          modal: {
            ondismiss: () => {
              addToast({
                title: 'Checkout Incomplete',
                description: 'Payment window was closed.',
                variant: 'warning',
              });
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          addToast({
            title: 'Payment Failed',
            description: response.error?.description || 'Your transaction was declined by the bank.',
            variant: 'danger',
          });
        });
        rzp.open();
      } catch (err) {
        addToast({
          title: 'Gateway Error',
          description: err.message || 'Could not launch Razorpay checkout',
          variant: 'danger',
        });
      }
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to initiate checkout';
      addToast({ title: 'Checkout Failed', description: msg, variant: 'danger' });
    },
  });




  // Mutation: Save / Update Website Settings
  const saveWebsiteMutation = useMutation({
    mutationFn: (data) => websiteService.saveWebsite(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['website-config'] });
      queryClient.invalidateQueries({ queryKey: ['website-preview'] });
      addToast({
        title: 'Settings Saved',
        description: 'Website branding and profile details updated successfully.',
        variant: 'success',
      });
    },
    onError: (err) => {
      const data = err.response?.data;
      let msg = data?.message || err.message || 'Failed to save website settings';
      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        msg = data.errors.map((e) => `${e.field}: ${e.message}`).join(', ');
      }
      addToast({ title: 'Validation Error', description: msg, variant: 'danger' });
    },
  });

  // Mutation: Publish Website
  const publishMutation = useMutation({
    mutationFn: () => websiteService.publishWebsite(businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-config'] });
      queryClient.invalidateQueries({ queryKey: ['website-preview'] });
      queryClient.invalidateQueries({ queryKey: ['public-website'] });
      queryClient.invalidateQueries({ queryKey: ['public-services'] });
      queryClient.invalidateQueries({ queryKey: ['public-packages'] });
      queryClient.invalidateQueries({ queryKey: ['public-portfolio'] });
      addToast({
        title: 'Website Published!',
        description: 'Your studio website is now public and accessible to clients.',
        variant: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to publish website';
      addToast({ title: 'Publish Error', description: msg, variant: 'danger' });
    },
  });

  // Mutation: Unpublish Website
  const unpublishMutation = useMutation({
    mutationFn: () => websiteService.unpublishWebsite(businessId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-config'] });
      queryClient.invalidateQueries({ queryKey: ['website-preview'] });
      queryClient.invalidateQueries({ queryKey: ['public-website'] });
      queryClient.invalidateQueries({ queryKey: ['public-services'] });
      queryClient.invalidateQueries({ queryKey: ['public-packages'] });
      queryClient.invalidateQueries({ queryKey: ['public-portfolio'] });
      addToast({
        title: 'Website Unpublished',
        description: 'Your studio website is now in draft mode.',
        variant: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to unpublish website';
      addToast({ title: 'Error', description: msg, variant: 'danger' });
    },
  });

  // Mutation: Create Portfolio Item
  const createPortfolioMutation = useMutation({
    mutationFn: (data) => websiteService.createPortfolioItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-items'] });
      queryClient.invalidateQueries({ queryKey: ['website-preview'] });
      setIsPortfolioModalOpen(false);
      setPortfolioForm({
        title: '',
        description: '',
        image_url: '',
        category: 'Bridal Makeup',
        display_order: 0,
        is_public: true,
      });
      addToast({ title: 'Photo Added', description: 'Item added to your studio portfolio lookbook', variant: 'success' });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create portfolio item';
      addToast({ title: 'Error', description: msg, variant: 'danger' });
    },
  });

  // Mutation: Delete Portfolio Item
  const deletePortfolioMutation = useMutation({
    mutationFn: (id) => websiteService.deletePortfolioItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-items'] });
      queryClient.invalidateQueries({ queryKey: ['website-preview'] });
      addToast({ title: 'Item Removed', description: 'Photo deleted from portfolio lookbook', variant: 'success' });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to delete portfolio item';
      addToast({ title: 'Error', description: msg, variant: 'danger' });
    },
  });

  // State for tracking footer builder updates
  const [footerBuilderState, setFooterBuilderState] = useState(null);
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Master Unified Save: Saves Branding, Hours, About Story, and Footer simultaneously
  const handleSaveAll = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSavingAll(true);
    try {
      const promises = [
        websiteService.saveWebsite(brandingForm).catch((err) => {
          throw new Error(
            err.response?.data?.errors
              ? `Branding: ${err.response.data.errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`
              : err.response?.data?.message || 'Branding save failed'
          );
        }),
        websiteService.updateBusinessHours(businessId, hoursForm).catch((err) => {
          throw new Error(
            err.response?.data?.errors
              ? `Hours: ${err.response.data.errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`
              : err.response?.data?.message || 'Business hours save failed'
          );
        }),
        websiteService.saveStudioAbout(businessId, aboutForm).catch((err) => {
          throw new Error(
            err.response?.data?.errors
              ? `About: ${err.response.data.errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`
              : err.response?.data?.message || 'About section save failed'
          );
        }),
      ];

      if (footerBuilderState) {
        promises.push(
          websiteService.saveFooterSettings(businessId, footerBuilderState).catch((err) => {
            throw new Error(
              err.response?.data?.errors
                ? `Footer: ${err.response.data.errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`
                : err.response?.data?.message || 'Footer save failed'
            );
          })
        );
      }

      await Promise.all(promises);

      queryClient.invalidateQueries({ queryKey: ['website-config'] });
      queryClient.invalidateQueries({ queryKey: ['website-preview'] });
      queryClient.invalidateQueries({ queryKey: ['website-hours'] });
      queryClient.invalidateQueries({ queryKey: ['website-about'] });
      queryClient.invalidateQueries({ queryKey: ['website-footer'] });

      addToast({
        title: 'All Website Settings Saved',
        description: 'Branding, hours, about story, and footer have been successfully updated.',
        variant: 'success',
      });
    } catch (err) {
      const data = err.response?.data;
      let msg = data?.message || err.message || 'Failed to save website settings';
      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        msg = data.errors.map((e) => `${e.field || e.path || 'Error'}: ${e.message}`).join(', ');
      }
      addToast({ title: 'Validation / Save Error', description: msg, variant: 'danger' });
    } finally {
      setIsSavingAll(false);
    }
  };

  // Handlers
  const handleBrandingSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    handleSaveAll(e);
  };

  const handleDeletePortfolioItem = async (item) => {
    const confirmed = await modalAlert.showConfirm({
      title: 'Delete Portfolio Photo',
      message: `Are you sure you want to remove "${item.title || 'this photo'}" from your portfolio?`,
      confirmText: 'Delete Photo',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (confirmed) {
      deletePortfolioMutation.mutate(item.id);
    }
  };

  const handleUpgradeToGrowth = async () => {
    const confirmed = await modalAlert.showConfirm({
      title: 'Upgrade to Growth Plan (₹999/month)',
      message:
        'Unlock your branded public website, public service & package catalogues, client inquiry portal, and portfolio lookbook. Complete payment mandate via Secure Pay.',
      confirmText: 'Pay ₹999 via Secure Pay',
      cancelText: 'Keep Starter Plan',
      variant: 'primary',
    });
    if (confirmed) {
      checkoutMutation.mutate('GROWTH_MONTHLY');
    }
  };

  const handleContactSales = () => {
    setIsContactSalesOpen(true);
  };



  // -------------------------------------------------------------
  // Determine Plan Tier & Feature Entitlements
  // -------------------------------------------------------------
  const features = subscriptionData?.features || {};
  const hasWebsiteAccess = Boolean(features.BRANDED_WEBSITE);
  const hasPortfolioAccess = Boolean(features.PORTFOLIO_SHOWCASE);
  const hasCustomDomainAccess = Boolean(features.CUSTOM_DOMAIN_SUPPORT);

  const planCode = subscriptionData?.planCode;
  const isPremiumPlan = planCode === 'EXCLUSIVE_LIFETIME' || subscriptionData?.isPremium;
  const isGrowthPlan = planCode === 'GROWTH_MONTHLY' || (hasWebsiteAccess && !hasCustomDomainAccess);
  const isStarterPlan = !hasWebsiteAccess;

  const currentSlug = websiteData?.subdomain || currentBusiness?.slug || '';
  const isPublished = websiteData?.status === 'PUBLISHED';
  const customDomain = websiteData?.custom_domain || null;

  // Centralized URL generation with custom domain support and environment handling
  const fullPublicUrl = getPublicStudioUrl(currentSlug, customDomain);
  const fullPreviewUrl = getPreviewStudioUrl(currentSlug, customDomain);
  const publicWebUrl = fullPublicUrl || (currentSlug ? `/${currentSlug}` : '#');
  const previewWebUrl = fullPreviewUrl || (currentSlug ? `/${currentSlug}?preview=true` : '#');

  const handleCopyPublicUrl = () => {
    if (!fullPublicUrl) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(fullPublicUrl);
      addToast({
        title: 'URL Copied!',
        description: `Copied ${fullPublicUrl} to clipboard.`,
        variant: 'success',
      });
    } else {
      addToast({
        title: 'Public URL',
        description: fullPublicUrl,
        variant: 'info',
      });
    }
  };

  // -------------------------------------------------------------
  // Render: Loading State
  // -------------------------------------------------------------
  if (isSubLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Branded Website & Portfolio
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Checking business subscription and website privileges...
            </p>
          </div>
        </div>
        <Card className="p-12 border border-stone-200/80 shadow-sm bg-white">
          <LoadingSpinner text="Verifying studio subscription tier and entitlements..." />
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render: Error State
  // -------------------------------------------------------------
  if (isSubError) {
    return (
      <div className="space-y-6 pb-12">
        <Card className="p-8 border border-rose-200 bg-rose-50/40 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900">Subscription Verification Failed</h3>
          <p className="text-xs text-stone-600 mt-1 max-w-md mx-auto">
            {subError?.response?.data?.message || subError?.message || 'Unable to verify plan entitlements.'}
          </p>
          <div className="mt-4">
            <Button size="sm" onClick={() => refetchSubscription()} className="bg-orange-600 hover:bg-orange-700 text-white">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Retry Verification
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // CASE A: Starter Plan (₹599/mo) — Show Growth Upgrade Comparison
  // -------------------------------------------------------------
  if (isStarterPlan) {
    return (
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200 mb-2">
              Current Plan: Starter (₹599/mo)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
              Branded Website & Portfolio
            </h1>
            <p className="text-sm text-stone-500 mt-1 max-w-2xl">
              Elevate your bridal studio with a modern public website, live service and package catalogues, and an interactive bridal lookbook.
            </p>
          </div>
          <Button
            size="md"
            onClick={handleUpgradeToGrowth}
            isLoading={checkoutMutation.isPending}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-md transition-all self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Growth (₹999/mo)
          </Button>
        </div>

        {/* Growth Upgrade Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-orange-150 bg-gradient-to-br from-orange-50/80 via-white to-amber-50/60 p-6 sm:p-10 shadow-sm backdrop-blur-xs transition-all hover:shadow-md">
          {/* Subtle decorative glow circles */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-40 -bottom-20 w-60 h-60 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Globe className="w-6 h-6 animate-pulse" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-orange-100/90 text-orange-800 border border-orange-200 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                Growth & Premium Unlocked
              </div>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-tight">
                Supercharge Your Bridal Studio with a Branded Website
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed mt-2 max-w-2xl">
                Transform from standard back-office CRM to an iconic bridal brand. Give prospective brides an interactive online lookbook, service catalogue pricing, and direct enquiry booking on your custom address.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="group p-3.5 rounded-2xl bg-white/90 border border-stone-200/90 shadow-2xs hover:shadow-sm hover:border-orange-200 transition-all">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Globe className="w-4 h-4" />
                </div>
                <strong className="text-xs text-stone-900 block font-bold">Studio Subdomain</strong>
                <span className="text-[11px] text-stone-500 mt-0.5 block leading-normal">
                  Personalized link (e.g. saritha.vexatech.in)
                </span>
              </div>

              <div className="group p-3.5 rounded-2xl bg-white/90 border border-stone-200/90 shadow-2xs hover:shadow-sm hover:border-orange-200 transition-all">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Package className="w-4 h-4" />
                </div>
                <strong className="text-xs text-stone-900 block font-bold">Live Package Catalog</strong>
                <span className="text-[11px] text-stone-500 mt-0.5 block leading-normal">
                  Interactive pricing, service bundles & breakdown
                </span>
              </div>

              <div className="group p-3.5 rounded-2xl bg-white/90 border border-stone-200/90 shadow-2xs hover:shadow-sm hover:border-orange-200 transition-all">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <strong className="text-xs text-stone-900 block font-bold">HD Bridal Lookbook</strong>
                <span className="text-[11px] text-stone-500 mt-0.5 block leading-normal">
                  Muhurtham, Reception & Sangeet galleries
                </span>
              </div>

              <div className="group p-3.5 rounded-2xl bg-white/90 border border-stone-200/90 shadow-2xs hover:shadow-sm hover:border-orange-200 transition-all">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Zap className="w-4 h-4" />
                </div>
                <strong className="text-xs text-stone-900 block font-bold">Direct Client Enquiries</strong>
                <span className="text-[11px] text-stone-500 mt-0.5 block leading-normal">
                  Instant lead routing into your dashboard CRM
                </span>
              </div>
            </div>

            {/* Quick Action & Trust Badge */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Button
                size="md"
                onClick={handleUpgradeToGrowth}
                isLoading={checkoutMutation.isPending}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold shadow-md shadow-orange-600/25 px-6 py-2.5 rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade to Growth (₹999/mo)
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Instant Razorpay mandate activation • Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Comparison Matrix */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-lg font-extrabold text-stone-900 tracking-tight">
                Subscription Plan Breakdown
              </h3>
              <p className="text-xs text-stone-500">
                Transparent pricing with no setup fees or hidden surprises. Choose the right scale for your studio.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Secure via Secure Pay</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* 1. Starter */}
            <div className="group rounded-3xl border border-stone-200/90 bg-white p-7 relative flex flex-col justify-between shadow-xs transition-all hover:shadow-md hover:border-orange-200">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Starter Plan</span>
                  <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                    Current Active
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-stone-900 tracking-tight">₹1</span>
                  <span className="text-xs font-semibold text-stone-400">/ month</span>
                </div>
                <p className="text-xs text-stone-500 mt-2.5 leading-relaxed">
                  Essential CRM and studio operations management for bridal artists.
                </p>

                <div className="mt-6 space-y-3 text-xs">
                  <div className="flex items-center gap-2.5 text-stone-800 font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Customer, Bookings & Calendar</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-800 font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Quotations, Invoices & Payments</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-800 font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Expenses & Financial Tracking</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-800 font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Standalone Custom Enquiry Form</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-400 line-through">
                    <Lock className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                    <span>Branded Public Business Website</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-400 line-through">
                    <Lock className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                    <span>Public Services & Packages Catalog</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-400 line-through">
                    <Lock className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                    <span>Portfolio Lookbook Showcase</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-stone-100">
                <div className="w-full py-2.5 rounded-xl bg-stone-100 text-stone-600 text-xs font-bold text-center">
                  Current Active Plan
                </div>
              </div>
            </div>

            {/* 2. Growth (Theme Accent Highlighted) */}
            <div className="group rounded-3xl border-2 border-orange-500 bg-white p-7 relative flex flex-col justify-between shadow-xl shadow-orange-500/10 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/15">
              <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-3.5 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase shadow-md shadow-orange-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Most Popular
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Growth Plan</span>
                  <span className="text-[11px] font-bold text-orange-800 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                    Recurring Monthly
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-stone-900 tracking-tight">₹1</span>
                  <span className="text-xs font-semibold text-stone-500">/ month</span>
                </div>
                <p className="text-xs text-stone-600 mt-2.5 leading-relaxed">
                  All Starter features plus your complete branded public showcase and online customer bookings.
                </p>

                <div className="mt-6 space-y-3 text-xs">
                  <div className="flex items-center gap-2.5 text-stone-900 font-semibold">
                    <Check className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>Everything in Starter Plan</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-900 font-semibold">
                    <Check className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>Branded Public Studio Website</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-900 font-semibold">
                    <Check className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>Public Services & Packages Catalogue</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-900 font-semibold">
                    <Check className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>Bridal Portfolio Gallery & Lookbook</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-900 font-semibold">
                    <Check className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>Website Direct Client Enquiries</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-400 line-through">
                    <Lock className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                    <span>Custom Domain (.com / .in)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-400 line-through">
                    <Lock className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                    <span>Dedicated Cloud Server Hosting</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-orange-100">
                <Button
                  size="md"
                  onClick={handleUpgradeToGrowth}
                  isLoading={checkoutMutation.isPending}
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/25 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Upgrade to Growth (₹999/mo)
                </Button>
                <span className="block text-[11px] text-stone-400 text-center mt-2">
                  Recurring mandate via UPI / Debit / Netbanking
                </span>
              </div>
            </div>

            {/* 3. Premium (Warm Theme-Based Elegant Palette) */}
            <div className="group rounded-3xl border-2 border-amber-300/80 bg-gradient-to-b from-amber-50/50 via-white to-orange-50/30 p-7 relative flex flex-col justify-between shadow-md transition-all hover:-translate-y-1 hover:shadow-xl hover:border-amber-400">
              <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-3.5 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase shadow-md shadow-amber-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-200" />
                Lifetime VIP
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                    Premium Plan
                  </span>
                  <span className="text-[11px] font-bold text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
                    One-Time Payment
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-stone-900 tracking-tight">₹29,999</span>
                  <span className="text-xs font-semibold text-stone-500">one-time</span>
                </div>
                <p className="text-xs text-stone-600 mt-2.5 leading-relaxed">
                  White-glove custom domain, dedicated cloud infrastructure, and 1 full year of managed hosting.
                </p>

                <div className="mt-6 space-y-3 text-xs">
                  <div className="flex items-center gap-2.5 text-stone-900 font-semibold">
                    <Check className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Everything in Growth Plan</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-900 font-semibold">
                    <Check className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Custom Domain (.com / .in) Included</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-900 font-semibold">
                    <Check className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>1 Year Free Domain Registration</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-900 font-semibold">
                    <Check className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>1 Year Free Dedicated Cloud Hosting</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-stone-900 font-semibold">
                    <Check className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Priority White-Glove Onboarding</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-amber-100">
                <Button
                  size="md"
                  onClick={handleContactSales}
                  isLoading={checkoutMutation.isPending}
                  className="w-full bg-gradient-to-r from-stone-900 to-stone-950 hover:from-black hover:to-stone-900 text-amber-300 font-bold py-3 rounded-xl shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] border border-amber-500/20"
                >
                  <MessageSquare className="w-4 h-4 mr-2 text-amber-400" />
                  Contact Sales (₹29,999)
                </Button>
                <span className="block text-[11px] text-stone-400 text-center mt-2">
                  White-glove custom domain & dedicated setup
                </span>
              </div>

            </div>

          </div>

        </div>
      </div>
    );
  }


  // -------------------------------------------------------------
  // CASE B & C: Growth or Premium Plan — Complete Management Dashboard
  // -------------------------------------------------------------
  const publishedServicesCount = previewData?.services?.length ?? 0;
  const publishedPackagesCount = previewData?.packages?.length ?? 0;
  const portfolioItemsCount = portfolioItems?.length ?? 0;

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              {isPremiumPlan ? 'Premium Plan (Custom Domain & Dedicated Hosting)' : 'Growth Plan (Branded Website Active)'}
            </span>
            <Badge variant={isPublished ? 'success' : 'warning'}>
              {isPublished ? 'Live & Published' : 'Draft Mode'}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Branded Website & Portfolio
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Manage your bridal studio website, showcase your artistry, and let clients explore your services and packages.
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Public Preview Button */}
          {currentSlug && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(previewWebUrl, '_blank')}
              className="border-stone-300 text-stone-700 hover:bg-stone-50 font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Preview Website
            </Button>
          )}

          {/* Publish / Unpublish Button */}
          {isPublished ? (
            <Button
              variant="outline"
              size="sm"
              isLoading={unpublishMutation.isPending}
              onClick={() => unpublishMutation.mutate()}
              className="border-amber-300 text-amber-800 hover:bg-amber-50 font-medium"
            >
              Unpublish
            </Button>
          ) : (
            <Button
              size="sm"
              isLoading={publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
            >
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              Publish Website
            </Button>
          )}

          {/* Unified Save Button for Branding & Profile */}
          <Button
            size="sm"
            onClick={handleSaveAll}
            isLoading={isSavingAll}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-sm text-xs px-4"
          >
            Save All Settings
          </Button>

          {/* Premium Upgrade prompt if on Growth plan */}
          {!hasCustomDomainAccess && (
            <Button
              size="sm"
              onClick={handleContactSales}
              className="bg-stone-900 hover:bg-black text-white font-medium shadow-sm text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              Contact Sales for Premium
            </Button>
          )}
        </div>
      </div>


      {/* 2. Overview Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Studio Slug / Subdomain */}
        <Card className="p-4 sm:p-5 border border-stone-200/80 shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Website URL</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-sm sm:text-base font-bold text-stone-900 truncate">
              {currentSlug ? `${currentSlug}.vexatech.in` : 'Not set'}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">Public studio handle</p>
          </div>
        </Card>

        {/* Published Services */}
        <Card className="p-4 sm:p-5 border border-stone-200/80 shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Public Services</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {publishedServicesCount}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">Active catalogue services</p>
          </div>
        </Card>

        {/* Published Packages */}
        <Card className="p-4 sm:p-5 border border-stone-200/80 shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Public Packages</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {publishedPackagesCount}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">Bridal package bundles</p>
          </div>
        </Card>

        {/* Portfolio Showcase Items */}
        <Card className="p-4 sm:p-5 border border-stone-200/80 shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Lookbook Items</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {portfolioItemsCount}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">Showcase photographs</p>
          </div>
        </Card>
      </div>

      {/* 3. Section Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-stone-200 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          Overview & Status
        </button>
        <button
          onClick={() => setActiveTab('branding')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'branding'
              ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          Branding & Studio Profile
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'portfolio'
              ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          Portfolio Lookbook ({portfolioItemsCount})
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'catalog'
              ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          Public Catalogue ({publishedServicesCount + publishedPackagesCount})
        </button>
        <button
          onClick={() => setActiveTab('domain')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'domain'
              ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          Custom Domain & Hosting
          {!hasCustomDomainAccess && (
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
              Premium
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'billing'
              ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 mr-1" />
          Billing & Payments
        </button>
      </div>


      {/* 4. Tab Content: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Public Website URL Card */}
          <Card className="p-6 border border-stone-200/80 shadow-sm bg-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    Public Website URL
                  </span>
                  <Badge variant={isPublished ? 'success' : 'warning'}>
                    {isPublished ? 'Published & Live' : 'Unpublished (Draft)'}
                  </Badge>
                </div>
                <h3 className="text-lg font-extrabold text-stone-900 tracking-tight">
                  Your Studio Public Web Address
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Every eligible studio gets an exclusive public website URL under the shared domain. Share this link on Instagram, WhatsApp, or business cards for client enquiries.
                </p>

                {/* Display Address Box */}
                {currentSlug ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                    <div className="flex-1 flex items-center px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs sm:text-sm text-stone-800 break-all select-all shadow-2xs">
                      <span className="text-stone-400 select-none mr-1">URL:</span>
                      <span className="font-semibold text-orange-700">{fullPublicUrl}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    Your studio does not have a public slug configured yet. Please configure a unique slug in the Branding tab.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {currentSlug && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyPublicUrl}
                      className="border-stone-300 text-stone-700 hover:bg-stone-50 font-medium"
                      title="Copy Public Website URL to clipboard"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1.5 text-stone-500" />
                      Copy URL
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(previewWebUrl, '_blank')}
                      className="border-stone-300 text-stone-700 hover:bg-stone-50 font-medium"
                      title="Preview how website looks right now"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5 text-stone-500" />
                      Preview Website
                    </Button>

                    {isPublished && (
                      <Button
                        size="sm"
                        onClick={() => window.open(fullPublicUrl, '_blank')}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm"
                        title="Open live published website in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        Open Website
                      </Button>
                    )}
                  </>
                )}

                {!isPublished ? (
                  <Button
                    size="sm"
                    onClick={() => publishMutation.mutate()}
                    isLoading={publishMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                  >
                    <Globe className="w-3.5 h-3.5 mr-1.5" />
                    Publish Website
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => unpublishMutation.mutate()}
                    isLoading={unpublishMutation.isPending}
                    className="border-amber-300 text-amber-800 hover:bg-amber-50 font-medium text-xs"
                  >
                    Unpublish
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Website Deployment Status */}
          <Card className="p-6 border border-stone-200/80 shadow-sm bg-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-100">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900">Website Deployment Status</h3>
                <p className="text-xs text-stone-500">
                  Monitor publication state, public endpoint, and last modified timestamps.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isPublished ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(fullPublicUrl || publicWebUrl, '_blank')}
                    className="border-stone-300 text-stone-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Visit Live Site
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => publishMutation.mutate()}
                    isLoading={publishMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  >
                    <Globe className="w-3.5 h-3.5 mr-1.5" />
                    Go Live Now
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-stone-400 font-semibold uppercase tracking-wider block mb-1">
                  Public URL / Handle
                </span>
                <span className="font-mono text-stone-800 font-semibold break-all">
                  {currentSlug ? `/${currentSlug}` : 'Not set'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-stone-400 font-semibold uppercase tracking-wider block mb-1">
                  Publication Status
                </span>
                <span className="font-semibold text-stone-800">
                  {websiteData?.status || 'DRAFT'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-stone-400 font-semibold uppercase tracking-wider block mb-1">
                  Published At
                </span>
                <span className="font-medium text-stone-700">
                  {websiteData?.published_at ? formatDate(websiteData.published_at) : 'Draft (Not published yet)'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-stone-400 font-semibold uppercase tracking-wider block mb-1">
                  Last Updated
                </span>
                <span className="font-medium text-stone-700">
                  {websiteData?.updated_at ? formatDate(websiteData.updated_at) : 'Recently'}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Setup Checklist */}
          <Card className="p-6 border border-stone-200/80 shadow-sm bg-white">
            <h3 className="text-sm font-bold text-stone-900 mb-4">Website Readiness Checklist</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={`w-5 h-5 ${currentSlug ? 'text-emerald-600' : 'text-stone-300'}`} />
                  <div>
                    <span className="text-xs font-bold text-stone-800 block">Subdomain / Slug Configured</span>
                    <span className="text-[11px] text-stone-500">
                      {currentSlug ? `Configured as "${currentSlug}"` : 'Choose a unique handle in Branding settings'}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('branding')} className="text-xs">
                  Configure
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={`w-5 h-5 ${publishedServicesCount > 0 ? 'text-emerald-600' : 'text-stone-300'}`} />
                  <div>
                    <span className="text-xs font-bold text-stone-800 block">Services in Catalogue</span>
                    <span className="text-[11px] text-stone-500">
                      {publishedServicesCount} service{publishedServicesCount === 1 ? '' : 's'} available to brides
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('catalog')} className="text-xs">
                  View Catalogue
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={`w-5 h-5 ${portfolioItemsCount > 0 ? 'text-emerald-600' : 'text-stone-300'}`} />
                  <div>
                    <span className="text-xs font-bold text-stone-800 block">Lookbook Photos Uploaded</span>
                    <span className="text-[11px] text-stone-500">
                      {portfolioItemsCount} photo{portfolioItemsCount === 1 ? '' : 's'} in studio lookbook
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab('portfolio')} className="text-xs">
                  Manage Photos
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 5. Tab Content: BRANDING & STUDIO PROFILE */}
      {activeTab === 'branding' && (
        <form onSubmit={handleBrandingSubmit} className="space-y-6 pb-24">
          <Card className="p-6 border border-stone-200/80 shadow-sm bg-white space-y-5">
            <div>
              <h3 className="text-base font-bold text-stone-900">Website Identity & Subdomain</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Configure your studio URL handle and brand titles displayed on search engines and header tags.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Studio Public Slug / URL Handle <span className="text-orange-600">*</span>
                </label>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-3 py-2 bg-stone-100 border border-r-0 border-stone-200 rounded-l-xl text-xs font-mono text-stone-500 select-none">
                    app.varnam.vexatech.in/
                  </span>
                  <input
                    type="text"
                    value={brandingForm.subdomain}
                    onChange={(e) => setBrandingForm({ ...brandingForm, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="dharshinistudio"
                    className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-r-xl text-sm font-mono text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    required
                  />
                </div>
                <p className="text-[11px] text-stone-400 mt-1">Lowercase letters, numbers, and hyphens only (e.g. &quot;dharshinistudio&quot;, &quot;sarithabridalstudio&quot;). Reserved keywords are prevented.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Public Site Title
                </label>
                <input
                  type="text"
                  value={brandingForm.site_title}
                  onChange={(e) => setBrandingForm({ ...brandingForm, site_title: e.target.value })}
                  placeholder="e.g. Saritha Bridal Studio - Luxury Wedding Artistry"
                  className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Studio Tagline / Catchphrase
                </label>
                <input
                  type="text"
                  value={brandingForm.tagline}
                  onChange={(e) => setBrandingForm({ ...brandingForm, tagline: e.target.value })}
                  placeholder="e.g. Traditional & Modern Bridal Makeup Artistry in Madurai"
                  className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  About the Studio & Artistry Story
                </label>
                <textarea
                  rows={4}
                  value={brandingForm.about_text}
                  onChange={(e) => setBrandingForm({ ...brandingForm, about_text: e.target.value })}
                  placeholder="Introduce your signature bridal makeup style, HD and airbrush techniques, international certifications, and experience..."
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 leading-relaxed"
                />
              </div>
            </div>
          </Card>

          {/* Contact Details & Location */}
          <Card className="p-6 border border-stone-200/80 shadow-sm bg-white space-y-5">
            <div>
              <h3 className="text-base font-bold text-stone-900">Public Contact & Studio Location</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                These contact details appear on your public website for bride queries and bookings.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={brandingForm.contact_email}
                  onChange={(e) => setBrandingForm({ ...brandingForm, contact_email: e.target.value })}
                  placeholder="studio@example.com"
                  className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={brandingForm.contact_phone}
                  onChange={(e) => setBrandingForm({ ...brandingForm, contact_phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  WhatsApp Contact
                </label>
                <input
                  type="text"
                  value={brandingForm.whatsapp_phone}
                  onChange={(e) => setBrandingForm({ ...brandingForm, whatsapp_phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Studio Physical Address
                </label>
                <input
                  type="text"
                  value={brandingForm.public_address}
                  onChange={(e) => setBrandingForm({ ...brandingForm, public_address: e.target.value })}
                  placeholder="e.g. 42 Priyanka Avenue, APK Main Road, Madurai, Tamil Nadu"
                  className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Google Maps URL
                </label>
                <input
                  type="url"
                  value={brandingForm.map_url}
                  onChange={(e) => setBrandingForm({ ...brandingForm, map_url: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>
          </Card>

          {/* Visual Styling: Brand Color & Logo */}
          <Card className="p-6 border border-stone-200/80 shadow-sm bg-white space-y-5">
            <div>
              <h3 className="text-base font-bold text-stone-900">Brand Color & Logo</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Customize the visual accent palette used across buttons, highlight tags, and borders.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandingForm.primary_color || '#F97316'}
                    onChange={(e) => setBrandingForm({ ...brandingForm, primary_color: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-stone-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={brandingForm.primary_color || '#F97316'}
                    onChange={(e) => setBrandingForm({ ...brandingForm, primary_color: e.target.value })}
                    className="w-32 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono font-semibold text-stone-800 uppercase focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Studio Logo with Drag & Drop UI */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <span>Studio Logo</span>
                    <span className="text-[10px] font-normal text-stone-400">(Drag & Drop or Upload)</span>
                  </label>
                  <div className="flex items-center gap-1 text-[11px] bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                    <button
                      type="button"
                      onClick={() => setBrandingLogoMode('upload')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                        brandingLogoMode === 'upload'
                          ? 'bg-white text-orange-600 font-bold shadow-xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      File Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setBrandingLogoMode('url')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                        brandingLogoMode === 'url'
                          ? 'bg-white text-orange-600 font-bold shadow-xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {brandingLogoMode === 'upload' ? (
                  <div>
                    {brandingForm.logo_url ? (
                      <div className="relative p-3 bg-orange-50/30 border border-orange-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:border-orange-300 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-14 rounded-xl bg-white border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center p-1.5 shadow-2xs">
                            <img
                              src={brandingForm.logo_url}
                              alt="Studio Logo Preview"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-stone-800 truncate">
                                Logo Loaded
                              </span>
                              <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                                Active
                              </span>
                            </div>
                            <span className="text-[11px] text-stone-500 block truncate mt-0.5">
                              Displayed across header, nav, and site branding
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
                                if (e.target.files?.[0]) processBrandingLogoFile(e.target.files[0]);
                              }}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setBrandingForm((prev) => ({ ...prev, logo_url: '' }))}
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
                          setIsDraggingBrandingLogo(true);
                        }}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          setIsDraggingBrandingLogo(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          setIsDraggingBrandingLogo(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingBrandingLogo(false);
                          if (e.dataTransfer.files?.[0]) {
                            processBrandingLogoFile(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`group relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
                          isDraggingBrandingLogo
                            ? 'border-orange-500 bg-orange-100/50 scale-[0.99] ring-4 ring-orange-500/10'
                            : 'border-stone-300 hover:border-orange-400 bg-stone-50/70 hover:bg-orange-50/30'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-transform duration-200 group-hover:scale-110 shadow-2xs ${
                          isDraggingBrandingLogo ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'
                        }`}>
                          <Upload className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-stone-800 text-center">
                          {isDraggingBrandingLogo ? 'Drop logo here to upload' : 'Drag & drop studio logo here'}
                        </span>
                        <span className="text-[11px] text-stone-500 mt-0.5 text-center">
                          or <span className="text-orange-600 font-semibold underline underline-offset-2">browse file</span> (PNG, JPG, SVG, WebP)
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/avif"
                          onChange={(e) => {
                            if (e.target.files?.[0]) processBrandingLogoFile(e.target.files[0]);
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
                        value={brandingForm.logo_url}
                        onChange={(e) => setBrandingForm({ ...brandingForm, logo_url: e.target.value })}
                        placeholder="https://.../studio-logo.png"
                        className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                      {brandingForm.logo_url && (
                        <button
                          type="button"
                          onClick={() => setBrandingForm((prev) => ({ ...prev, logo_url: '' }))}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {brandingForm.logo_url && (
                      <div className="mt-2.5 relative w-16 h-16 rounded-xl overflow-hidden border border-stone-200 shadow-2xs p-1 bg-white">
                        <img src={brandingForm.logo_url} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Studio Business Hours (Opening & Closing times across the week) */}
          <Card className="p-4 sm:p-6 border border-stone-200/80 shadow-sm bg-white space-y-4 sm:space-y-5 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>Studio Business Hours (Opening &amp; Closing)</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 leading-relaxed">
                  Set daily opening and closing hours shown in your public website footer and consultation booking forms.
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              {hoursForm.map((item, idx) => (
                <div
                  key={item.day_of_week}
                  className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 ${
                    item.is_closed
                      ? 'bg-stone-50 border-stone-200/80 opacity-70'
                      : 'bg-white border-orange-100 hover:border-orange-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0 sm:min-w-[130px]">
                    <span className="font-bold text-stone-900 text-xs sm:text-sm">
                      {item.day_name}
                    </span>
                    {item.is_closed && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                        Closed
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-stone-600 select-none mr-1">
                      <input
                        type="checkbox"
                        checked={item.is_closed}
                        onChange={(e) => {
                          const updated = [...hoursForm];
                          updated[idx].is_closed = e.target.checked;
                          setHoursForm(updated);
                        }}
                        className="rounded border-stone-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span>Mark Closed</span>
                    </label>

                    {!item.is_closed && (
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] sm:text-[11px] text-stone-400 font-medium">Open:</span>
                          <input
                            type="text"
                            value={item.open_time || ''}
                            onChange={(e) => {
                              const updated = [...hoursForm];
                              updated[idx].open_time = e.target.value;
                              setHoursForm(updated);
                            }}
                            placeholder="09:00 AM"
                            className="w-20 sm:w-24 px-2 py-1 sm:py-1.5 bg-[#FFFDF9] border border-stone-200 rounded-lg text-xs font-medium text-stone-800 focus:outline-none focus:border-orange-500 text-center"
                          />
                        </div>

                        <span className="text-stone-300 font-bold">&ndash;</span>

                        <div className="flex items-center gap-1">
                          <span className="text-[10px] sm:text-[11px] text-stone-400 font-medium">Close:</span>
                          <input
                            type="text"
                            value={item.close_time || ''}
                            onChange={(e) => {
                              const updated = [...hoursForm];
                              updated[idx].close_time = e.target.value;
                              setHoursForm(updated);
                            }}
                            placeholder="08:00 PM"
                            className="w-20 sm:w-24 px-2 py-1 sm:py-1.5 bg-[#FFFDF9] border border-stone-200 rounded-lg text-xs font-medium text-stone-800 focus:outline-none focus:border-orange-500 text-center"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Studio About Section (Images, Story & Highlights) */}
          <Card className="p-6 border border-stone-200/80 shadow-sm bg-white space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  Studio About Section (Story &amp; Visuals)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Showcase your bridal background, experience metrics, and signature studio portrait photos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  About Section Title
                </label>
                <input
                  type="text"
                  value={aboutForm.title}
                  onChange={(e) => setAboutForm({ ...aboutForm, title: e.target.value })}
                  placeholder="e.g. About Our Studio"
                  className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Artistry Subtitle / Tagline
                </label>
                <input
                  type="text"
                  value={aboutForm.subtitle}
                  onChange={(e) => setAboutForm({ ...aboutForm, subtitle: e.target.value })}
                  placeholder="e.g. Where Bridal Artistry Meets Timeless Elegance"
                  className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Detailed Artist Story &amp; Technique
                </label>
                <textarea
                  rows={4}
                  value={aboutForm.description}
                  onChange={(e) => setAboutForm({ ...aboutForm, description: e.target.value })}
                  placeholder="Share your bridal artistry journey, high-definition techniques, skin-prep rituals, and passion for making brides look their best on their big day..."
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 leading-relaxed"
                />
              </div>

              {/* Trust Metric Badges */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Years of Experience
                </label>
                <input
                  type="text"
                  value={aboutForm.experience_years}
                  onChange={(e) => setAboutForm({ ...aboutForm, experience_years: e.target.value })}
                  placeholder="e.g. 8+ Years Experience"
                  className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Happy Brides Styled
                </label>
                <input
                  type="text"
                  value={aboutForm.brides_styled}
                  onChange={(e) => setAboutForm({ ...aboutForm, brides_styled: e.target.value })}
                  placeholder="e.g. 500+ Happy Brides"
                  className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Awards &amp; Certifications
                </label>
                <input
                  type="text"
                  value={aboutForm.awards_count}
                  onChange={(e) => setAboutForm({ ...aboutForm, awards_count: e.target.value })}
                  placeholder="e.g. Certified International Bridal Artist &bull; 15+ Awards"
                  className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* About Section Visual Photos (Primary and Secondary) with Drag & Drop UI */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <span>Primary Studio / Artist Photo</span>
                    <span className="text-orange-600 font-bold">*</span>
                  </label>
                  <div className="flex items-center gap-1 text-[11px] bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                    <button
                      type="button"
                      onClick={() => setAboutPrimaryMode('upload')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                        aboutPrimaryMode === 'upload'
                          ? 'bg-white text-orange-600 font-bold shadow-xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      File Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setAboutPrimaryMode('url')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                        aboutPrimaryMode === 'url'
                          ? 'bg-white text-orange-600 font-bold shadow-xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {aboutPrimaryMode === 'upload' ? (
                  <div>
                    {aboutForm.image_url ? (
                      <div className="relative p-3 bg-orange-50/30 border border-orange-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:border-orange-300 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-16 h-16 rounded-xl bg-white border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-2xs">
                            <img
                              src={aboutForm.image_url}
                              alt="Primary Artist Photo"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-stone-800 truncate">
                                Primary Portrait Loaded
                              </span>
                              <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                                Ready
                              </span>
                            </div>
                            <span className="text-[11px] text-stone-500 block truncate mt-0.5">
                              Appears as main visual on About section
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <label
                            className="px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-orange-600 bg-white hover:bg-orange-50 border border-stone-200 hover:border-orange-200 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Replace Photo"
                          >
                            <Upload className="w-3.5 h-3.5 text-orange-500" />
                            <span>Replace</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/avif"
                              onChange={(e) => {
                                if (e.target.files?.[0]) processAboutImageFile(e.target.files[0], 'image_url');
                              }}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setAboutForm((prev) => ({ ...prev, image_url: '' }))}
                            className="p-1.5 text-stone-400 hover:text-red-600 bg-white hover:bg-red-50 border border-stone-200 hover:border-red-200 rounded-lg transition-all shadow-2xs"
                            title="Remove Photo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingAboutPrimary(true);
                        }}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          setIsDraggingAboutPrimary(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          setIsDraggingAboutPrimary(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingAboutPrimary(false);
                          if (e.dataTransfer.files?.[0]) {
                            processAboutImageFile(e.dataTransfer.files[0], 'image_url');
                          }
                        }}
                        className={`group relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
                          isDraggingAboutPrimary
                            ? 'border-orange-500 bg-orange-100/50 scale-[0.99] ring-4 ring-orange-500/10'
                            : 'border-stone-300 hover:border-orange-400 bg-stone-50/70 hover:bg-orange-50/30'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-110 shadow-2xs ${
                          isDraggingAboutPrimary ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'
                        }`}>
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-stone-800 text-center">
                          {isDraggingAboutPrimary ? 'Drop photo here to upload' : 'Drag & drop artist photo here'}
                        </span>
                        <span className="text-[11px] text-stone-500 mt-0.5 text-center">
                          or <span className="text-orange-600 font-semibold underline underline-offset-2">browse file</span> (PNG, JPG, WebP)
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/avif"
                          onChange={(e) => {
                            if (e.target.files?.[0]) processAboutImageFile(e.target.files[0], 'image_url');
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
                        value={aboutForm.image_url}
                        onChange={(e) => setAboutForm({ ...aboutForm, image_url: e.target.value })}
                        placeholder="https://images.unsplash.com/... or public image link"
                        className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                      {aboutForm.image_url && (
                        <button
                          type="button"
                          onClick={() => setAboutForm((prev) => ({ ...prev, image_url: '' }))}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {aboutForm.image_url && (
                      <div className="mt-2.5 relative w-24 h-24 rounded-2xl overflow-hidden border border-stone-200 shadow-2xs">
                        <img src={aboutForm.image_url} alt="Primary" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                    <span>Secondary Showcase Photo</span>
                    <span className="text-[10px] font-normal text-stone-400">(Optional)</span>
                  </label>
                  <div className="flex items-center gap-1 text-[11px] bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                    <button
                      type="button"
                      onClick={() => setAboutSecondaryMode('upload')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                        aboutSecondaryMode === 'upload'
                          ? 'bg-white text-orange-600 font-bold shadow-xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      File Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setAboutSecondaryMode('url')}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                        aboutSecondaryMode === 'url'
                          ? 'bg-white text-orange-600 font-bold shadow-xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {aboutSecondaryMode === 'upload' ? (
                  <div>
                    {aboutForm.secondary_image_url ? (
                      <div className="relative p-3 bg-orange-50/30 border border-orange-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:border-orange-300 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-16 h-16 rounded-xl bg-white border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-2xs">
                            <img
                              src={aboutForm.secondary_image_url}
                              alt="Secondary Studio Photo"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-stone-800 truncate">
                                Secondary Photo Loaded
                              </span>
                              <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                                Ready
                              </span>
                            </div>
                            <span className="text-[11px] text-stone-500 block truncate mt-0.5">
                              Complementary visual for studio showcase
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <label
                            className="px-2.5 py-1 text-xs font-medium text-stone-600 hover:text-orange-600 bg-white hover:bg-orange-50 border border-stone-200 hover:border-orange-200 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Replace Photo"
                          >
                            <Upload className="w-3.5 h-3.5 text-orange-500" />
                            <span>Replace</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/avif"
                              onChange={(e) => {
                                if (e.target.files?.[0]) processAboutImageFile(e.target.files[0], 'secondary_image_url');
                              }}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setAboutForm((prev) => ({ ...prev, secondary_image_url: '' }))}
                            className="p-1.5 text-stone-400 hover:text-red-600 bg-white hover:bg-red-50 border border-stone-200 hover:border-red-200 rounded-lg transition-all shadow-2xs"
                            title="Remove Photo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingAboutSecondary(true);
                        }}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          setIsDraggingAboutSecondary(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          setIsDraggingAboutSecondary(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingAboutSecondary(false);
                          if (e.dataTransfer.files?.[0]) {
                            processAboutImageFile(e.dataTransfer.files[0], 'secondary_image_url');
                          }
                        }}
                        className={`group relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
                          isDraggingAboutSecondary
                            ? 'border-orange-500 bg-orange-100/50 scale-[0.99] ring-4 ring-orange-500/10'
                            : 'border-stone-300 hover:border-orange-400 bg-stone-50/70 hover:bg-orange-50/30'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-110 shadow-2xs ${
                          isDraggingAboutSecondary ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'
                        }`}>
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-stone-800 text-center">
                          {isDraggingAboutSecondary ? 'Drop photo here to upload' : 'Drag & drop secondary photo here'}
                        </span>
                        <span className="text-[11px] text-stone-500 mt-0.5 text-center">
                          or <span className="text-orange-600 font-semibold underline underline-offset-2">browse file</span> (PNG, JPG, WebP)
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/avif"
                          onChange={(e) => {
                            if (e.target.files?.[0]) processAboutImageFile(e.target.files[0], 'secondary_image_url');
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
                        value={aboutForm.secondary_image_url}
                        onChange={(e) => setAboutForm({ ...aboutForm, secondary_image_url: e.target.value })}
                        placeholder="https://images.unsplash.com/... or second photo"
                        className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                      {aboutForm.secondary_image_url && (
                        <button
                          type="button"
                          onClick={() => setAboutForm((prev) => ({ ...prev, secondary_image_url: '' }))}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {aboutForm.secondary_image_url && (
                      <div className="mt-2.5 relative w-24 h-24 rounded-2xl overflow-hidden border border-stone-200 shadow-2xs">
                        <img src={aboutForm.secondary_image_url} alt="Secondary" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Website Footer Customization Builder */}
          <FooterBuilderSection
            footerData={footerData}
            business={currentBusiness || {}}
            businessHours={hoursForm || []}
            servicesCount={publishedServicesCount}
            packagesCount={publishedPackagesCount}
            portfolioCount={portfolioItemsCount}
            slug={currentSlug}
            onChange={(updatedFooter) => setFooterBuilderState(updatedFooter)}
            onPreviewWebsite={() => {
              if (currentSlug) {
                window.open(previewWebUrl, '_blank');
              } else {
                addToast({
                  title: 'Slug Required',
                  description: 'Please set and save your studio subdomain before previewing.',
                  variant: 'warning',
                });
              }
            }}
            onPublishWebsite={() => publishMutation.mutate()}
            isPublishing={publishMutation.isPending}
          />

          {/* Docked Fixed Sticky Bottom Bar for all Branding & Profile sections */}
          <div className="fixed bottom-0 left-0 right-0 md:left-64 sm:md:left-72 z-40 flex items-center justify-between gap-4 px-4 sm:px-8 py-3.5 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-2.5 text-stone-700 text-xs font-medium min-w-0">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="font-bold text-stone-900 block sm:inline">Unified Website Controls: </span>
                <span className="text-stone-500 hidden sm:inline">Saves identity, contact, hours, story &amp; footer together.</span>
              </div>
            </div>
            <Button
              type="submit"
              size="md"
              isLoading={isSavingAll}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm px-6 py-2.5 shadow-sm rounded-xl shrink-0"
            >
              Save All Settings
            </Button>
          </div>
        </form>
      )}

      {/* 6. Tab Content: PORTFOLIO LOOKBOOK */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">Bridal Lookbook Showcase</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Curate bridal styles, muhurtham makeovers, and reception looks visible on your public website.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsPortfolioModalOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Portfolio Photo
            </Button>
          </div>

          {isPortfolioLoading ? (
            <Card className="p-12 border border-stone-200/80 shadow-sm bg-white">
              <LoadingSpinner text="Loading portfolio gallery..." />
            </Card>
          ) : portfolioItems.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="No portfolio lookbook items yet"
              description="Add high-resolution photographs of your bridal work to showcase your makeup artistry to visiting brides."
              action={
                <Button size="sm" onClick={() => setIsPortfolioModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add First Lookbook Photo
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {portfolioItems.map((item) => (
                <Card key={item.id} className="overflow-hidden border border-stone-200/80 shadow-sm bg-white flex flex-col p-0">
                  <div className="aspect-[3/4] bg-stone-100 relative overflow-hidden group">
                    <img
                      src={item.image_url}
                      alt={item.title || 'Bridal work'}
                      className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop';
                      }}
                    />
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-stone-800 shadow-2xs backdrop-blur-xs">
                        {item.category || 'Bridal'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">{item.title || 'Bridal Makeover'}</h4>
                      {item.description && (
                        <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[11px] text-stone-400">
                        {formatDate(item.created_at)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePortfolioItem(item)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs px-2"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. Tab Content: PUBLIC CATALOGUE */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">Public Services & Packages Catalogue</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Active services and bridal packages displayed on your website for prospective brides.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/services'}
                className="text-xs"
              >
                Manage Services
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/packages'}
                className="text-xs"
              >
                Manage Packages
              </Button>
            </div>
          </div>

          {/* Services List */}
          <Card className="p-6 border border-stone-200/80 shadow-sm bg-white">
            <h4 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-orange-600" />
              Public Services ({previewData?.services?.length ?? 0})
            </h4>

            {previewData?.services?.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-2">
                No active services in catalogue. Create services under Services & Sales.
              </p>
            ) : (
              <div className="divide-y divide-stone-100">
                {previewData?.services?.map((svc) => (
                  <div key={svc.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <h5 className="font-semibold text-stone-800 text-xs">{svc.name}</h5>
                      {svc.description && <p className="text-[11px] text-stone-500 mt-0.5">{svc.description}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-stone-900 text-xs">
                        {Number(svc.default_price_paise) > 0
                          ? formatINR(svc.default_price_paise)
                          : 'On Request'}
                      </span>
                      {svc.duration_minutes && (
                        <span className="text-[11px] text-stone-400 block">{svc.duration_minutes} mins</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Packages List */}
          <Card className="p-6 border border-stone-200/80 shadow-sm bg-white">
            <h4 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-600" />
              Public Packages ({previewData?.packages?.length ?? 0})
            </h4>

            {previewData?.packages?.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-2">
                No active bridal packages found. Build bundles under Packages & Bundles.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {previewData?.packages?.map((pkg) => (
                  <div key={pkg.id} className="p-4 rounded-xl bg-stone-50/70 border border-stone-200 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-bold text-stone-900 text-xs">{pkg.name}</h5>
                      <span className="font-extrabold text-orange-600 text-xs shrink-0">
                        {Number(pkg.price_paise) > 0
                          ? formatINR(pkg.price_paise)
                          : 'On Request'}
                      </span>
                    </div>
                    {pkg.description && (
                      <p className="text-[11px] text-stone-500 line-clamp-2">{pkg.description}</p>
                    )}
                    {pkg.package_services?.length > 0 && (
                      <div className="pt-2 border-t border-stone-200/60 flex flex-wrap gap-1">
                        {pkg.package_services.map((ps) => (
                          <span key={ps.id} className="text-[10px] bg-white border border-stone-200 px-1.5 py-0.5 rounded text-stone-600">
                            {ps.service_name_snapshot}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 8. Tab Content: CUSTOM DOMAIN & HOSTING */}
      {activeTab === 'domain' && (
        <div className="space-y-6">
          {!hasCustomDomainAccess ? (
            /* Premium Upgrade Prompt for Growth businesses */
            <div className="p-8 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">Custom Domain & Dedicated Hosting (Premium Only)</h3>
              <p className="text-xs text-stone-600 max-w-lg mx-auto leading-relaxed">
                Connect your own independent domain name (e.g., <strong>www.yourbridalstudio.com</strong>) with dedicated high-speed cloud hosting and SSL certificate.
                Includes <strong>1 year of free domain registration & server hosting</strong> under the Premium Plan terms.
              </p>
              <div className="pt-2">
                <Button
                  size="md"
                  onClick={handleContactSales}
                  isLoading={checkoutMutation.isPending}
                  className="bg-stone-900 hover:bg-black text-white font-semibold shadow-sm"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-amber-400" />
                  Contact Sales for Premium (₹29,999 One-Time)
                </Button>
              </div>
            </div>
          ) : (
            /* Premium Active: Custom Domain & Hosting Controls */
            <div className="space-y-6">
              <Card className="p-6 border border-stone-200/80 shadow-sm bg-white space-y-5">
                <div>
                  <h3 className="text-base font-bold text-stone-900">Custom Domain Name Configuration</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Connect your registered custom domain to point directly to your studio website.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Custom Domain
                    </label>
                    <input
                      type="text"
                      value={brandingForm.custom_domain}
                      onChange={(e) => setBrandingForm({ ...brandingForm, custom_domain: e.target.value.toLowerCase().trim() })}
                      placeholder="e.g. sarithabridalstudio.com"
                      className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-sm font-mono text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    <p className="text-[11px] text-stone-400 mt-1">Domain without http:// or https://</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Verification Status
                    </label>
                    <div className="h-9 px-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs font-medium">
                      <span className="text-stone-700">
                        {websiteData?.custom_domain ? 'Pending DNS Verification' : 'Not Connected'}
                      </span>
                      <Badge variant="warning">Verification Needed</Badge>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={handleBrandingSubmit}
                    isLoading={saveWebsiteMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
                  >
                    Save Domain Settings
                  </Button>
                </div>
              </Card>

              {/* DNS Instructions */}
              <Card className="p-6 border border-stone-200/80 shadow-sm bg-white space-y-3">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-orange-600" />
                  DNS Records Configuration
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  To complete domain pointing, create these DNS records in your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-stone-200 rounded-xl overflow-hidden">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
                      <tr>
                        <th className="p-3">Type</th>
                        <th className="p-3">Host / Name</th>
                        <th className="p-3">Points to (Value)</th>
                        <th className="p-3">TTL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-800 font-mono text-[11px]">
                      <tr>
                        <td className="p-3 font-semibold text-orange-700">CNAME</td>
                        <td className="p-3">www</td>
                        <td className="p-3">cname.vexatech.in</td>
                        <td className="p-3">Automatic</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-orange-700">A</td>
                        <td className="p-3">@</td>
                        <td className="p-3">76.76.21.21</td>
                        <td className="p-3">Automatic</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-[11px] text-stone-400 pt-1">
                  * Note: DNS changes can take up to 24–48 hours to propagate globally.
                </p>
              </Card>

              {/* Hosting details */}
              <Card className="p-6 border border-stone-200/80 shadow-sm bg-white space-y-3">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Dedicated Hosting Status
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-stone-400 block mb-1">Server Cluster</span>
                    <span className="font-semibold text-stone-800">AWS Mumbai (ap-south-1)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-stone-400 block mb-1">SSL Certificate</span>
                    <span className="font-semibold text-emerald-700">Auto Let&apos;s Encrypt (Free)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="text-stone-400 block mb-1">Included Hosting Expiry</span>
                    <span className="font-semibold text-stone-800">
                      {subscriptionData?.endsAt ? formatDate(subscriptionData.endsAt) : '1 Year Active'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* 5. Tab Content: BILLING & PAYMENT ORDERS */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Active Plan Card */}
          <Card className="p-6 border border-stone-200/80 shadow-sm bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
              <div>
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                  Active Subscription Tier
                </span>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-extrabold text-stone-900">
                    {subscriptionData?.planName || (isPremiumPlan ? 'Premium Plan' : 'Growth Plan')}
                  </h3>
                  <Badge variant={subscriptionData?.hasActiveSubscription ? 'success' : 'warning'}>
                    {subscriptionData?.hasActiveSubscription ? 'Active Mandate' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Billing Type:{' '}
                  {subscriptionData?.billingType === 'ONE_TIME'
                    ? 'One-time Lifetime (1 Year Hosting Included)'
                    : `Recurring ${subscriptionData?.billingInterval === 'MONTHLY' ? 'Monthly' : subscriptionData?.billingInterval || 'Monthly'} (₹${subscriptionData?.priceRupees?.toLocaleString('en-IN') || (isPremiumPlan ? '29,999' : '999')}/mo)`}
                </p>
              </div>

              {!hasCustomDomainAccess && (
                <Button
                  size="sm"
                  onClick={handleContactSales}
                  isLoading={checkoutMutation.isPending}
                  className="bg-stone-900 hover:bg-black text-white font-medium text-xs shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                  Contact Sales for Premium (₹29,999)
                </Button>
              )}

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70">
                <span className="text-stone-400 block mb-0.5">Billing Interval</span>
                <span className="font-semibold text-stone-800">
                  {subscriptionData?.billingType === 'ONE_TIME'
                    ? 'Annual / One-Time'
                    : subscriptionData?.billingInterval === 'MONTHLY'
                    ? 'Monthly Recurring'
                    : subscriptionData?.billingInterval || 'Monthly Recurring'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70">
                <span className="text-stone-400 block mb-0.5">Payment Provider</span>
                <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Razorpay Payments
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70">
                <span className="text-stone-400 block mb-0.5">Next Renewal / Expiry</span>
                <span className="font-semibold text-stone-800">
                  {subscriptionData?.endsAt ? formatDate(subscriptionData.endsAt) : 'Active'}
                </span>
              </div>
            </div>
          </Card>

          {/* Payment & Order History Table */}
          <Card className="border border-stone-200/80 shadow-sm bg-white overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-stone-600" />
                  Subscription Payment Orders & Receipts
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Verifiable ledger of all subscription and upgrade transactions.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetchPaymentHistory()}
                className="border-stone-200 text-stone-700 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Refresh Orders
              </Button>
            </div>

            {isHistoryLoading ? (
              <div className="py-12">
                <LoadingSpinner text="Loading payment orders..." />
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="p-10 text-center">
                <CreditCard className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-xs text-stone-500">No payment orders recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-100">
                    <tr>
                      <th className="px-5 py-3">Order / Reference ID</th>
                      <th className="px-5 py-3">Plan Details</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Payment Method</th>
                      <th className="px-5 py-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {paymentHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-stone-900 font-medium">
                          {item.orderId}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-stone-900 block">{item.planName}</span>
                          <span className="text-[10px] text-stone-400">{item.orderType}</span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-stone-900">
                          ₹{item.amountRupees ? item.amountRupees.toLocaleString('en-IN') : 0}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={
                              item.status === 'SUCCESS' || item.status === 'PAID'
                                ? 'success'
                                : item.status === 'PENDING'
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-stone-500">
                          {item.paymentMethod || 'Online (Razorpay)'}
                        </td>
                        <td className="px-5 py-3.5 text-stone-500 whitespace-nowrap">
                          {item.paidAt ? formatDate(item.paidAt) : formatDate(item.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}


      {/* 9. Modern Interactive Portfolio Lookbook Modal */}
      {isPortfolioModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsPortfolioModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-orange-100 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-stone-100 bg-gradient-to-r from-orange-50/60 via-amber-50/30 to-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-2xs">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Add Lookbook Photograph</h3>
                  <p className="text-[11px] text-stone-500">Showcase high-resolution bridal artistry on your public website</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPortfolioModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!portfolioForm.image_url) {
                  addToast({
                    title: 'Image Required',
                    description: 'Please upload a photo, choose a preset, or enter an image URL.',
                    variant: 'danger',
                  });
                  return;
                }
                createPortfolioMutation.mutate(portfolioForm);
              }}
              className="p-6 space-y-4.5 text-xs max-h-[80vh] overflow-y-auto custom-scrollbar"
            >
              {/* Image Input Section with Modern Dropdown / Upload Tabs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-stone-800 flex items-center gap-1.5">
                    Photograph Source <span className="text-orange-600">*</span>
                  </label>
                  <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200/70">
                    <button
                      type="button"
                      onClick={() => setPortfolioImageMode('upload')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                        portfolioImageMode === 'upload'
                          ? 'bg-white text-orange-600 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      File Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setPortfolioImageMode('preset')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                        portfolioImageMode === 'preset'
                          ? 'bg-white text-orange-600 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Presets Gallery
                    </button>
                    <button
                      type="button"
                      onClick={() => setPortfolioImageMode('url')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                        portfolioImageMode === 'url'
                          ? 'bg-white text-orange-600 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {/* Mode 1: Interactive Drag & Drop File Upload */}
                {portfolioImageMode === 'upload' && (
                  <div>
                    <label
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingPortfolio(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingPortfolio(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingPortfolio(false);
                        const file = e.dataTransfer?.files?.[0];
                        processPortfolioImageFile(file);
                      }}
                      className={`relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
                        isDraggingPortfolio
                          ? 'border-orange-500 bg-orange-500/10 scale-[1.01]'
                          : 'border-orange-200 hover:border-orange-400 bg-gradient-to-b from-[#FFFDF9] to-orange-50/20'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif,image/gif"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          processPortfolioImageFile(file);
                          if (e.target) e.target.value = '';
                        }}
                      />
                      <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-2.5 shadow-2xs">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-stone-800 text-xs">
                        <span className="text-orange-600 underline">Click to choose image</span> or drop photo here
                      </p>
                      <p className="text-[11px] text-stone-400 mt-1">
                        Supports PNG, JPG, WebP, SVG, AVIF up to 4.5MB
                      </p>
                    </label>
                  </div>
                )}

                {/* Mode 2: Curated Luxury Bridal Photography Presets */}
                {portfolioImageMode === 'preset' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-stone-500">
                      Select one of our curated high-fashion Indian bridal photography presets:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {BRIDAL_PHOTO_PRESETS.map((preset) => {
                        const isSelected = portfolioForm.image_url === preset.url;
                        return (
                          <div
                            key={preset.id}
                            onClick={() => {
                              setPortfolioForm((prev) => ({
                                ...prev,
                                image_url: preset.url,
                                title: prev.title || preset.title,
                                category: preset.category,
                              }));
                            }}
                            className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-orange-600 ring-2 ring-orange-500/30 scale-102 shadow-md'
                                : 'border-stone-200 hover:border-orange-300'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.title}
                              className="w-full h-20 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-stone-950/80 to-transparent">
                              <span className="text-[9px] text-white font-semibold truncate block">
                                {preset.title}
                              </span>
                            </div>
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-xs">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mode 3: Direct URL Link */}
                {portfolioImageMode === 'url' && (
                  <div>
                    <input
                      type="url"
                      value={portfolioForm.image_url}
                      onChange={(e) => setPortfolioForm({ ...portfolioForm, image_url: e.target.value })}
                      placeholder="https://images.unsplash.com/... or public image link"
                      className="w-full px-3.5 py-2.5 bg-[#FFFDF9] border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                )}

                {/* Active Photo Live Preview Box */}
                {portfolioForm.image_url && (
                  <div className="mt-3 p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={portfolioForm.image_url}
                        alt="Preview"
                        className="w-14 h-14 rounded-xl object-cover border border-stone-200 shadow-2xs shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-stone-800 text-xs block truncate">
                          {portfolioForm.title || 'Selected Photo'}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Ready to display
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPortfolioForm((prev) => ({ ...prev, image_url: '' }))}
                      className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-stone-200/60 transition-colors"
                      title="Remove selected image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Title / Description */}
              <div>
                <label className="block font-bold text-stone-800 mb-1.5">
                  Title / Look Description
                </label>
                <input
                  type="text"
                  value={portfolioForm.title}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                  placeholder="e.g. Classic Muhurtham Bridal Glow"
                  className="w-full px-3.5 py-2.5 bg-[#FFFDF9] border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {/* Modern Bridal Category Dropdown */}
              <div>
                <label className="block font-bold text-stone-800 mb-1.5">
                  Bridal Category
                </label>
                <ModernDropdown
                  value={portfolioForm.category}
                  onChange={(val) => setPortfolioForm({ ...portfolioForm, category: val })}
                  options={PORTFOLIO_CATEGORY_OPTIONS}
                  placeholder="Select bridal category..."
                  className="w-full"
                />
              </div>

              {/* Detailed Notes */}
              <div>
                <label className="block font-bold text-stone-800 mb-1.5">
                  Detailed Notes / Artistry Technique
                </label>
                <textarea
                  rows={2}
                  value={portfolioForm.description}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                  placeholder="Highlight products used, waterproof HD finish, jewellery matching..."
                  className="w-full px-3.5 py-2.5 bg-[#FFFDF9] border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPortfolioModalOpen(false)}
                  className="text-stone-600 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={createPortfolioMutation.isPending}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Add Photo to Lookbook
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premium Contact Sales Modal */}
      <ContactSalesModal
        isOpen={isContactSalesOpen}
        onClose={() => setIsContactSalesOpen(false)}
      />
    </div>
  );
}




