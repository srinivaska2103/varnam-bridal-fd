'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Copy,
  Check,
  Share2,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  RefreshCw,
  Search,
  ExternalLink,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  Lock,
  Trash2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { businessApi } from '@/services/api/modules';
import { Card, Button } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

export default function UserManagementPage() {
  const { currentBusiness, user } = useAuthStore();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const businessId = currentBusiness?.id || currentBusiness?.business_id;
  const studioSlug = currentBusiness?.slug || currentBusiness?.businessSlug || 'srinivasbridalstudio';
  const studioName = currentBusiness?.name || currentBusiness?.businessName || 'VARNAM Bridal Studio';

  const isOwnerOrManager = currentBusiness?.role === 'OWNER' || currentBusiness?.role === 'MANAGER';

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState(null);

  // Form states for creating user
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Success summary modal state
  const [createdSummary, setCreatedSummary] = useState(null);

  // Reset password form state
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetError, setResetError] = useState('');

  // Copy URL state
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Query team members
  const {
    data: membersData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['studio-members', businessId],
    queryFn: () => businessApi.getMembers(businessId),
    enabled: !!businessId && isOwnerOrManager,
  });

  const members = membersData?.data || [];

  // Filtered members
  const filteredMembers = members.filter((m) => {
    const q = searchTerm.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.role?.toLowerCase().includes(q)
    );
  });

  // Mutation: Create Studio User
  const createMutation = useMutation({
    mutationFn: (data) => businessApi.createStudioUser(businessId, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['studio-members', businessId] });
      setIsAddModalOpen(false);
      setCreatedSummary({
        ...res.data,
        initialPassword: createForm.password, // Only display once here as entered by admin
      });
      setCreateForm({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
      setFormError('');
      addToast({
        title: 'User Account Created',
        description: 'New employee account has been created successfully.',
        variant: 'success',
      });
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || err.message || 'Failed to create user account.');
    },
  });

  // Mutation: Toggle Active Status
  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }) =>
      businessApi.toggleUserStatus(businessId, userId, isActive),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['studio-members', businessId] });
      addToast({
        title: vars.isActive ? 'Account Activated' : 'Account Deactivated',
        description: `User account has been ${vars.isActive ? 'activated' : 'deactivated'}.`,
        variant: 'success',
      });
    },
    onError: (err) => {
      addToast({
        title: 'Action Failed',
        description: err.response?.data?.message || err.message || 'Could not update user status.',
        variant: 'destructive',
      });
    },
  });

  // Mutation: Reset User Password
  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, newPassword }) =>
      businessApi.resetUserPassword(businessId, userId, newPassword),
    onSuccess: () => {
      setIsResetModalOpen(false);
      setSelectedUserForReset(null);
      setResetPasswordVal('');
      setResetError('');
      addToast({
        title: 'Password Reset',
        description: 'User password has been updated successfully.',
        variant: 'success',
      });
    },
    onError: (err) => {
      setResetError(err.response?.data?.message || err.message || 'Failed to reset password.');
    },
  });

  // Mutation: Delete User
  const deleteUserMutation = useMutation({
    mutationFn: (userId) => businessApi.deleteStudioUser(businessId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-members', businessId] });
      setIsDeleteModalOpen(false);
      setSelectedUserForDelete(null);
      addToast({
        title: 'User Deleted',
        description: 'User account has been deleted successfully.',
        variant: 'success',
      });
    },
    onError: (err) => {
      addToast({
        title: 'Delete Failed',
        description: err.response?.data?.message || err.message || 'Failed to delete user account.',
        variant: 'destructive',
      });
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!createForm.name.trim()) {
      setFormError('Please enter the user full name.');
      return;
    }
    if (!createForm.email.trim()) {
      setFormError('Please enter a valid Gmail / Email address.');
      return;
    }
    if (createForm.password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    if (createForm.password !== createForm.confirmPassword) {
      setFormError('Passwords do not match. Please verify.');
      return;
    }

    createMutation.mutate({
      name: createForm.name.trim(),
      email: createForm.email.trim(),
      phone: createForm.phone.trim() || undefined,
      password: createForm.password,
    });
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    setResetError('');
    if (resetPasswordVal.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }

    resetPasswordMutation.mutate({
      userId: selectedUserForReset.user_id,
      newPassword: resetPasswordVal,
    });
  };

  const userLoginUrl = `https://app.varnam.vexatech.in/${studioSlug}/user/login`;
  const localUserLoginUrl = `/${studioSlug}/user/login`;

  const copyToClipboard = (text, type = 'url') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
      }
      addToast({
        title: 'Copied to Clipboard',
        description: 'Login details copied to clipboard.',
        variant: 'success',
      });
    }
  };

  if (!isOwnerOrManager) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-stone-200">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-stone-900">Access Restricted</h2>
        <p className="text-xs text-stone-500 mt-1">
          Only studio owners and administrators have permission to manage user accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-[#F0E7DE] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#FF6B00] flex items-center justify-center font-bold shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight">User Management</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-[#FF6B00] border border-orange-200">
                ADMIN ONLY
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Create and manage employee accounts with access restricted to operational modules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="rounded-xl border-stone-200 text-xs h-9 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setFormError('');
              setIsAddModalOpen(true);
            }}
            className="bg-[#FF6B00] hover:bg-[#E05E00] text-white rounded-xl text-xs h-9 font-bold shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add User
          </Button>
        </div>
      </div>

      {/* 2. Shareable User Login Portal Card */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-50/70 to-amber-50/40 rounded-3xl border border-orange-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#FF6B00] uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            <span>Dedicated Studio Employee Login URL</span>
          </div>
          <p className="text-xs text-stone-600 font-mono select-all break-all">
            {userLoginUrl}
          </p>
          <p className="text-[11px] text-stone-500">
            Share this link with your employees. They will sign in using their assigned Gmail/email and password.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(userLoginUrl, 'url')}
            className="border-orange-300 bg-white hover:bg-orange-50 text-stone-800 text-xs rounded-xl h-9 font-semibold cursor-pointer shadow-2xs"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
            {copiedUrl ? 'Copied URL' : 'Copy Login URL'}
          </Button>

          <a
            href={localUserLoginUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#FF6B00] bg-white hover:bg-orange-50 border border-orange-200 rounded-xl transition-all shadow-2xs"
          >
            <span>Preview Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 3. Search and User Accounts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
            />
          </div>
          <span className="text-xs font-semibold text-stone-400">
            {filteredMembers.length} {filteredMembers.length === 1 ? 'account' : 'accounts'}
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-stone-200">
            <RefreshCw className="w-8 h-8 text-[#FF6B00] animate-spin mx-auto mb-2" />
            <p className="text-xs text-stone-500 font-medium">Loading user accounts...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-stone-200">
            <Users className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-stone-700">No user accounts found</p>
            <p className="text-xs text-stone-500 mt-0.5">Click &ldquo;Add User&rdquo; to create your first employee account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => {
              const isOwner = member.role === 'OWNER' || member.role === 'MANAGER';
              const isCurrentUser = member.user_id === user?.id;

              return (
                <div
                  key={member.id}
                  className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs hover:border-[#FF6B00]/50 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#FF6B00] font-bold flex items-center justify-center text-sm border border-orange-200/80 shrink-0">
                          {member.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-stone-900 text-sm truncate">{member.name}</h3>
                          <p className="text-[11px] text-stone-500 truncate">{member.email}</p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                          isOwner
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-orange-50 text-[#FF6B00] border border-orange-200'
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-stone-100 text-[11px]">
                      <div className="flex items-center justify-between text-stone-500">
                        <span>Account Status:</span>
                        <span
                          className={`font-bold flex items-center gap-1 ${
                            member.is_active ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {member.is_active ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5" /> Active
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5" /> Deactivated
                            </>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-stone-500">
                        <span>Last Login:</span>
                        <span className="font-medium text-stone-800">
                          {member.last_login_at
                            ? new Date(member.last_login_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Never'}
                        </span>
                      </div>

                      {member.phone && (
                        <div className="flex items-center justify-between text-stone-500">
                          <span>Phone:</span>
                          <span className="font-mono text-stone-800">{member.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions (Only for non-owners or when admin manages employees) */}
                  <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-1.5">
                    {!isOwner ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserForReset(member);
                            setResetPasswordVal('');
                            setResetError('');
                            setIsResetModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 sm:px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Reset Password</span>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                userId: member.user_id,
                                isActive: !member.is_active,
                              })
                            }
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1.5 rounded-xl transition-all cursor-pointer ${
                              member.is_active
                                ? 'text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {member.is_active ? (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserForDelete(member);
                              setIsDeleteModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1.5 rounded-xl transition-all cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <span className="text-[11px] text-stone-400 italic">
                        {isCurrentUser ? 'Your Admin Account' : 'Studio Administrator'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          4. CREATE USER MODAL
         ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900">Add New Studio User</h3>
                  <p className="text-[11px] text-stone-500">Employee role with access to operational modules</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Sharma"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Employee Gmail / Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ananya.varnam@gmail.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Initial Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 chars"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="w-full text-xs px-3 py-2.5 pr-8 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat password"
                    value={createForm.confirmPassword}
                    onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Security Note:
                </span>
                <p>
                  Passwords are encrypted using bcrypt hashing. You will be provided with a copyable summary card to securely share with the employee.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl text-xs h-9 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending}
                  className="bg-[#FF6B00] hover:bg-[#E05E00] text-white rounded-xl text-xs h-9 font-bold cursor-pointer"
                >
                  {createMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-1.5" />
                  )}
                  Create Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. USER CREATED SUCCESS & CREDENTIALS SHARE SCREEN
         ========================================================================= */}
      {createdSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#F0E7DE] space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-stone-900">User Account Created!</h3>
                <p className="text-xs text-stone-500">Share these sign-in details with your employee</p>
              </div>
            </div>

            <div className="p-4 bg-[#FFF8F0] rounded-2xl border border-orange-200/90 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">User Full Name</span>
                  <span className="font-bold text-stone-900">{createdSummary.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Role</span>
                  <span className="font-bold text-[#FF6B00]">USER (Employee)</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Login Email</span>
                  <span className="font-bold text-stone-900">{createdSummary.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Account Status</span>
                  <span className="font-bold text-emerald-700">ACTIVE</span>
                </div>
              </div>

              <div className="pt-2 border-t border-orange-200/60">
                <span className="text-[10px] text-stone-400 uppercase font-bold block mb-0.5">Initial Password</span>
                <span className="font-mono font-bold text-stone-800 bg-white px-2.5 py-1 rounded-lg border border-orange-200 text-xs inline-block">
                  {createdSummary.initialPassword}
                </span>
                <p className="text-[10px] text-stone-400 mt-1 italic">
                  Note: Password is encrypted in the database and cannot be retrieved again.
                </p>
              </div>

              <div className="pt-2 border-t border-orange-200/60">
                <span className="text-[10px] text-stone-400 uppercase font-bold block mb-0.5">User Login Portal URL</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdSummary.loginUrl}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-orange-200 bg-white font-mono text-stone-700 select-all"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(createdSummary.loginUrl, 'url')}
                    className="h-8 rounded-lg text-xs shrink-0 cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Actions: Copy full credentials message */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreatedSummary(null)}
                className="rounded-xl text-xs h-9 cursor-pointer"
              >
                Close
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  const shareText =
                    `Hello ${createdSummary.name}! ✨\n\n` +
                    `Here are your login credentials for *${studioName}* on the VARNAM Bridal Platform:\n\n` +
                    `🌐 *Login URL:* ${createdSummary.loginUrl}\n` +
                    `📧 *Email:* ${createdSummary.email}\n` +
                    `🔑 *Password:* ${createdSummary.initialPassword}\n\n` +
                    `Please log in to manage enquiries, bridal bookings, and client services.`;

                  copyToClipboard(shareText, 'summary');
                }}
                className="bg-[#FF6B00] hover:bg-[#E05E00] text-white rounded-xl text-xs h-9 font-bold cursor-pointer"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5" />
                    <span>Copied Credentials</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-1.5" />
                    <span>Copy &amp; Share Details</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. RESET PASSWORD MODAL
         ========================================================================= */}
      {isResetModalOpen && selectedUserForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#FF6B00]" />
                <h3 className="font-bold text-sm text-stone-900">Reset User Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Set a new password for <span className="font-bold text-stone-800">{selectedUserForReset.name}</span> ({selectedUserForReset.email}).
            </p>

            {resetError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsResetModalOpen(false)}
                  className="rounded-xl text-xs h-9 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={resetPasswordMutation.isPending}
                  className="bg-[#FF6B00] hover:bg-[#E05E00] text-white rounded-xl text-xs h-9 font-bold cursor-pointer"
                >
                  {resetPasswordMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4 mr-1.5" />
                  )}
                  Save New Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. DELETE USER CONFIRMATION MODAL
         ========================================================================= */}
      {isDeleteModalOpen && selectedUserForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2 text-rose-600">
                <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="font-bold text-sm text-stone-900">Delete User Account</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedUserForDelete(null);
                }}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-stone-900">{selectedUserForDelete.name}</span> (<span className="text-stone-500">{selectedUserForDelete.email}</span>)?
            </p>
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-800">
              This will revoke their access to your studio portal immediately.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedUserForDelete(null);
                }}
                className="rounded-xl text-xs h-9 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={deleteUserMutation.isPending}
                onClick={() => deleteUserMutation.mutate(selectedUserForDelete.user_id)}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs h-9 font-bold cursor-pointer"
              >
                {deleteUserMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-1.5" />
                )}
                Delete User
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

