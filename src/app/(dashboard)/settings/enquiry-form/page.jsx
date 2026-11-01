'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Share2,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  Eye,
  Save,
  MessageSquare,
  Globe,
  Settings,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Edit,
  X,
  ChevronDown,
} from 'lucide-react';
import { Card, PageHeader, Button, LoadingSpinner, Badge, ModernDropdown } from '@/components/ui';
import { useModalAlert } from '@/components/ui/ModalAlert';
import { enquiryApi } from '@/services/api/modules';
import { useAuthStore } from '@/store/authStore';
import { getPublicStudioUrl } from '@/utils/urlConfig';

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'email', label: 'Email Address' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select Dropdown' },
  { value: 'multiselect', label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'image_upload', label: 'Photo / Attachment Upload' },
];

export default function EnquiryFormBuilderPage() {
  const queryClient = useQueryClient();
  const { currentBusiness } = useAuthStore();
  const { showAlert } = useModalAlert();

  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [mobileTab, setMobileTab] = useState('editor'); // 'editor' | 'preview'

  // Form builder state
  const [formData, setFormData] = useState({
    title: 'Bridal Enquiry Form',
    welcome_message: 'Tell us about your special day. Share your details below to schedule your consultation with our bridal studio.',
    submit_button_label: 'Submit Enquiry',
    success_message: 'Thank you for reaching out! Your bridal enquiry has been received. Please review your enquiry details or visit our studio for consultation.',
    status: 'PUBLISHED',
    fields: [],
  });

  // Modal / Add Field state
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState('');

  // Editing existing field state
  const [editingIndex, setEditingIndex] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editType, setEditType] = useState('text');
  const [editOptions, setEditOptions] = useState('');

  // Fetch saved form configuration
  const { data: configRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['enquiry-form-config'],
    queryFn: () => enquiryApi.getFormConfig(),
  });

  useEffect(() => {
    if (configRes?.data?.form) {
      const f = configRes.data.form;
      setFormData({
        title: f.title || 'Bridal Enquiry Form',
        welcome_message: f.welcome_message || 'Tell us about your special day. Share your details below to schedule your consultation with our bridal studio.',
        submit_button_label: f.submit_button_label || 'Submit Enquiry',
        success_message: f.success_message || 'Thank you for reaching out! Your bridal enquiry has been received. Please review your enquiry details or visit our studio for consultation.',
        status: f.status || 'PUBLISHED',
        fields: Array.isArray(f.fields) && f.fields.length > 0 ? f.fields : [],
      });
    }
  }, [configRes]);

  const studioSlug = configRes?.data?.public_slug || currentBusiness?.slug || 'my-studio';
  const studioName = configRes?.data?.business?.name || currentBusiness?.name || 'Bridal Studio';
  const studioLogo = configRes?.data?.business?.logo_url || currentBusiness?.logo_url || '/varnam-logo.png';

  // Construct live production / environment-aware public URL
  const publicStudioBase = getPublicStudioUrl(studioSlug);
  const publicUrl = `${publicStudioBase}/enquiry-form`;

  // Copy Link Handler
  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        throw new Error('Clipboard API not available');
      }
    } catch {
      await showAlert({
        title: 'Form Link',
        message: publicUrl,
        variant: 'info',
        confirmText: 'Done',
      });
    }
  };

  // WhatsApp Share Handler
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi! Thank you for your interest in our bridal services at ${studioName}. Please fill out our enquiry form so we can understand your requirements:\n\n${publicUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Save Form Configuration Mutation
  const saveMutation = useMutation({
    mutationFn: (dataToSave) => enquiryApi.saveFormConfig(dataToSave),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiry-form-config'] });
      setSaveSuccess(true);
      setSaveError('');
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err) => {
      setSaveError(err.response?.data?.error?.message || err.message || 'Failed to save form');
    },
  });

  const handleSave = (e) => {
    if (e) e.preventDefault();
    setSaveError('');
    saveMutation.mutate(formData);
  };

  // Toggle publish / unpublish status
  const handleToggleStatus = async () => {
    const nextStatus = formData.status === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
    setFormData((prev) => ({ ...prev, status: nextStatus }));
    try {
      await enquiryApi.setFormStatus({ status: nextStatus });
      queryClient.invalidateQueries({ queryKey: ['enquiry-form-config'] });
    } catch (err) {
      await showAlert({
        title: 'Status Update Failed',
        message: err.response?.data?.error?.message || 'Failed to update publish status',
        variant: 'error',
      });
    }
  };

  // Add Custom Field
  const handleAddField = (e) => {
    e.preventDefault();
    if (!newFieldLabel.trim()) return;

    const newFieldId = `custom_${Date.now()}`;
    const optionsArray = ['select', 'multiselect'].includes(newFieldType)
      ? newFieldOptions.split(',').map((o) => o.trim()).filter(Boolean)
      : undefined;

    const newField = {
      id: newFieldId,
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
      isSystem: false,
      options: optionsArray,
    };

    setFormData((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));

    setNewFieldLabel('');
    setNewFieldType('text');
    setNewFieldRequired(false);
    setNewFieldOptions('');
  };

  // Remove Field
  const handleRemoveField = async (index) => {
    setFormData((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  // Move Field Up/Down
  const handleMoveField = (index, direction) => {
    const newFields = [...formData.fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;

    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;

    setFormData((prev) => ({
      ...prev,
      fields: newFields,
    }));
  };

  // Toggle Field Required Status
  const handleToggleRequired = async (index) => {
    const newFields = [...formData.fields];
    newFields[index] = {
      ...newFields[index],
      required: !newFields[index].required,
    };
    setFormData((prev) => ({ ...prev, fields: newFields }));
  };

  // Start Editing a Field
  const handleStartEdit = (index) => {
    const field = formData.fields[index];
    setEditingIndex(index);
    setEditLabel(field.label || '');
    setEditType(field.type || 'text');
    setEditOptions(Array.isArray(field.options) ? field.options.join(', ') : '');
  };

  // Cancel Editing
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditLabel('');
    setEditType('text');
    setEditOptions('');
  };

  // Save Field Edit
  const handleSaveFieldEdit = (index) => {
    if (!editLabel.trim()) return;

    const newFields = [...formData.fields];
    const field = newFields[index];
    const optionsArray = ['select', 'multiselect'].includes(editType)
      ? editOptions.split(',').map((o) => o.trim()).filter(Boolean)
      : undefined;

    newFields[index] = {
      ...field,
      label: editLabel.trim(),
      type: editType,
      options: optionsArray,
    };

    setFormData((prev) => ({ ...prev, fields: newFields }));
    handleCancelEdit();
  };

  if (isLoading) {
    return (
      <Card className="p-16 text-center">
        <LoadingSpinner text="Loading your studio enquiry form..." />
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Page Header */}
      <PageHeader
        title="Custom Enquiry Form"
        subtitle="Create a personalized form to collect bridal enquiries from your customers."
        action={
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                formData.status === 'PUBLISHED'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {formData.status === 'PUBLISHED' ? '● Published' : '○ Unpublished'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
              className="text-xs"
            >
              {formData.status === 'PUBLISHED' ? 'Unpublish Form' : 'Publish Form'}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-[#F97316] hover:bg-[#C2410C] text-white shadow-xs gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
            </Button>
          </div>
        }
      />

      {/* Save Success / Error Toast Banners */}
      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Form configuration updated successfully!</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium">Updated</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* 2. Public Shareable Link Card */}
      <Card className="p-4 sm:p-5 border-[#F0E7DE] bg-[#FFFDF9] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-[#F97316] uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Your Public Enquiry URL</span>
            </div>
            <div className="font-mono text-xs text-stone-800 break-all bg-white px-3 py-1.5 rounded-xl border border-[#F0E7DE] inline-block">
              {publicUrl}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              className="gap-1.5 text-xs border-[#F0E7DE] bg-white hover:bg-stone-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-600" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleShareWhatsApp}
              className="gap-1.5 text-xs bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share on WhatsApp</span>
            </Button>

            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="secondary" className="gap-1.5 text-xs">
                <ExternalLink className="w-3.5 h-3.5 text-stone-600" />
                <span>Open Form</span>
              </Button>
            </a>
          </div>
        </div>
      </Card>

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden bg-stone-100 p-1 rounded-xl">
        <button
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
            mobileTab === 'editor' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
          }`}
        >
          Form Editor
        </button>
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
            mobileTab === 'preview' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
          }`}
        >
          Live Preview
        </button>
      </div>

      {/* 3. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Configuration and Field Editor */}
        <div className={`lg:col-span-7 space-y-6 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
          {/* Section A: Branding & Content */}
          <Card className="p-5 space-y-4 shadow-xs border-[#F0E7DE]">
            <h3 className="font-bold text-[#292524] text-sm uppercase tracking-wider pb-2 border-b border-[#F0E7DE] flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#F97316]" />
              Form Branding & Text
            </h3>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Form Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Welcome Message / Description
              </label>
              <textarea
                rows={2}
                value={formData.welcome_message}
                onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Submit Button Label
                </label>
                <input
                  type="text"
                  value={formData.submit_button_label}
                  onChange={(e) => setFormData({ ...formData, submit_button_label: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Studio Name (from Profile)
                </label>
                <input
                  type="text"
                  disabled
                  value={studioName}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Success Confirmation Message
              </label>
              <textarea
                rows={2}
                value={formData.success_message}
                onChange={(e) => setFormData({ ...formData, success_message: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] resize-none"
              />
            </div>
          </Card>

          {/* Section B: Field Questions Editor */}
          <Card className="p-5 space-y-4 shadow-xs border-[#F0E7DE]">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0E7DE]">
              <h3 className="font-bold text-[#292524] text-sm uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#F97316]" />
                Form Questions & Fields ({formData.fields.length})
              </h3>
              <span className="text-[11px] text-stone-500">Reorder or toggle required</span>
            </div>

            {/* Fields List */}
            <div className="space-y-3">
              {formData.fields.map((field, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === formData.fields.length - 1;
                const isEditing = editingIndex === idx;

                if (isEditing) {
                  return (
                    <div
                      key={field.id}
                      className="p-4 bg-orange-50/50 rounded-2xl border-2 border-[#F97316]/40 shadow-xs space-y-3 animate-in fade-in duration-150"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-orange-200/60">
                        <span className="text-xs font-bold text-[#C2410C] flex items-center gap-1.5">
                          <Edit className="w-3.5 h-3.5" />
                          Edit Question #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                            Question / Label
                          </label>
                          <input
                            type="text"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-[#F0E7DE] focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                          />
                        </div>

                        <div>
                          <ModernDropdown
                            label="Field Type"
                            value={editType}
                            onChange={(val) => setEditType(val)}
                            options={FIELD_TYPES}
                          />
                        </div>
                      </div>

                      {['select', 'multiselect'].includes(editType) && (
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                            Dropdown Options (comma separated)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Traditional Bridal, HD Makeup, Airbrush Makeup"
                            value={editOptions}
                            onChange={(e) => setEditOptions(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-[#F0E7DE] focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSaveFieldEdit(idx)}
                          disabled={!editLabel.trim()}
                          className="bg-[#F97316] hover:bg-[#C2410C] text-white text-xs font-semibold shadow-2xs"
                        >
                          Apply Changes
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={field.id}
                    className="p-3.5 bg-white rounded-2xl border border-[#F0E7DE] flex items-center justify-between gap-3 hover:border-orange-200/80 hover:shadow-2xs transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-xl bg-orange-50 text-[#C2410C] text-[11px] font-bold flex items-center justify-center shrink-0 border border-orange-200/50">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5 truncate">
                          <span>{field.label}</span>
                          {field.required && (
                            <span className="text-[10px] text-red-500 font-bold">*</span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400 capitalize mt-0.5">
                          Type: <span className="font-medium text-stone-600">{field.type}</span>{' '}
                          {field.options?.length ? `(${field.options.length} options)` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(idx)}
                        className="p-1.5 text-stone-500 hover:text-[#F97316] hover:bg-orange-50 rounded-lg cursor-pointer transition-colors"
                        title="Edit question & options"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* Required Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleRequired(idx)}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                          field.required
                            ? 'bg-orange-50 text-[#C2410C] border-orange-200 font-bold'
                            : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100'
                        }`}
                        title="Toggle required status"
                      >
                        {field.required ? 'Required' : 'Optional'}
                      </button>

                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={() => handleMoveField(idx, 'up')}
                        disabled={isFirst}
                        className="p-1.5 text-stone-400 hover:text-stone-800 disabled:opacity-30 disabled:hover:text-stone-400 rounded-lg cursor-pointer transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={() => handleMoveField(idx, 'down')}
                        disabled={isLast}
                        className="p-1.5 text-stone-400 hover:text-stone-800 disabled:opacity-30 disabled:hover:text-stone-400 rounded-lg cursor-pointer transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => handleRemoveField(idx)}
                        className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        title="Remove question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Section C: Add New Custom Field Accordion / Form */}
            <div className="pt-3 border-t border-[#F0E7DE]">
              <div className="bg-[#FFFDF9] border border-[#F0E7DE] rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#F97316]" />
                  Add Custom Question / Field
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Field Question / Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Skin Type, How did you find us?"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20"
                    />
                  </div>

                  <div>
                    <ModernDropdown
                      label="Field Type"
                      value={newFieldType}
                      onChange={(val) => setNewFieldType(val)}
                      options={FIELD_TYPES}
                    />
                  </div>
                </div>

                {['select', 'multiselect'].includes(newFieldType) && (
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Options (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Option 1, Option 2, Option 3"
                      value={newFieldOptions}
                      onChange={(e) => setNewFieldOptions(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-700">
                    <input
                      type="checkbox"
                      checked={newFieldRequired}
                      onChange={(e) => setNewFieldRequired(e.target.checked)}
                      className="w-3.5 h-3.5 text-[#F97316] rounded border-stone-300 focus:ring-[#F97316]"
                    />
                    <span>Make this question required</span>
                  </label>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddField}
                    disabled={!newFieldLabel.trim()}
                    className="bg-[#292524] hover:bg-stone-800 text-white text-xs"
                  >
                    Add to Form
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Interactive Form Preview */}
        <div className={`lg:col-span-5 sticky top-24 ${mobileTab === 'editor' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white rounded-3xl border border-[#F0E7DE] shadow-xl overflow-hidden">
            {/* Preview Banner Header */}
            <div className="bg-[#292524] text-white px-4 py-2.5 flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-stone-200">
                <Eye className="w-3.5 h-3.5 text-[#F97316]" />
                Customer Live Preview
              </span>
              <span className="text-[10px] text-stone-400 font-mono">
                {formData.status === 'PUBLISHED' ? 'Active Public' : 'Draft / Unpublished'}
              </span>
            </div>

            {/* Preview Form Content */}
            <div className="p-6 bg-[#FFFDF9] max-h-[75vh] overflow-y-auto custom-scrollbar space-y-5">
              {/* Studio Brand Header */}
              <div className="text-center pb-4 border-b border-[#F0E7DE]">
                <div className="w-14 h-14 rounded-2xl bg-white border border-[#F0E7DE] shadow-xs flex items-center justify-center mx-auto mb-2.5 overflow-hidden p-1">
                  <img
                    src={studioLogo}
                    alt={studioName}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/varnam-logo.png';
                    }}
                  />
                </div>
                <h2 className="text-base font-bold text-[#292524]">{studioName}</h2>
                <h3 className="text-sm font-semibold text-[#F97316] mt-0.5">{formData.title}</h3>
                {formData.welcome_message && (
                  <p className="text-xs text-[#78716C] mt-1.5 leading-relaxed max-w-sm mx-auto">
                    {formData.welcome_message}
                  </p>
                )}
              </div>

              {/* Form Input Mockups */}
              <div className="space-y-3.5">
                {formData.fields.map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#292524]">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1 font-bold">*</span>}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        rows={2}
                        disabled
                        placeholder={field.placeholder || `Tell us about your preferences...`}
                        className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white text-stone-700 placeholder:text-stone-400 resize-none shadow-2xs"
                      />
                    ) : field.type === 'select' ? (
                      <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white text-stone-700 text-xs font-semibold shadow-2xs cursor-pointer hover:border-orange-200">
                        <span className="truncate text-stone-700">
                          {field.options?.[0] || `Select ${field.label}...`}
                        </span>
                        <ChevronDown className="w-4 h-4 text-stone-400 shrink-0 ml-2" />
                      </div>
                    ) : field.type === 'date' ? (
                      <div className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white text-stone-700 text-xs font-semibold shadow-2xs cursor-pointer hover:border-orange-200">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#F97316] shrink-0" />
                          <span className="text-stone-700">Select event date...</span>
                        </div>
                      </div>
                    ) : field.type === 'multiselect' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                        {field.options?.map((opt, i) => (
                          <div
                            key={opt}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold shadow-2xs ${
                              i < 2
                                ? 'bg-orange-50 border-[#F97316]/50 text-[#C2410C]'
                                : 'bg-white border-[#F0E7DE] text-stone-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={i < 2}
                              readOnly
                              className="w-3.5 h-3.5 text-[#F97316] rounded border-stone-300 pointer-events-none"
                            />
                            <span className="truncate">{opt}</span>
                          </div>
                        ))}
                      </div>
                    ) : field.type === 'image_upload' ? (
                      <div className="border-2 border-dashed border-[#F0E7DE] hover:border-[#F97316]/50 rounded-2xl p-4 bg-orange-50/20 text-center flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-[#F97316] flex items-center justify-center">
                          <Plus className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#292524]">
                            Attach Reference Look or Outfit Photo
                          </p>
                          <p className="text-[11px] text-stone-400 mt-0.5">
                            PNG, JPG or WebP up to 5MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <input
                        type={field.type === 'phone' ? 'tel' : 'text'}
                        disabled
                        placeholder={field.placeholder || `Enter your ${field.label.toLowerCase()}...`}
                        className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white text-stone-700 placeholder:text-stone-400 shadow-2xs"
                      />
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  disabled
                  className="w-full py-3 bg-[#F97316] text-white font-bold text-xs rounded-xl shadow-xs mt-2 opacity-90 cursor-not-allowed"
                >
                  {formData.submit_button_label || 'Submit Enquiry'}
                </button>
              </div>

              {/* Powered by VARNAM note */}
              <div className="pt-4 border-t border-[#F0E7DE] text-center text-[10px] text-stone-400">
                Powered by <span className="font-semibold text-stone-600">VARNAM</span> • Bridal Studio Management
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
