'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Send,
  Plus,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Calendar,
  Sparkles,
  RefreshCw,
  X,
  ChevronRight,
  ExternalLink,
  Layers,
  ArrowRight,
  Tag,
  Check,
  Ban,
  Upload,
  Image as ImageIcon,
  Trash2,
  Edit3,
  Pencil,
  MessageCircle,
  Zap,
  Lock,
  ChevronDown,
  Info,
  Phone,
  UserCheck,
  CheckSquare,
  Square,
  AlertCircle,
  User,
} from 'lucide-react';
import {
  Card,
  Button,
  Input,
  LoadingSpinner,
  EmptyState,
  Badge,
  ModernDropdown,
  ModernDatePicker,
} from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { campaignApi, packageApi, whatsappBillingApi, customerApi } from '@/services/api/modules';
import { formatDate } from '@/utils/formatters';
import { WhatsAppWalletCard } from '@/components/campaigns/WhatsAppWalletCard';
import { useAuthStore } from '@/store/authStore';

const SEGMENTS = [
  { value: 'ALL_CONTACTS', label: 'All Contacts', description: 'All clients and contacts with an email address' },
  { value: 'PAST_CUSTOMERS', label: 'Previous Brides & Clients', description: 'Customers with confirmed or completed bookings' },
  { value: 'ENQUIRIES_NOT_BOOKED', label: 'Enquiries Not Yet Booked', description: 'Leads who submitted enquiries but have not reserved' },
  { value: 'SPECIFIC_SERVICE', label: 'Specific Package Bookers', description: 'Customers who reserved a specific bridal package' },
  { value: 'CUSTOMER_DATA_WISE', label: 'Customer Data Wise', description: 'Manually select specific individual clients from your studio customer records' },
];

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { user, currentBusiness } = useAuthStore();

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create' | 'whatsapp'
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isTestEmailModalOpen, setIsTestEmailModalOpen] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [campaignToDelete, setCampaignToDelete] = useState(null);

  // WhatsApp Campaign (Template 9) state
  const [waSubTab, setWaSubTab] = useState('automated'); // 'automated' (Templates 1-8) | 'manual' (Template 9) | 'history' (WhatsApp Broadcasts)
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState(null);
  const [waCampaignForm, setWaCampaignForm] = useState({
    campaign_name: '',
    package_name: '',
    offer_description: '',
    offer_end_date: '',
    recipient_segment: 'ALL_CONTACTS',
    target_package_id: '',
    customer_ids: [],
  });
  const [waCustomerSearch, setWaCustomerSearch] = useState('');
  const [emailCustomerSearch, setEmailCustomerSearch] = useState('');
  const [isWaConfirmModalOpen, setIsWaConfirmModalOpen] = useState(false);
  const [testingTemplate, setTestingTemplate] = useState(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isSendingTestWa, setIsSendingTestWa] = useState(false);

  // Drag and drop banner image upload state
  const bannerFileInputRef = React.useRef(null);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);

  const handleBannerFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast({
        title: 'Invalid File',
        description: 'Please upload a valid image file (PNG, JPG, WebP, etc.)',
        variant: 'danger',
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: 'File Too Large',
        description: 'Banner image must be under 5MB',
        variant: 'danger',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Url = e.target.result;
      setFormData((prev) => ({ ...prev, banner_url: base64Url }));
      addToast({
        title: 'Banner Image Loaded',
        description: `${file.name} ready for campaign email.`,
        variant: 'success',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleBannerDrop = (e) => {
    e.preventDefault();
    setIsDraggingBanner(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleBannerFile(e.dataTransfer.files[0]);
    }
  };

  // Form state for creating / editing
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    heading: '',
    body_text: '',
    banner_url: '',
    cta_text: 'Book Your Bridal Consultation',
    cta_url: '',
    recipient_segment: 'ALL_CONTACTS',
    target_package_id: '',
    customer_ids: [],
    scheduled_at: '',
  });

  // Query: Customers (for Customer Data Wise selection)
  const { data: customersData, isLoading: isCustomersLoading } = useQuery({
    queryKey: ['campaign-customers-list'],
    queryFn: async () => {
      const res = await customerApi.list({ limit: 100 });
      return res.data?.customers || res.data || [];
    },
  });

  const allStudioCustomers = Array.isArray(customersData) ? customersData : [];

  // Query: Campaigns List
  const {
    data: campaignsData,
    isLoading: isCampaignsLoading,
    refetch: refetchCampaigns,
  } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignApi.list({ limit: 50 }),
  });

  // Query: Packages (for targeting specific package)
  const { data: packagesData } = useQuery({
    queryKey: ['packages', 'campaigns'],
    queryFn: async () => {
      const res = await packageApi.list({ is_active: true, limit: 50 });
      return res.data?.packages || res.data || [];
    },
  });

  // Query: Live Audience Count Preview
  const { data: audienceCountData, isLoading: isAudienceLoading } = useQuery({
    queryKey: ['campaign-audience-count', formData.recipient_segment, formData.target_package_id, formData.customer_ids],
    queryFn: () =>
      campaignApi.getAudienceCount({
        segment: formData.recipient_segment,
        packageId: formData.target_package_id || undefined,
        customerIds: formData.customer_ids?.length ? formData.customer_ids.join(',') : undefined,
      }),
  });

  const allCampaigns = Array.isArray(campaignsData?.data)
    ? campaignsData.data
    : Array.isArray(campaignsData?.data?.campaigns)
    ? campaignsData.data.campaigns
    : [];

  // Filter Email campaigns (strictly exclude WhatsApp broadcast campaigns from Email tab)
  const isWhatsAppCampaign = (c) =>
    (c.subject && c.subject.startsWith('WhatsApp:')) ||
    (c.heading && c.heading.toLowerCase().includes('special bridal packages:')) ||
    (c.name && c.name.toLowerCase().includes('whatsapp'));

  const emailCampaigns = allCampaigns.filter((c) => !isWhatsAppCampaign(c));
  const whatsAppBroadcastHistory = allCampaigns.filter((c) => isWhatsAppCampaign(c));
  const campaigns = emailCampaigns;

  const packages = Array.isArray(packagesData)
    ? packagesData
    : Array.isArray(packagesData?.packages)
    ? packagesData.packages
    : Array.isArray(packagesData?.data)
    ? packagesData.data
    : [];
  const audienceCount = audienceCountData?.data?.count ?? 0;

  // Mutation: Create Campaign
  const createCampaignMutation = useMutation({
    mutationFn: (data) => campaignApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      addToast({
        title: 'Campaign Created',
        description: 'New marketing campaign draft saved successfully.',
        variant: 'success',
      });
      setActiveTab('list');
      setEditingCampaignId(null);
      setFormData({
        name: '',
        subject: '',
        heading: '',
        body_text: '',
        banner_url: '',
        cta_text: 'Book Your Bridal Consultation',
        cta_url: '',
        recipient_segment: 'ALL_CONTACTS',
        target_package_id: '',
        scheduled_at: '',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create campaign';
      addToast({ title: 'Error', description: msg, variant: 'danger' });
    },
  });

  // Mutation: Update Campaign
  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, data }) => campaignApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      addToast({
        title: 'Campaign Updated',
        description: 'Campaign changes saved successfully.',
        variant: 'success',
      });
      setActiveTab('list');
      setEditingCampaignId(null);
      setFormData({
        name: '',
        subject: '',
        heading: '',
        body_text: '',
        banner_url: '',
        cta_text: 'Book Your Bridal Consultation',
        cta_url: '',
        recipient_segment: 'ALL_CONTACTS',
        target_package_id: '',
        scheduled_at: '',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update campaign';
      addToast({ title: 'Update Failed', description: msg, variant: 'danger' });
    },
  });

  // Mutation: Delete Campaign
  const deleteCampaignMutation = useMutation({
    mutationFn: (id) => campaignApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      if (selectedCampaign) {
        setIsDetailDrawerOpen(false);
      }
      setCampaignToDelete(null);
      addToast({
        title: 'Campaign Deleted',
        description: 'The campaign has been permanently removed.',
        variant: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to delete campaign';
      addToast({ title: 'Delete Failed', description: msg, variant: 'danger' });
    },
  });

  // Mutation: Launch Campaign
  const launchMutation = useMutation({
    mutationFn: (id) => campaignApi.launch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      if (selectedCampaign) {
        setIsDetailDrawerOpen(false);
      }
      addToast({
        title: 'Campaign Launched',
        description: 'Emails are being dispatched to the eligible audience!',
        variant: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to launch campaign';
      addToast({ title: 'Launch Failed', description: msg, variant: 'danger' });
    },
  });

  // Mutation: Cancel Campaign
  const cancelMutation = useMutation({
    mutationFn: (id) => campaignApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      if (selectedCampaign) {
        setIsDetailDrawerOpen(false);
      }
      addToast({
        title: 'Campaign Cancelled',
        description: 'The campaign has been cancelled.',
        variant: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to cancel campaign';
      addToast({ title: 'Error', description: msg, variant: 'danger' });
    },
  });

  // Mutation: Send Test Email
  const sendTestMutation = useMutation({
    mutationFn: ({ id, email }) => campaignApi.sendTest(id, { test_email: email }),
    onSuccess: () => {
      setIsTestEmailModalOpen(false);
      setTestEmailAddress('');
      addToast({
        title: 'Test Email Sent',
        description: 'Check your inbox for the preview layout.',
        variant: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to send test email';
      addToast({ title: 'Error', description: msg, variant: 'danger' });
    },
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Sent
          </span>
        );
      case 'SENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            Sending
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Scheduled
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
            <Ban className="w-3.5 h-3.5 text-stone-400" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <Tag className="w-3.5 h-3.5 text-orange-500" />
            Draft
          </span>
        );
    }
  };

  const handleOpenDetail = (campaign) => {
    setSelectedCampaign(campaign);
    setIsDetailDrawerOpen(true);
  };

  const handleOpenTestModal = (campaign) => {
    setSelectedCampaign(campaign);
    setIsTestEmailModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingCampaignId(null);
    setFormData({
      name: '',
      subject: '',
      heading: '',
      body_text: '',
      banner_url: '',
      cta_text: 'Book Your Bridal Consultation',
      cta_url: '',
      recipient_segment: 'ALL_CONTACTS',
      target_package_id: '',
      scheduled_at: '',
    });
    setActiveTab('create');
  };

  const handleEditCampaign = (campaign) => {
    setEditingCampaignId(campaign.id);
    setFormData({
      name: campaign.name || '',
      subject: campaign.subject || '',
      heading: campaign.heading || '',
      body_text: campaign.body_text || campaign.body_html || campaign.offer_description || '',
      banner_url: campaign.banner_url || campaign.banner_image_url || '',
      cta_text: campaign.cta_text || '',
      cta_url: campaign.cta_url || '',
      recipient_segment: campaign.recipient_segment || campaign.segment || 'ALL_CONTACTS',
      target_package_id: campaign.segment_filter?.target_package_id || '',
      scheduled_at: campaign.scheduled_at ? new Date(campaign.scheduled_at).toISOString().slice(0, 16) : '',
    });
    setActiveTab('create');
  };

  const handleSaveCampaign = () => {
    if (editingCampaignId) {
      updateCampaignMutation.mutate({ id: editingCampaignId, data: formData });
    } else {
      createCampaignMutation.mutate(formData);
    }
  };

  // WhatsApp templates catalog query (All 9 official templates)
  const { data: waTemplatesData, isLoading: isWaTemplatesLoading } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: () => campaignApi.getWhatsAppTemplates(),
    enabled: activeTab === 'whatsapp',
  });

  // WhatsApp Campaign preview query
  const { data: waPreviewData } = useQuery({
    queryKey: [
      'wa-campaign-preview',
      waCampaignForm.package_name,
      waCampaignForm.offer_description,
      waCampaignForm.offer_end_date,
    ],
    queryFn: () =>
      campaignApi.previewWhatsApp({
        package_name: waCampaignForm.package_name || undefined,
        offer_description: waCampaignForm.offer_description || undefined,
        offer_end_date: waCampaignForm.offer_end_date || undefined,
      }),
    enabled: activeTab === 'whatsapp',
  });

  // WhatsApp Campaign audience count query
  const { data: waAudienceData, isLoading: isWaAudienceLoading } = useQuery({
    queryKey: ['wa-audience-count', waCampaignForm.recipient_segment, waCampaignForm.target_package_id, waCampaignForm.customer_ids],
    queryFn: () =>
      campaignApi.getAudienceCount({
        segment: waCampaignForm.recipient_segment,
        packageId: waCampaignForm.target_package_id || undefined,
        customerIds: waCampaignForm.customer_ids?.length ? waCampaignForm.customer_ids.join(',') : undefined,
      }),
    enabled: activeTab === 'whatsapp',
  });

  const waAudienceCount = waAudienceData?.data?.count || 0;

  // Live Cost Estimation Query for WhatsApp Broadcast
  const { data: waCostEstimateData } = useQuery({
    queryKey: ['wa-cost-estimate', waAudienceCount],
    queryFn: () =>
      whatsappBillingApi.estimateCampaign({
        recipient_count: waAudienceCount,
        message_category: 'MARKETING',
      }),
    enabled: activeTab === 'whatsapp' && waAudienceCount > 0,
  });

  const costEstimate = waCostEstimateData?.data || null;

  // Send WhatsApp Campaign Mutation
  const sendWhatsAppMutation = useMutation({
    mutationFn: (data) => campaignApi.sendWhatsApp(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setIsWaConfirmModalOpen(false);
      setWaCampaignForm({
        campaign_name: '',
        package_name: '',
        offer_description: '',
        offer_end_date: '',
        recipient_segment: 'ALL_CONTACTS',
        target_package_id: '',
        customer_ids: [],
      });
      setActiveTab('whatsapp');
      setWaSubTab('history');
      addToast({
        title: 'WhatsApp Campaign Dispatched',
        description: `Dispatched to ${res?.data?.total_recipients || 0} clients via official WhatsApp template.`,
        variant: 'success',
      });
    },
    onError: (err) => {
      addToast({
        title: 'Campaign Delivery Failed',
        description: err?.response?.data?.message || err?.message || 'Could not send WhatsApp campaign',
        variant: 'danger',
      });
    },
  });

  const handleSendTestWhatsApp = async () => {
    if (!testPhoneNumber.trim()) {
      addToast({
        title: 'Phone Number Required',
        description: 'Please enter a 10-digit mobile number with country code.',
        variant: 'danger',
      });
      return;
    }

    try {
      setIsSendingTestWa(true);
      await campaignApi.testWhatsAppTemplate({
        template_key: testingTemplate.key || testingTemplate.templateName,
        recipient_phone: testPhoneNumber,
      });
      addToast({
        title: 'Test Dispatched',
        description: `Template #${testingTemplate.number} was sent to ${testPhoneNumber} via Meta WhatsApp API.`,
        variant: 'success',
      });
      setTestingTemplate(null);
    } catch (err) {
      addToast({
        title: 'WhatsApp Test Failed',
        description: err?.response?.data?.message || err?.message || 'Failed to dispatch test template',
        variant: 'danger',
      });
    } finally {
      setIsSendingTestWa(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-16">
      {/* Header - Responsive & Modernized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900 flex items-center gap-2">
            {activeTab === 'whatsapp' ? (
              <MessageCircle className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-600 shrink-0" />
            ) : (
              <Mail className="w-5 h-5 sm:w-7 sm:h-7 text-orange-600 shrink-0" />
            )}
            <span className="truncate">
              {activeTab === 'whatsapp' ? 'WhatsApp Broadcast Campaigns' : 'Marketing Campaigns'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5 sm:mt-1 leading-relaxed">
            Engage brides and clients with promotional announcements, bridal packages, and festival offers across Email and WhatsApp.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
          {activeTab === 'list' ? (
            <>
              <Button
                variant="outline"
                onClick={() => setActiveTab('whatsapp')}
                className="border-emerald-500/80 text-emerald-700 hover:bg-emerald-50 font-semibold shadow-2xs transition-all flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Special Bridal Package (WhatsApp)</span>
              </Button>
              <Button
                onClick={handleCreateNew}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xs hover:shadow-md transition-all active:scale-95 py-2 text-xs sm:text-sm flex items-center justify-center"
              >
                <Plus className="w-4 h-4 mr-1.5 shrink-0" />
                <span>Create Email Campaign</span>
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setEditingCampaignId(null);
                setActiveTab('whatsapp');
      setWaSubTab('history');
              }}
              className="border-stone-300 text-stone-700 py-2 text-xs sm:text-sm font-semibold"
            >
              Back to Campaigns
            </Button>
          )}
        </div>
      </div>

      {/* Campaign Channels Sub-Tabs - Mobile Scrollable & Touch-Friendly */}
      <div className="flex border-b border-stone-200 overflow-x-auto no-scrollbar gap-1">
        <button
          onClick={() => {
            if (activeTab === 'whatsapp') setActiveTab('list');
          }}
          className={`py-2.5 px-3.5 sm:px-5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer ${
            activeTab === 'list' || activeTab === 'create'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Email Campaigns</span>
        </button>
        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`py-2.5 px-3.5 sm:px-5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer ${
            activeTab === 'whatsapp'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
          <span>WhatsApp Campaigns</span>
          <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
            9 Templates
          </span>
        </button>
      </div>

      {/* Main View: List or Create or WhatsApp */}
      {activeTab === 'whatsapp' ? (
        <div className="space-y-6">
          {/* WhatsApp Prepaid Messaging Wallet Strip */}
          <WhatsAppWalletCard />

          {/* WhatsApp Header & Connection Status Bar */}
          <div className="bg-white rounded-2xl border border-emerald-100/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-stone-900">Official WhatsApp Business API</h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {waTemplatesData?.data?.connectionStatus === 'CONNECTED' ? 'Connected' : 'Active • Cloud API'}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  9 Approved Templates • Auto-triggers configured for studio bookings, enquiries, and client follow-ups
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-stone-500 font-medium">Template Scope:</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700">
                8 Automated (Read-Only) + 1 Broadcast
              </span>
            </div>
          </div>

          {/* Sub Navigation Tabs for WhatsApp - Responsive on Mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2 border-b border-stone-200 pb-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setWaSubTab('automated')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer ${
                waSubTab === 'automated'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Automated (1–8)</span>
              <span
                className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  waSubTab === 'automated' ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-600'
                }`}
              >
                Read-Only
              </span>
            </button>

            <button
              onClick={() => setWaSubTab('manual')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer ${
                waSubTab === 'manual'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Broadcast (Template 9)</span>
              <span
                className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  waSubTab === 'manual' ? 'bg-emerald-700 text-white' : 'bg-orange-100 text-orange-800'
                }`}
              >
                Editable
              </span>
            </button>

            <button
              onClick={() => setWaSubTab('history')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer ${
                waSubTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Broadcast History</span>
              <span
                className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  waSubTab === 'history' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {whatsAppBroadcastHistory.length}
              </span>
            </button>
          </div>

          {/* SUB-TAB 1: AUTOMATED TEMPLATES (1 - 8, READ-ONLY) */}
          {waSubTab === 'automated' ? (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">System Protected Automated Templates:</span>
                  <p className="mt-0.5 text-stone-600 leading-relaxed">
                    Templates 1–8 are strictly automated and trigger on system events (enquiry submissions, booking confirmations, consultation reminders, and balance alerts). Content and variable structures are Meta WhatsApp approved and cannot be altered by studio users to maintain delivery compliance.
                  </p>
                </div>
              </div>

              {isWaTemplatesLoading ? (
                <div className="py-12 flex justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(waTemplatesData?.data?.templates || [])
                    .filter((t) => t.isAutomated)
                    .map((tpl) => (
                      <div
                        key={tpl.id}
                        className="bg-white rounded-2xl border border-stone-200/80 hover:border-emerald-300 transition-all p-5 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          {/* Card Top Badges */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200 flex items-center gap-1">
                              Template #{tpl.number}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" /> Meta Approved
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> Read-Only
                              </span>
                            </div>
                          </div>

                          {/* Template Title & WhatsApp Icon */}
                          <div className="flex items-start gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                              <MessageCircle className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-stone-900 leading-snug">{tpl.name}</h4>
                              <p className="text-[11px] text-stone-500 font-mono mt-0.5">{tpl.templateName} • {tpl.category}</p>
                            </div>
                          </div>

                          {/* Trigger Event & Purpose */}
                          <div className="mt-3 p-3 bg-stone-50/70 rounded-xl border border-stone-100 space-y-1.5 text-xs">
                            <div>
                              <span className="font-bold text-stone-700">Trigger Event: </span>
                              <span className="text-stone-600">{tpl.trigger}</span>
                            </div>
                            <div>
                              <span className="font-bold text-stone-700">Purpose: </span>
                              <span className="text-stone-600">{tpl.purpose}</span>
                            </div>
                          </div>

                          {/* Message Template Read-Only Preview */}
                          <div className="mt-3">
                            <div className="text-[11px] font-bold text-stone-600 mb-1.5 flex items-center justify-between">
                              <span>Approved Message Content:</span>
                              <span className="text-[10px] font-normal text-stone-400">Non-editable</span>
                            </div>
                            <div className="bg-[#EBF7E9]/70 border border-emerald-200/60 rounded-xl p-3 text-xs text-stone-800 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                              {tpl.preview}
                            </div>
                          </div>
                        </div>

                        {/* Status Footer & Test Action */}
                        <div className="pt-3 mt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="text-stone-500 flex items-center gap-1 font-medium">
                            <Zap className="w-3 h-3 text-emerald-500 shrink-0" /> Auto-Triggers on Event
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setTestingTemplate(tpl);
                              setTestPhoneNumber(
                                currentBusiness?.whatsapp_phone ||
                                currentBusiness?.business_phone ||
                                user?.phone ||
                                waTemplatesData?.data?.phoneNumber ||
                                ''
                              );
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-lg font-bold transition-all cursor-pointer text-[11px] shadow-2xs"
                          >
                            <Send className="w-3 h-3 text-emerald-600" />
                            <span>Test on My Phone</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : waSubTab === 'manual' ? (
            /* SUB-TAB 2: MANUAL CAMPAIGN (TEMPLATE 9, EDITABLE INPUTS ONLY) */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* WhatsApp Campaign Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6 border border-emerald-200/80 shadow-sm bg-white">
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-stone-900">
                          Template 9: Special Bridal Packages Campaign
                        </h2>
                        <p className="text-xs text-stone-500">
                          Official WhatsApp Business Template 9 • User-Triggered Manual Broadcast
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Manual Send Only
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Internal Campaign Name *
                      </label>
                      <Input
                        placeholder="e.g. Diwali Mega Bridal WhatsApp Blast 2026"
                        value={waCampaignForm.campaign_name}
                        onChange={(e) => setWaCampaignForm({ ...waCampaignForm, campaign_name: e.target.value })}
                      />
                      <span className="text-[11px] text-stone-400">Internal studio reference in campaign reports</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Special Offer / Package Name *
                      </label>
                      <Input
                        placeholder="e.g. Royal South Indian Bridal Makeover & Muhurtham Package"
                        value={waCampaignForm.package_name}
                        onChange={(e) => setWaCampaignForm({ ...waCampaignForm, package_name: e.target.value })}
                      />
                      <span className="text-[11px] text-stone-400">Maps to {`{{package_name}}`} in WhatsApp template</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Offer Details & Inclusions *
                      </label>
                      <textarea
                        rows={4}
                        placeholder="e.g. Complimentary trial session, premium HD airbrush makeup, hair styling, saree draping, and jewelry setting for up to 2 wedding events."
                        value={waCampaignForm.offer_description}
                        onChange={(e) => setWaCampaignForm({ ...waCampaignForm, offer_description: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <span className="text-[11px] text-stone-400">Maps to {`{{offer_details}}`} in WhatsApp template</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        Offer Validity Date *
                      </label>
                      <ModernDatePicker
                        value={waCampaignForm.offer_end_date}
                        onChange={(val) => setWaCampaignForm({ ...waCampaignForm, offer_end_date: val })}
                        placeholder="Select offer expiry date (e.g. 30 Nov 2026)"
                        disablePastDates={true}
                      />
                      <span className="text-[11px] text-stone-400 mt-1 block">Maps to {`{{valid_until}}`} in WhatsApp template</span>
                    </div>

                    {/* WhatsApp Audience Segment */}
                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-stone-700 mb-2">
                        Target Recipient Audience Segment
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {SEGMENTS.map((seg) => (
                          <div
                            key={seg.value}
                            onClick={() => setWaCampaignForm({ ...waCampaignForm, recipient_segment: seg.value })}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                              waCampaignForm.recipient_segment === seg.value
                                ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                                : 'border-stone-200 hover:border-stone-300 bg-stone-50/40'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`text-xs font-bold ${
                                  waCampaignForm.recipient_segment === seg.value ? 'text-emerald-700' : 'text-stone-800'
                                }`}
                              >
                                {seg.label}
                              </span>
                              {waCampaignForm.recipient_segment === seg.value && (
                                <Check className="w-4 h-4 text-emerald-600" />
                              )}
                            </div>
                            <p className="text-[11px] text-stone-500 leading-normal">{seg.description}</p>
                          </div>
                        ))}
                      </div>

                      {/* Package selector if SPECIFIC_SERVICE is chosen */}
                      {waCampaignForm.recipient_segment === 'SPECIFIC_SERVICE' && (
                        <div className="pt-3">
                          <ModernDropdown
                            label="Filter by Booked Package"
                            value={waCampaignForm.target_package_id}
                            onChange={(val) => setWaCampaignForm({ ...waCampaignForm, target_package_id: val })}
                            placeholder="-- Choose a Bridal Package --"
                            options={[
                              { value: '', label: '-- Choose a Bridal Package --' },
                              ...packages.map((pkg) => ({
                                value: pkg.id,
                                label: `${pkg.name} (₹${pkg.price_paise ? (pkg.price_paise / 100).toFixed(0) : '0'})`,
                              })),
                            ]}
                            className="w-full"
                          />
                        </div>
                      )}

                      {/* Customer Data Wise Picker for WhatsApp */}
                      {waCampaignForm.recipient_segment === 'CUSTOMER_DATA_WISE' && (
                        <div className="mt-3 p-3 sm:p-4.5 rounded-2xl bg-white border border-emerald-200/90 space-y-3.5 shadow-xs">
                          {/* Top Controls Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-stone-100">
                            <div>
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                                  <Users className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-1.5">
                                    Target Customers
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      {waCampaignForm.customer_ids?.length || 0} selected
                                    </span>
                                  </span>
                                  <p className="text-[11px] text-stone-500 leading-tight">Pick clients to receive this WhatsApp message</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  const validIds = allStudioCustomers.filter((c) => c.phone).map((c) => c.id);
                                  setWaCampaignForm({ ...waCampaignForm, customer_ids: validIds });
                                }}
                                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/70 px-2.5 py-1.5 rounded-xl border border-emerald-200/80 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Select All Phone</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setWaCampaignForm({ ...waCampaignForm, customer_ids: [] })}
                                className="text-[11px] font-semibold text-stone-600 hover:text-stone-800 bg-stone-100 hover:bg-stone-200/70 px-2.5 py-1.5 rounded-xl border border-stone-200 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Square className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                                <span>Clear All</span>
                              </button>
                            </div>
                          </div>

                          {/* Search bar inside customer selector */}
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                            <input
                              type="text"
                              placeholder="Search by client name, mobile number or email..."
                              value={waCustomerSearch}
                              onChange={(e) => setWaCustomerSearch(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50/80 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>

                          {/* Customer list table/scroll area */}
                          <div className="max-h-64 overflow-y-auto divide-y divide-stone-100 rounded-xl border border-stone-200/70 bg-stone-50/20">
                            {allStudioCustomers
                              .filter((c) => {
                                if (!waCustomerSearch.trim()) return true;
                                const q = waCustomerSearch.toLowerCase();
                                return (
                                  (c.full_name && c.full_name.toLowerCase().includes(q)) ||
                                  (c.phone && c.phone.includes(q)) ||
                                  (c.email && c.email.toLowerCase().includes(q))
                                );
                              })
                              .map((c) => {
                                const isSelected = waCampaignForm.customer_ids?.includes(c.id);
                                const hasPhone = Boolean(c.phone);
                                return (
                                  <div
                                    key={c.id}
                                    onClick={() => {
                                      if (!hasPhone) return;
                                      const current = waCampaignForm.customer_ids || [];
                                      const updated = isSelected
                                        ? current.filter((id) => id !== c.id)
                                        : [...current, c.id];
                                      setWaCampaignForm({ ...waCampaignForm, customer_ids: updated });
                                    }}
                                    className={`p-2.5 sm:p-3 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                                      isSelected
                                        ? 'bg-emerald-50/80 border-l-4 border-l-emerald-600'
                                        : !hasPhone
                                        ? 'opacity-40 cursor-not-allowed bg-stone-50/80'
                                        : 'hover:bg-stone-50/90'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="shrink-0">
                                        {isSelected ? (
                                          <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                                            <Check className="w-3.5 h-3.5" />
                                          </div>
                                        ) : (
                                          <div className="w-5 h-5 rounded-md border border-stone-300 bg-white" />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-semibold text-stone-900 flex items-center gap-1.5 flex-wrap">
                                          <span className="truncate">{c.full_name || 'Unnamed Client'}</span>
                                          {!hasPhone && (
                                            <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-medium">
                                              No Phone
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[11px] text-stone-500 flex items-center gap-3 mt-0.5 flex-wrap">
                                          {c.phone && (
                                            <span className="flex items-center gap-1 text-stone-600 font-mono text-[11px]">
                                              <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                                              <span>{c.phone}</span>
                                            </span>
                                          )}
                                          {c.email && (
                                            <span className="flex items-center gap-1 text-stone-500 truncate text-[11px]">
                                              <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                                              <span className="truncate">{c.email}</span>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                                        isSelected
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                          : 'bg-stone-100 text-stone-600 border border-stone-200'
                                      }`}
                                    >
                                      {isSelected ? (
                                        <>
                                          <Check className="w-3 h-3" />
                                          <span>Selected</span>
                                        </>
                                      ) : (
                                        <span>Add</span>
                                      )}
                                    </span>
                                  </div>
                                );
                              })}
                            {allStudioCustomers.length === 0 && (
                              <div className="p-6 text-center text-xs text-stone-500">
                                No customer records found.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cost Estimation Card */}
                    {costEstimate && (
                      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-emerald-700" />
                            Estimated Campaign Charges
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-800">
                            Marketing Template Rate (~₹{costEstimate.rate_per_msg_total} / msg)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                          <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                            <span className="text-[10px] text-stone-500 block">Recipients</span>
                            <span className="font-bold text-stone-800">{costEstimate.recipient_count}</span>
                          </div>
                          <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                            <span className="text-[10px] text-stone-500 block">Base Rate</span>
                            <span className="font-bold text-stone-800">₹{costEstimate.subtotal_rupees}</span>
                          </div>
                          <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                            <span className="text-[10px] text-stone-500 block">GST (18%)</span>
                            <span className="font-bold text-stone-800">₹{costEstimate.tax_rupees}</span>
                          </div>
                          <div className="bg-white/80 p-2 rounded-xl border border-emerald-200 bg-emerald-100/50">
                            <span className="text-[10px] text-emerald-900 font-semibold block">Total Estimated</span>
                            <span className="font-extrabold text-emerald-700">₹{costEstimate.total_estimated_rupees}</span>
                          </div>
                        </div>

                        {/* Balance check warning */}
                        {!costEstimate.has_sufficient_credits && (
                          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Insufficient Messaging Credits:</span>
                              <p className="mt-0.5">
                                Your available balance is ₹{costEstimate.studio_available_balance_rupees.toFixed(2)}. Shortfall: <strong>₹{costEstimate.shortfall_rupees.toFixed(2)}</strong>. Please top up your credits to dispatch.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Safety Guarantee Notice */}
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Strict Anti-Spam & User Confirmation Rule:</span>
                        <p className="mt-0.5 text-stone-600">
                          This campaign will <strong>never</strong> trigger automatically. It will only dispatch to verified client mobile numbers after you confirm on the modal below.
                        </p>
                      </div>
                    </div>

                    {/* Dispatch Button */}
                    <div className="pt-3 flex items-center justify-end gap-3">
                      <Button
                        onClick={() => {
                          if (!waCampaignForm.campaign_name.trim()) {
                            setWaCampaignForm((prev) => ({
                              ...prev,
                              campaign_name: `${prev.package_name || 'Special Bridal Package'} WhatsApp Offer`,
                            }));
                          }
                          setIsWaConfirmModalOpen(true);
                        }}
                        disabled={
                          !waCampaignForm.package_name.trim() ||
                          !waCampaignForm.offer_description.trim() ||
                          !waCampaignForm.offer_end_date
                        }
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                      >
                        <MessageCircle className="w-4 h-4 mr-1.5" />
                        Review & Send WhatsApp Campaign ({waAudienceData?.data?.count || 0})
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* WhatsApp Live Phone Mockup Preview */}
              <div className="space-y-4">
                <div className="bg-stone-900 rounded-3xl p-4 shadow-2xl border-4 border-stone-800 max-w-sm mx-auto">
                  {/* Phone Header */}
                  <div className="flex items-center gap-2.5 pb-3 border-b border-stone-800 text-white mb-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs">
                      V
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-100">VARNAM Bridal Studio</div>
                      <div className="text-[10px] text-emerald-400">Official WhatsApp Business</div>
                    </div>
                  </div>

                  {/* Chat Bubble */}
                  <div className="bg-[#DCF8C6] text-stone-900 rounded-2xl p-3.5 shadow-sm text-xs space-y-2 whitespace-pre-wrap leading-relaxed font-sans border border-emerald-200/60">
                    <div className="font-extrabold text-[#075E54] text-[11px] uppercase tracking-wide">
                      Special Bridal Packages
                    </div>
                    <div>
                      {waPreviewData?.data?.formatted_text || (
                        <span className="text-stone-400 italic">Enter offer details to preview live WhatsApp template...</span>
                      )}
                    </div>
                    <div className="text-[9px] text-stone-500 text-right pt-1">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                    </div>
                  </div>

                  <div className="mt-3 text-center text-[10px] text-stone-500">
                    Live Meta WhatsApp Cloud API Template Preview
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* SUB-TAB 3: WHATSAPP BROADCAST HISTORY */
            <div className="space-y-4">
              {whatsAppBroadcastHistory.length === 0 ? (
                <EmptyState
                  icon={MessageCircle}
                  title="No WhatsApp broadcasts sent yet"
                  description="Use Template 9 (Broadcast) to dispatch approved promotional WhatsApp campaigns to your clients."
                  action={
                    <Button
                      onClick={() => setWaSubTab('manual')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                    >
                      <MessageCircle className="w-4 h-4 mr-1.5" />
                      Create WhatsApp Broadcast
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {whatsAppBroadcastHistory.map((camp) => (
                    <Card
                      key={camp.id}
                      className="p-5 border border-emerald-200/90 shadow-sm bg-white hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                            <h3 className="font-bold text-stone-900 text-base line-clamp-1">{camp.name}</h3>
                          </div>
                          {getStatusBadge(camp.status)}
                        </div>

                        {camp.offer_description && (
                          <p className="text-xs text-stone-600 font-medium line-clamp-2 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                            Offer: {camp.offer_description}
                          </p>
                        )}

                        <div className="pt-2 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[11px] text-stone-400 block">Audience</span>
                            <span className="font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                              <Users className="w-3.5 h-3.5 text-stone-500" />
                              {camp.total_recipients ?? 0} Clients
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] text-stone-400 block">Delivered</span>
                            <span className="font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {camp.sent_recipients ?? 0}
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-stone-400 flex items-center justify-between">
                          <span>Dispatched {formatDate(camp.sent_at || camp.created_at)}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                            WhatsApp
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-2 mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetail(camp)}
                          className="text-xs text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </Button>
                        <button
                          onClick={() => setCampaignToDelete(camp)}
                          className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete Broadcast Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 border border-stone-200/80 shadow-sm bg-white">
              <h2 className="text-base font-bold text-stone-900 mb-4 pb-3 border-b border-stone-100 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  {editingCampaignId ? 'Edit Campaign Draft' : 'Campaign Content & Settings'}
                </span>
                {editingCampaignId && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                    Editing Mode
                  </span>
                )}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Campaign Internal Name *
                  </label>
                  <Input
                    placeholder="e.g. Diwali Bridal Glamour Special 2026"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <span className="text-[11px] text-stone-400">Only visible to your studio team in dashboard</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Email Subject Line *
                  </label>
                  <Input
                    placeholder="e.g. ✨ Exclusive Bridal Package Slots Open for Upcoming Wedding Season!"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Header Greeting / Banner Heading
                  </label>
                  <Input
                    placeholder="e.g. Royal Bridal Artistry Curated for You"
                    value={formData.heading}
                    onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Campaign Body Description *
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Describe your special bridal discount, portfolio update, or festival availability..."
                    value={formData.body_text}
                    onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                {/* Drag and Drop Banner Image Upload UI */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-stone-700">
                      Campaign Banner Graphic (Drag & Drop or Upload)
                    </label>
                    {formData.banner_url && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, banner_url: '' }))}
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove Banner
                      </button>
                    )}
                  </div>

                  {/* Hidden Native File Input */}
                  <input
                    ref={bannerFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleBannerFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {/* Interactive Drag & Drop Box */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingBanner(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingBanner(false);
                    }}
                    onDrop={handleBannerDrop}
                    onClick={() => bannerFileInputRef.current?.click()}
                    className={`relative rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${
                      isDraggingBanner
                        ? 'border-[#F97316] bg-orange-50/80 scale-[1.01]'
                        : formData.banner_url
                        ? 'border-orange-300 bg-orange-50/30'
                        : 'border-[#F0E7DE] hover:border-[#F97316]/50 hover:bg-orange-50/30 bg-[#FFFDF9]/60'
                    }`}
                  >
                    {formData.banner_url ? (
                      <div className="space-y-3">
                        <div className="relative max-h-40 mx-auto rounded-xl overflow-hidden border border-orange-200 shadow-sm inline-block">
                          <img
                            src={formData.banner_url}
                            alt="Campaign Banner Preview"
                            className="max-h-36 w-auto object-contain mx-auto"
                          />
                        </div>
                        <p className="text-xs text-stone-600 font-medium">
                          <span className="text-[#F97316] font-semibold hover:underline">Click or drop a different file</span> to replace banner
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                            isDraggingBanner
                              ? 'bg-[#F97316] text-white'
                              : 'bg-orange-100/70 text-[#F97316]'
                          }`}
                        >
                          <Upload className="w-6 h-6 animate-pulse" />
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-bold text-stone-800">
                            {isDraggingBanner ? (
                              <span className="text-[#F97316]">Drop your campaign banner here</span>
                            ) : (
                              <>
                                <span className="text-[#F97316] hover:underline">Click to upload</span>{' '}
                                or drag and drop your banner graphic
                              </>
                            )}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            Supports PNG, JPG, JPEG, WebP, SVG, AVIF (Up to 5MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Optional Direct URL Fallback */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-stone-400 shrink-0">Or enter URL:</span>
                    <Input
                      placeholder="https://example.com/bridal-banner.jpg"
                      value={formData.banner_url.startsWith('data:') ? '' : formData.banner_url}
                      onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                      className="text-xs py-1.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Call to Action Button Text
                    </label>
                    <Input
                      placeholder="e.g. Book Your Trial"
                      value={formData.cta_text}
                      onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Call to Action URL
                    </label>
                    <Input
                      placeholder="https://app.varnam.vexatech.in/dharshinistudio"
                      value={formData.cta_url}
                      onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Audience Selection Card */}
            <Card className="p-6 border border-stone-200/80 shadow-sm bg-white">
              <h2 className="text-base font-bold text-stone-900 mb-4 pb-3 border-b border-stone-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" />
                Audience Segmentation
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SEGMENTS.map((seg) => (
                    <div
                      key={seg.value}
                      onClick={() => setFormData({ ...formData, recipient_segment: seg.value })}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        formData.recipient_segment === seg.value
                          ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${formData.recipient_segment === seg.value ? 'text-orange-700' : 'text-stone-800'}`}>
                          {seg.label}
                        </span>
                        {formData.recipient_segment === seg.value && (
                          <Check className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 leading-normal">{seg.description}</p>
                    </div>
                  ))}
                </div>

                {formData.recipient_segment === 'SPECIFIC_SERVICE' && (
                  <div className="pt-2">
                    <ModernDropdown
                      label="Select Bridal Package Filter"
                      value={formData.target_package_id}
                      onChange={(val) => setFormData({ ...formData, target_package_id: val })}
                      placeholder="-- Choose a Bridal Package --"
                      options={[
                        { value: '', label: '-- Choose a Bridal Package --' },
                        ...packages.map((pkg) => ({
                          value: pkg.id,
                          label: `${pkg.name} (₹${pkg.price_paise ? (pkg.price_paise / 100).toFixed(0) : '0'})`,
                        })),
                      ]}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Customer Data Wise Picker for Email Campaign */}
                {formData.recipient_segment === 'CUSTOMER_DATA_WISE' && (
                  <div className="pt-2 p-3 sm:p-4.5 rounded-2xl bg-white border border-orange-200/90 space-y-3.5 shadow-xs">
                    {/* Top Controls Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-stone-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-1.5">
                              Target Customers
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
                                {formData.customer_ids?.length || 0} selected
                              </span>
                            </span>
                            <p className="text-[11px] text-stone-500 leading-tight">Pick clients to receive this email campaign</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            const validIds = allStudioCustomers.filter((c) => c.email).map((c) => c.id);
                            setFormData({ ...formData, customer_ids: validIds });
                          }}
                          className="text-[11px] font-semibold text-orange-700 hover:text-orange-800 bg-orange-50 hover:bg-orange-100/70 px-2.5 py-1.5 rounded-xl border border-orange-200/80 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <CheckSquare className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                          <span>Select All Email</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, customer_ids: [] })}
                          className="text-[11px] font-semibold text-stone-600 hover:text-stone-800 bg-stone-100 hover:bg-stone-200/70 px-2.5 py-1.5 rounded-xl border border-stone-200 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Square className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                          <span>Clear All</span>
                        </button>
                      </div>
                    </div>

                    {/* Search bar inside customer selector */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                      <input
                        type="text"
                        placeholder="Search by client name, mobile number or email..."
                        value={emailCustomerSearch}
                        onChange={(e) => setEmailCustomerSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50/80 border border-stone-200 rounded-xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      />
                    </div>

                    {/* Customer list table/scroll area */}
                    <div className="max-h-64 overflow-y-auto divide-y divide-stone-100 rounded-xl border border-stone-200/70 bg-stone-50/20">
                      {allStudioCustomers
                        .filter((c) => {
                          if (!emailCustomerSearch.trim()) return true;
                          const q = emailCustomerSearch.toLowerCase();
                          return (
                            (c.full_name && c.full_name.toLowerCase().includes(q)) ||
                            (c.phone && c.phone.includes(q)) ||
                            (c.email && c.email.toLowerCase().includes(q))
                          );
                        })
                        .map((c) => {
                          const isSelected = formData.customer_ids?.includes(c.id);
                          const hasEmail = Boolean(c.email);
                          return (
                            <div
                              key={c.id}
                              onClick={() => {
                                if (!hasEmail) return;
                                const current = formData.customer_ids || [];
                                const updated = isSelected
                                  ? current.filter((id) => id !== c.id)
                                  : [...current, c.id];
                                setFormData({ ...formData, customer_ids: updated });
                              }}
                              className={`p-2.5 sm:p-3 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-orange-50/80 border-l-4 border-l-orange-600'
                                  : !hasEmail
                                  ? 'opacity-40 cursor-not-allowed bg-stone-50/80'
                                  : 'hover:bg-stone-50/90'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="shrink-0">
                                  {isSelected ? (
                                    <div className="w-5 h-5 rounded-md bg-orange-600 text-white flex items-center justify-center shadow-2xs">
                                      <Check className="w-3.5 h-3.5" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-md border border-stone-300 bg-white" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-stone-900 flex items-center gap-1.5 flex-wrap">
                                    <span className="truncate">{c.full_name || 'Unnamed Client'}</span>
                                    {!hasEmail && (
                                      <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded font-medium">
                                        No Email
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-stone-500 flex items-center gap-3 mt-0.5 flex-wrap">
                                    {c.phone && (
                                      <span className="flex items-center gap-1 text-stone-600 font-mono text-[11px]">
                                        <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                                        <span>{c.phone}</span>
                                      </span>
                                    )}
                                    {c.email && (
                                      <span className="flex items-center gap-1 text-stone-500 truncate text-[11px]">
                                        <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                                        <span className="truncate">{c.email}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                                  isSelected
                                    ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                    : 'bg-stone-100 text-stone-600 border border-stone-200'
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Selected</span>
                                  </>
                                ) : (
                                  <span>Add</span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      {allStudioCustomers.length === 0 && (
                        <div className="p-6 text-center text-xs text-stone-500">
                          No customer records found.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingCampaignId(null);
                  setActiveTab('whatsapp');
      setWaSubTab('history');
                }}
                className="border-stone-300 text-stone-700"
              >
                Cancel
              </Button>
              <Button
                isLoading={createCampaignMutation.isPending || updateCampaignMutation.isPending}
                onClick={handleSaveCampaign}
                disabled={!formData.name.trim() || !formData.subject.trim() || !formData.body_text.trim()}
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm transition-all"
              >
                {editingCampaignId ? 'Update Campaign Draft' : 'Save Campaign Draft'}
              </Button>
            </div>
          </div>

          {/* Live Preview Sidebar */}
          <div className="space-y-6">
            {/* Audience Stats Card */}
            <Card className="p-5 border border-orange-200/80 shadow-sm bg-orange-50/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-orange-800 uppercase tracking-wider">
                  Target Audience
                </span>
                <Users className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-3xl font-extrabold text-stone-900">
                {isAudienceLoading ? '...' : audienceCount}
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Verified contacts with email, excluding unsubscribed brides.
              </p>
            </Card>

            {/* Email Mobile Mockup Preview */}
            <Card className="p-4 border border-stone-200 shadow-sm bg-stone-900 text-white rounded-2xl">
              <div className="text-xs font-semibold text-stone-400 mb-3 flex items-center justify-between">
                <span>Email Client Preview</span>
                <span className="text-[10px] text-orange-400 font-mono">HTML Layout</span>
              </div>

              <div className="bg-white rounded-xl overflow-hidden text-stone-900 text-xs shadow-inner">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 p-4 text-center text-white">
                  <div className="font-extrabold uppercase tracking-widest text-xs">YOUR BRIDAL STUDIO</div>
                  <div className="text-[10px] text-orange-100 mt-0.5">Bridal & Makeup Artistry Suite</div>
                </div>

                {/* Body Content */}
                <div className="p-4 space-y-3">
                  <div className="font-bold text-stone-900 text-sm">
                    {formData.heading || formData.name || 'Special Offer Heading'}
                  </div>

                  {formData.banner_url && (
                    <div className="rounded-lg overflow-hidden border border-stone-200">
                      <img src={formData.banner_url} alt="Banner" className="w-full h-24 object-cover" />
                    </div>
                  )}

                  <p className="text-stone-600 leading-relaxed text-[11px] whitespace-pre-wrap">
                    {formData.body_text || 'Your campaign message will appear here with professional radiant styling.'}
                  </p>

                  {formData.cta_text && (
                    <div className="pt-2 text-center">
                      <span className="inline-block bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-[11px] shadow-sm">
                        {formData.cta_text} &rarr;
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Preview */}
                <div className="p-3 bg-stone-50 border-t border-stone-100 text-center text-[9px] text-stone-400 space-y-1">
                  <div>© 2026 Your Studio. Powered by VEXA TECH.</div>
                  <div className="text-orange-600 underline">Unsubscribe from marketing emails</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* Campaigns List View */
        <div className="space-y-4">
          {isCampaignsLoading ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : campaigns.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No marketing campaigns created yet"
              description="Create your first targeted email campaign to reach past brides, newly enquired clients, and special occasion bookings."
              action={
                <Button
                  onClick={() => setActiveTab('create')}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create First Campaign
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((camp) => (
                <Card
                  key={camp.id}
                  className="p-5 border border-stone-200/80 shadow-sm bg-white hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-stone-900 text-base line-clamp-1">{camp.name}</h3>
                      {getStatusBadge(camp.status)}
                    </div>

                    <p className="text-xs text-stone-600 font-medium line-clamp-2">
                      Subject: &quot;{camp.subject}&quot;
                    </p>

                    <div className="pt-2 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[11px] text-stone-400 block">Audience</span>
                        <span className="font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                          <Users className="w-3.5 h-3.5 text-stone-500" />
                          {camp.total_recipients ?? 0} Contacts
                        </span>
                      </div>

                      <div>
                        <span className="text-[11px] text-stone-400 block">Delivered</span>
                        <span className="font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {camp.sent_recipients ?? 0}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-stone-400">
                      Created {formatDate(camp.created_at)}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenTestModal(camp)}
                      className="text-xs border-stone-200 text-stone-700 hover:bg-stone-50"
                    >
                      Test Send
                    </Button>

                    <div className="flex items-center gap-1.5">
                      {camp.status === 'DRAFT' && (
                        <>
                          <Button
                            size="sm"
                            isLoading={launchMutation.isPending}
                            onClick={() => launchMutation.mutate(camp.id)}
                            className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Send Now
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCampaign(camp)}
                            className="text-xs border-stone-200 text-stone-700 hover:text-orange-600 hover:bg-orange-50 px-2"
                            title="Edit Campaign Draft"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDetail(camp)}
                        className="text-xs text-stone-500 hover:text-stone-800 px-2"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCampaignToDelete(camp)}
                        className="text-xs text-stone-400 hover:text-rose-600 hover:bg-rose-50 px-2"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for WhatsApp Send */}
      {isWaConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2 text-emerald-700">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                Confirm WhatsApp Campaign Broadcast
              </h3>
              <button
                onClick={() => setIsWaConfirmModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <strong>Explicit User Confirmation Required</strong>
              <p>
                You are about to broadcast <strong>Template 9: Special Bridal Packages</strong> to{' '}
                <strong>{waAudienceData?.data?.count || 0} clients</strong>. This will be dispatched via WhatsApp Business API.
              </p>
            </div>

            <div className="text-xs space-y-2 bg-stone-50 p-3 rounded-xl border border-stone-200/80">
              <div><strong>Campaign:</strong> {waCampaignForm.campaign_name}</div>
              <div><strong>Package:</strong> {waCampaignForm.package_name}</div>
              <div><strong>Offer:</strong> {waCampaignForm.offer_description}</div>
              <div><strong>Valid Until:</strong> {waCampaignForm.offer_end_date}</div>
            </div>

            {/* Billing Deduction Summary */}
            {costEstimate && (
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-emerald-950">
                  <span>Messaging Credits Deduction:</span>
                  <span>₹{costEstimate.total_estimated_rupees.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-emerald-800">
                  <span>Available Balance After Dispatch:</span>
                  <span className="font-semibold">
                    ₹{Math.max(0, costEstimate.studio_available_balance_rupees - costEstimate.total_estimated_rupees).toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 pt-1 border-t border-emerald-200/60">
                  * Charges are reserved atomically. Unused reservation for any permanently failed deliveries is refunded automatically.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsWaConfirmModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={() => sendWhatsAppMutation.mutate(waCampaignForm)}
                disabled={sendWhatsAppMutation.isPending || (costEstimate && !costEstimate.has_sufficient_credits)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1.5"
              >
                {sendWhatsAppMutation.isPending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Confirm & Send Broadcast
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Test Automated WhatsApp Template Modal */}
      {testingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-[#F0E7DE]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-tight">
                    Test Template #{testingTemplate.number}: {testingTemplate.name}
                  </h3>
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                    Meta Template: {testingTemplate.templateName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTestingTemplate(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Recipient WhatsApp Phone Number *
              </label>
              <input
                type="text"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="e.g. 9840123456 or +919840123456"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Enter your WhatsApp mobile number to receive this official test message.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                Message Preview (Meta Approved Format):
              </label>
              <div className="bg-[#EBF7E9]/70 border border-emerald-200/60 rounded-xl p-3 text-xs text-stone-800 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                {testingTemplate.preview}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTestingTemplate(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSendTestWhatsApp}
                disabled={isSendingTestWa || !testPhoneNumber.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                {isSendingTestWa ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send Test to WhatsApp
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Test Email Modal */}
      {isTestEmailModalOpen && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <Send className="w-4 h-4 text-orange-600" />
                Send Test Email
              </h3>
              <button
                onClick={() => setIsTestEmailModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed">
              Dispatch a real preview of <strong>&quot;{selectedCampaign.name}&quot;</strong> to your email before sending to your clients.
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Recipient Email Address
              </label>
              <Input
                type="email"
                placeholder="artist@varnamstudio.in"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTestEmailModalOpen(false)}
                className="border-stone-300 text-stone-700"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                isLoading={sendTestMutation.isPending}
                disabled={!testEmailAddress.includes('@')}
                onClick={() =>
                  sendTestMutation.mutate({ id: selectedCampaign.id, email: testEmailAddress })
                }
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
              >
                Send Test Copy
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Details Drawer */}
      {isDetailDrawerOpen && selectedCampaign && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDetailDrawerOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">{selectedCampaign.name}</h3>
                  <p className="text-xs text-stone-500">Campaign Delivery Report</p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedCampaign.status)}
                <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                  {selectedCampaign.recipient_segment}
                </span>
              </div>

              {/* Delivery Stats Grid */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="text-xl font-extrabold text-stone-900">
                    {selectedCampaign.total_recipients ?? 0}
                  </div>
                  <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold mt-0.5">
                    Total
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-xl font-extrabold text-emerald-800">
                    {selectedCampaign.sent_recipients ?? 0}
                  </div>
                  <div className="text-[10px] text-emerald-600 uppercase tracking-wider font-semibold mt-0.5">
                    Sent
                  </div>
                </div>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <div className="text-xl font-extrabold text-rose-800">
                    {selectedCampaign.failed_recipients ?? 0}
                  </div>
                  <div className="text-[10px] text-rose-600 uppercase tracking-wider font-semibold mt-0.5">
                    Failed
                  </div>
                </div>
              </div>

              {/* Subject & Body */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                    Subject Line
                  </label>
                  <p className="text-sm font-semibold text-stone-900 bg-stone-50 p-3 rounded-xl border border-stone-200">
                    {selectedCampaign.subject}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                    Message Body
                  </label>
                  <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-800 leading-relaxed whitespace-pre-wrap">
                    {selectedCampaign.body_text}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedCampaign.status === 'DRAFT' && (
                  <>
                    <Button
                      size="sm"
                      isLoading={launchMutation.isPending}
                      onClick={() => launchMutation.mutate(selectedCampaign.id)}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Launch Now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsDetailDrawerOpen(false);
                        handleEditCampaign(selectedCampaign);
                      }}
                      className="border-stone-300 text-stone-700 hover:bg-orange-50 hover:text-orange-600"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Edit Draft
                    </Button>
                  </>
                )}
                {selectedCampaign.status === 'SCHEDULED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate(selectedCampaign.id)}
                    className="border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    Cancel Scheduled Send
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCampaignToDelete(selectedCampaign)}
                  className="border-rose-200 text-rose-600 hover:bg-rose-50"
                  title="Delete Campaign"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailDrawerOpen(false)}
                className="border-stone-300 text-stone-700 ml-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">Delete Campaign?</h3>
                <p className="text-xs text-stone-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to permanently delete <strong>&quot;{campaignToDelete.name}&quot;</strong>?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCampaignToDelete(null)}
                className="border-stone-300 text-stone-700"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                isLoading={deleteCampaignMutation.isPending}
                onClick={() => deleteCampaignMutation.mutate(campaignToDelete.id)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
