'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  X,
  Calendar,
  CalendarDays,
  IndianRupee,
  TrendingUp,
  Tag,
  Building2,
  Trash2,
  Edit2,
  Eye,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  Upload,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  FileText,
  Clock,
  Layers,
} from 'lucide-react';
import {
  Card,
  PageHeader,
  Button,
  Input,
  LoadingSpinner,
  EmptyState,
  Badge,
  ModernDropdown,
  ModernDatePicker,
} from '@/components/ui';
import { useModalAlert } from '@/components/ui/ModalAlert';
import { expenseApi } from '@/services/api/modules';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatINR } from '@/utils/formatters';

// Recommended Bridal Studio Expense Categories
const BRIDAL_EXPENSE_CATEGORIES = [
  'Makeup Products',
  'Cosmetics & Skincare',
  'Brushes & Tools',
  'Hair Styling Products',
  'Saree Draping Supplies',
  'Travel & Transportation',
  'Studio Rent',
  'Utilities',
  'Staff Payments',
  'Training & Education',
  'Marketing & Advertising',
  'Equipment',
  'Other',
];

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'RECORDED', label: 'Recorded (Active)' },
  { value: 'VOIDED', label: 'Voided / Archived' },
];

const SORT_OPTIONS = [
  { value: 'expense_date_desc', label: 'Newest Expense Date' },
  { value: 'expense_date_asc', label: 'Oldest Expense Date' },
  { value: 'amount_desc', label: 'Highest Amount (₹)' },
  { value: 'amount_asc', label: 'Lowest Amount (₹)' },
  { value: 'created_desc', label: 'Recently Created' },
];

const CATEGORY_COLORS = {
  'Makeup Products': 'bg-amber-50 text-amber-800 border-amber-200/80',
  'Cosmetics & Skincare': 'bg-rose-50 text-rose-800 border-rose-200/80',
  'Brushes & Tools': 'bg-purple-50 text-purple-800 border-purple-200/80',
  'Hair Styling Products': 'bg-pink-50 text-pink-800 border-pink-200/80',
  'Saree Draping Supplies': 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  'Travel & Transportation': 'bg-blue-50 text-blue-800 border-blue-200/80',
  'Studio Rent': 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
  'Utilities': 'bg-cyan-50 text-cyan-800 border-cyan-200/80',
  'Staff Payments': 'bg-orange-50 text-orange-800 border-orange-200/80',
  'Training & Education': 'bg-teal-50 text-teal-800 border-teal-200/80',
  'Marketing & Advertising': 'bg-violet-50 text-violet-800 border-violet-200/80',
  'Equipment': 'bg-stone-100 text-stone-800 border-stone-200/80',
  'Other': 'bg-stone-50 text-stone-700 border-stone-200',
};

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useModalAlert();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id;

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortByOption, setSortByOption] = useState('expense_date_desc');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Modals & Drawers State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewingExpense, setViewingExpense] = useState(null);

  // Form input state
  const [formData, setFormData] = useState({
    description: '',
    category: 'Makeup Products',
    custom_category: '',
    amount_inr: '',
    expense_date: new Date().toISOString().split('T')[0],
    vendor_name: '',
    notes: '',
    receipt_url: '',
    status: 'RECORDED',
  });
  const [formErrors, setFormErrors] = useState({});
  const fileInputRef = useRef(null);

  // Parse sortBy & sortOrder
  const { sortBy, sortOrder } = useMemo(() => {
    switch (sortByOption) {
      case 'expense_date_asc':
        return { sortBy: 'expense_date', sortOrder: 'asc' };
      case 'amount_desc':
        return { sortBy: 'amount_paise', sortOrder: 'desc' };
      case 'amount_asc':
        return { sortBy: 'amount_paise', sortOrder: 'asc' };
      case 'created_desc':
        return { sortBy: 'created_at', sortOrder: 'desc' };
      case 'expense_date_desc':
      default:
        return { sortBy: 'expense_date', sortOrder: 'desc' };
    }
  }, [sortByOption]);

  // Query: Backend categories
  const { data: categoriesRes } = useQuery({
    queryKey: ['expense-categories', businessId],
    queryFn: () => expenseApi.getCategories(),
    enabled: !!businessId,
  });

  const availableCategories = useMemo(() => {
    const backendCats = categoriesRes?.data?.categories || [];
    const merged = Array.from(new Set([...BRIDAL_EXPENSE_CATEGORIES, ...backendCats]));
    return merged.sort();
  }, [categoriesRes]);

  const categoryFilterOptions = useMemo(() => {
    return [
      { value: 'ALL', label: 'All Categories' },
      ...availableCategories.map((c) => ({ value: c, label: c })),
    ];
  }, [availableCategories]);

  // Query: Summary Metrics
  const {
    data: summaryRes,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['expense-summary', businessId, startDate, endDate, selectedCategory],
    queryFn: () =>
      expenseApi.getSummary({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      }),
    enabled: !!businessId,
  });

  const summary = summaryRes?.data || {};

  // Query: Expenses List
  const {
    data: expensesRes,
    isLoading: isExpensesLoading,
    isFetching: isExpensesFetching,
    isError: isExpensesError,
    error: expensesError,
    refetch: refetchExpenses,
  } = useQuery({
    queryKey: [
      'expenses-list',
      businessId,
      page,
      limit,
      searchTerm,
      selectedCategory,
      selectedStatus,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      expenseApi.list({
        page,
        limit,
        search: searchTerm.trim() || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
      }),
    enabled: !!businessId,
  });

  const expenseList = expensesRes?.data?.expenses || [];
  const pagination = expensesRes?.data?.pagination || { total: 0, totalPages: 1 };

  // Check if any filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm.trim() !== '' ||
      selectedCategory !== 'ALL' ||
      selectedStatus !== 'ALL' ||
      startDate !== '' ||
      endDate !== '' ||
      sortByOption !== 'expense_date_desc'
    );
  }, [searchTerm, selectedCategory, selectedStatus, startDate, endDate, sortByOption]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setStartDate('');
    setEndDate('');
    setSortByOption('expense_date_desc');
    setPage(1);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingExpense(null);
    setFormData({
      description: '',
      category: 'Makeup Products',
      custom_category: '',
      amount_inr: '',
      expense_date: new Date().toISOString().split('T')[0],
      vendor_name: '',
      notes: '',
      receipt_url: '',
      status: 'RECORDED',
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (expense) => {
    setEditingExpense(expense);
    const isCustomCat = !availableCategories.includes(expense.category);
    setFormData({
      description: expense.description || '',
      category: isCustomCat ? 'Custom' : expense.category || 'Makeup Products',
      custom_category: isCustomCat ? expense.category : '',
      amount_inr: expense.amount_paise ? (expense.amount_paise / 100).toString() : '',
      expense_date: expense.expense_date || new Date().toISOString().split('T')[0],
      vendor_name: expense.vendor_name || '',
      notes: expense.notes || '',
      receipt_url: expense.receipt_url || '',
      status: expense.status || 'RECORDED',
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Receipt File Upload Handler
  const handleReceiptUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpe?g|webp|gif)$/i) && file.type !== 'application/pdf') {
      showAlert({
        title: 'Unsupported File',
        message: 'Please upload an image (PNG, JPG, WebP) or PDF receipt under 4MB.',
        variant: 'danger',
      });
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      showAlert({
        title: 'File Too Large',
        message: 'Receipt file size must be less than 4MB.',
        variant: 'danger',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result;
      if (dataUri) {
        setFormData((prev) => ({ ...prev, receipt_url: dataUri }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.description.trim()) {
      errors.description = 'Expense title or description is required';
    } else if (formData.description.trim().length < 3) {
      errors.description = 'Title must be at least 3 characters';
    }

    const resolvedCategory =
      formData.category === 'Custom' ? formData.custom_category.trim() : formData.category;
    if (!resolvedCategory) {
      errors.category = 'Please select or specify a category';
    }

    const numAmount = parseFloat(formData.amount_inr);
    if (!formData.amount_inr || isNaN(numAmount) || numAmount <= 0) {
      errors.amount_inr = 'Amount must be greater than ₹0';
    }

    if (!formData.expense_date) {
      errors.expense_date = 'Expense date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Mutation: Create Expense
  const createMutation = useMutation({
    mutationFn: (payload) => expenseApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses-list'] });
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      setIsFormModalOpen(false);
      showAlert({
        title: 'Expense Recorded',
        message: 'The studio expense has been saved successfully.',
        variant: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Recording Failed',
        message: err.message || 'Could not record expense. Please verify all fields and retry.',
        variant: 'danger',
      });
    },
  });

  // Mutation: Update Expense
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => expenseApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses-list'] });
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      setIsFormModalOpen(false);
      setEditingExpense(null);
      showAlert({
        title: 'Expense Updated',
        message: 'The expense record was updated successfully.',
        variant: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Update Failed',
        message: err.message || 'Could not update expense. Please try again.',
        variant: 'danger',
      });
    },
  });

  // Mutation: Delete Expense (Permanent)
  const deleteMutation = useMutation({
    mutationFn: (id) => expenseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses-list'] });
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      showAlert({
        title: 'Expense Deleted',
        message: 'The expense record has been permanently removed.',
        variant: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Delete Failed',
        message: err.message || 'Could not delete expense.',
        variant: 'danger',
      });
    },
  });

  // Mutation: Archive / Void Expense
  const archiveMutation = useMutation({
    mutationFn: (id) => expenseApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses-list'] });
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
      showAlert({
        title: 'Expense Voided',
        message: 'The expense has been marked as VOIDED.',
        variant: 'info',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Action Failed',
        message: err.message || 'Could not void expense.',
        variant: 'danger',
      });
    },
  });

  // Handle Form Submit
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const resolvedCategory =
      formData.category === 'Custom' ? formData.custom_category.trim() : formData.category;
    const amountPaise = Math.round(parseFloat(formData.amount_inr) * 100);

    const payload = {
      description: formData.description.trim(),
      category: resolvedCategory,
      amount_paise: amountPaise,
      expense_date: formData.expense_date,
      vendor_name: formData.vendor_name.trim() || null,
      notes: formData.notes.trim() || null,
      receipt_url: formData.receipt_url || null,
      status: formData.status,
    };

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteClick = async (expense) => {
    const confirmed = await showConfirm({
      title: 'Delete Expense Record?',
      message: `Are you sure you want to permanently delete "${expense.description}" for ${formatINR(
        expense.amount_paise
      )}? This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(expense.id);
    }
  };

  // Handle Void Confirmation
  const handleVoidClick = async (expense) => {
    const confirmed = await showConfirm({
      title: 'Void Expense Record?',
      message: `Mark "${expense.description}" as VOIDED? Voided expenses are kept for audit logs but excluded from totals.`,
      confirmText: 'Mark Voided',
      cancelText: 'Cancel',
      variant: 'warning',
    });

    if (confirmed) {
      archiveMutation.mutate(expense.id);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Studio Expenses"
        subtitle="Track studio costs, product purchases, travel, and staff expenses."
        action={
          <Button
            size="sm"
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto bg-[#F97316] hover:bg-[#EA580C] text-white shadow-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </Button>
        }
      />

      {/* 2. Expense Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Expenses */}
        <Card className="p-3.5 sm:p-5 border-stone-200/90 hover:border-amber-300 transition-all rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#F97316] shrink-0">
              <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-lg sm:text-2xl font-black text-stone-900 tracking-tight truncate">
              {isSummaryLoading ? '—' : formatINR(summary.total_expenses_paise || 0)}
            </div>
            <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5 leading-tight truncate">
              {summary.total_records || 0} active items
            </p>
          </div>
        </Card>

        {/* This Month */}
        <Card className="p-3.5 sm:p-5 border-stone-200/90 hover:border-amber-300 transition-all rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider">
              This Month
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-lg sm:text-2xl font-black text-stone-900 tracking-tight truncate">
              {isSummaryLoading ? '—' : formatINR(summary.this_month_expenses_paise || 0)}
            </div>
            <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5 leading-tight truncate">
              Current month
            </p>
          </div>
        </Card>

        {/* Voided / Audit Items */}
        <Card className="p-3.5 sm:p-5 border-stone-200/90 hover:border-amber-300 transition-all rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider">
              Voided
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 shrink-0">
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-lg sm:text-2xl font-black text-stone-900 tracking-tight">
              {isSummaryLoading ? '—' : summary.voided_records || 0}
            </div>
            <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5 leading-tight truncate">
              Archived records
            </p>
          </div>
        </Card>

        {/* Highest Expense Category */}
        <Card className="p-3.5 sm:p-5 border-stone-200/90 hover:border-amber-300 transition-all rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider">
              Top Category
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-sm sm:text-lg font-black text-stone-900 truncate">
              {isSummaryLoading
                ? '—'
                : summary.highest_category
                ? summary.highest_category.category
                : 'None'}
            </div>
            <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5 leading-tight truncate">
              {summary.highest_category
                ? `${formatINR(summary.highest_category.total_amount_paise)}`
                : 'No expenditure'}
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Filters and Search Bar */}
      <Card className="p-4 border-stone-200/90">
        <div className="space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by title, description, vendor, or notes..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-8 py-2 bg-stone-50/50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Dropdown Filter */}
            <div className="w-full sm:w-56">
              <ModernDropdown
                value={selectedCategory}
                onChange={(val) => {
                  setSelectedCategory(val);
                  setPage(1);
                }}
                options={categoryFilterOptions}
                placeholder="All Categories"
              />
            </div>

            {/* Status Dropdown Filter */}
            <div className="w-full sm:w-44">
              <ModernDropdown
                value={selectedStatus}
                onChange={(val) => {
                  setSelectedStatus(val);
                  setPage(1);
                }}
                options={STATUS_FILTER_OPTIONS}
                placeholder="All Statuses"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="w-full sm:w-52">
              <ModernDropdown
                value={sortByOption}
                onChange={(val) => {
                  setSortByOption(val);
                  setPage(1);
                }}
                options={SORT_OPTIONS}
                placeholder="Sort by"
              />
            </div>
          </div>

          {/* Date Range Filters & Clear Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-stone-100">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-xs font-semibold text-stone-500 flex items-center gap-1.5 mr-1">
                <CalendarDays className="w-3.5 h-3.5" />
                Expense Date:
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1 sm:w-36">
                  <ModernDatePicker
                    value={startDate}
                    onChange={(val) => {
                      setStartDate(val);
                      setPage(1);
                    }}
                    placeholder="From date"
                  />
                </div>
                <span className="text-xs text-stone-400 shrink-0">to</span>
                <div className="flex-1 sm:w-36">
                  <ModernDatePicker
                    value={endDate}
                    onChange={(val) => {
                      setEndDate(val);
                      setPage(1);
                    }}
                    placeholder="To date"
                  />
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-stone-600 hover:text-[#EA580C] text-xs h-8 px-2.5 self-end sm:self-auto gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 4. Expense Records List / Table */}
      {isExpensesLoading ? (
        <LoadingSpinner text="Fetching studio expenses..." />
      ) : isExpensesError ? (
        <Card className="p-8 text-center border-rose-200 bg-rose-50/30">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-stone-900">Failed to load expenses</h3>
          <p className="text-xs text-stone-600 max-w-md mx-auto mt-1">
            {expensesError?.message || 'An error occurred while connecting to the database.'}
          </p>
          <div className="mt-4">
            <Button size="sm" onClick={() => refetchExpenses()}>
              Try Again
            </Button>
          </div>
        </Card>
      ) : expenseList.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={Filter}
            title="No matching expenses found"
            description="Try adjusting your search terms, category, or date range filters."
            action={
              <Button size="sm" variant="outline" onClick={handleClearFilters}>
                Clear All Filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Receipt}
            title="No expenses logged"
            description="Keep track of cosmetic purchases, product restocking, travel, and studio costs."
            action={
              <Button
                size="sm"
                onClick={handleOpenCreateModal}
                className="bg-[#F97316] hover:bg-[#EA580C] text-white shadow-xs font-semibold px-4 py-2 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1" />
                Record Your First Expense
              </Button>
            }
          />
        )
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50/70 border-b border-stone-200/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Expense Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Vendor / Supplier</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {expenseList.map((exp) => (
                    <tr
                      key={exp.id}
                      className="hover:bg-amber-50/30 transition-colors group cursor-pointer"
                      onClick={() => setViewingExpense(exp)}
                    >
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-stone-600 font-medium">
                        {formatDate(exp.expense_date)}
                      </td>

                      {/* Description & Notes */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-stone-900 group-hover:text-[#EA580C] transition-colors truncate">
                          {exp.description}
                        </div>
                        {exp.notes && (
                          <div className="text-[11px] text-stone-400 truncate mt-0.5">
                            {exp.notes}
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            CATEGORY_COLORS[exp.category] || 'bg-stone-50 text-stone-700 border-stone-200'
                          }`}
                        >
                          {exp.category}
                        </span>
                      </td>

                      {/* Vendor */}
                      <td className="py-3 px-4 whitespace-nowrap text-stone-600">
                        {exp.vendor_name ? (
                          <span className="flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-stone-400" />
                            {exp.vendor_name}
                          </span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 whitespace-nowrap text-right font-bold text-stone-900 text-sm">
                        {formatINR(exp.amount_paise)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            exp.status === 'RECORDED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-stone-100 text-stone-600 border-stone-200 line-through'
                          }`}
                        >
                          {exp.status === 'RECORDED' ? 'Recorded' : 'Voided'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3 px-4 whitespace-nowrap text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingExpense(exp)}
                            title="View details"
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(exp)}
                            title="Edit expense"
                            className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {exp.status === 'RECORDED' && (
                            <button
                              type="button"
                              onClick={() => handleVoidClick(exp)}
                              title="Mark as Voided"
                              className="p-1.5 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteClick(exp)}
                            title="Delete permanently"
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Responsive Cards View */}
          <div className="md:hidden space-y-3">
            {expenseList.map((exp) => (
              <Card
                key={exp.id}
                className="p-4 border-stone-200/90 active:bg-amber-50/20 transition-all cursor-pointer"
                onClick={() => setViewingExpense(exp)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          CATEGORY_COLORS[exp.category] || 'bg-stone-50 text-stone-700 border-stone-200'
                        }`}
                      >
                        {exp.category}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                          exp.status === 'RECORDED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-stone-100 text-stone-500 border-stone-200 line-through'
                        }`}
                      >
                        {exp.status === 'RECORDED' ? 'Recorded' : 'Voided'}
                      </span>
                    </div>

                    <h4 className="font-bold text-stone-900 text-sm mt-1.5 line-clamp-1">
                      {exp.description}
                    </h4>

                    {exp.vendor_name && (
                      <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-stone-400" />
                        <span>{exp.vendor_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-stone-900 text-base">
                      {formatINR(exp.amount_paise)}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      {formatDate(exp.expense_date)}
                    </div>
                  </div>
                </div>

                <div
                  className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[11px] text-stone-400">
                    Recorded by {exp.recorded_by || 'Studio'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(exp)}
                      className="p-1 text-stone-500 hover:text-amber-600 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {exp.status === 'RECORDED' && (
                      <button
                        type="button"
                        onClick={() => handleVoidClick(exp)}
                        className="p-1 text-stone-500 hover:text-orange-600 rounded"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(exp)}
                      className="p-1 text-stone-500 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 px-1 text-xs text-stone-500">
              <div>
                Showing {(page - 1) * limit + 1} to{' '}
                {Math.min(page * limit, pagination.total)} of {pagination.total} expenses
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isExpensesFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-2.5 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Prev
                </Button>
                <span className="font-semibold px-2">
                  {page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages || isExpensesFetching}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="h-8 px-2.5 text-xs"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Record / Edit Expense Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl border border-stone-200/90 shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-100/80 border border-orange-200/70 flex items-center justify-center text-[#F97316]">
                  {editingExpense ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    {editingExpense ? 'Edit Expense Record' : 'Record Studio Expense'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {editingExpense
                      ? 'Update details for this expenditure record'
                      : 'Keep your financial ledger organized with accurate bookkeeping'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                disabled={isSaving}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Expense Title */}
              <Input
                label="Expense Title *"
                placeholder="e.g. MAC Foundation restocking, Studio Light Bulbs, Travel"
                value={formData.description}
                error={formErrors.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (formErrors.description) setFormErrors({ ...formErrors, description: null });
                }}
              />

              {/* Category & Amount Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Category *
                  </label>
                  <ModernDropdown
                    value={formData.category}
                    onChange={(val) => {
                      setFormData({ ...formData, category: val });
                      if (formErrors.category) setFormErrors({ ...formErrors, category: null });
                    }}
                    options={[
                      ...availableCategories.map((c) => ({ value: c, label: c })),
                      { value: 'Custom', label: '+ Other Custom Category' },
                    ]}
                    placeholder="Select category"
                  />
                  {formData.category === 'Custom' && (
                    <div className="mt-2">
                      <Input
                        placeholder="Type custom category name..."
                        value={formData.custom_category}
                        error={formErrors.category}
                        onChange={(e) =>
                          setFormData({ ...formData, custom_category: e.target.value })
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Amount in INR */}
                <div>
                  <Input
                    label="Amount (₹) *"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 2500"
                    value={formData.amount_inr}
                    error={formErrors.amount_inr}
                    onChange={(e) => {
                      setFormData({ ...formData, amount_inr: e.target.value });
                      if (formErrors.amount_inr) setFormErrors({ ...formErrors, amount_inr: null });
                    }}
                  />
                </div>
              </div>

              {/* Expense Date & Vendor Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Expense Date *
                  </label>
                  <ModernDatePicker
                    value={formData.expense_date}
                    onChange={(val) => {
                      setFormData({ ...formData, expense_date: val });
                      if (formErrors.expense_date)
                        setFormErrors({ ...formErrors, expense_date: null });
                    }}
                    placeholder="Select expense date"
                  />
                  {formErrors.expense_date && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.expense_date}</p>
                  )}
                </div>

                <div>
                  <Input
                    label="Vendor / Supplier (Optional)"
                    placeholder="e.g. Nykaa Professional, Amazon, Local Studio"
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                  />
                </div>
              </div>

              {/* Status (For Editing or Custom State) */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Record Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'RECORDED' })}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                      formData.status === 'RECORDED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    Recorded (Active Ledger)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'VOIDED' })}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                      formData.status === 'VOIDED'
                        ? 'bg-stone-100 text-stone-800 border-stone-300 ring-2 ring-stone-400/20'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    Voided / Cancelled
                  </button>
                </div>
              </div>

              {/* Receipt Attachment (Optional Upload) */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Receipt Attachment (Optional)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleReceiptUpload}
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  className="hidden"
                />

                {formData.receipt_url ? (
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-orange-100/70 text-[#F97316] flex items-center justify-center shrink-0">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div className="truncate text-xs font-medium text-stone-800">
                        Receipt attached ({formData.receipt_url.startsWith('data:') ? 'Local file uploaded' : 'URL link'})
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, receipt_url: '' })}
                      className="text-rose-600 hover:text-rose-800 text-xs font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 px-4 border border-dashed border-stone-300 rounded-xl text-xs text-stone-600 hover:bg-stone-50 hover:border-amber-400 transition-all flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4 text-stone-400" />
                    <span>Upload invoice photo or receipt (PNG, JPG, PDF)</span>
                  </button>
                )}
              </div>

              {/* Notes / Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional details, invoice number, or specific wedding booking reference..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] transition-colors resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={isSaving}
                  className="rounded-xl border-stone-200 text-stone-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  isLoading={isSaving}
                  className="bg-[#F97316] hover:bg-[#EA580C] text-white shadow-xs font-semibold px-4 rounded-xl"
                >
                  {editingExpense ? 'Save Changes' : 'Record Expense'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. View Expense Detail Drawer / Modal */}
      {viewingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl border border-stone-200/90 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#F97316]">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Expense Details</h3>
                  <p className="text-xs text-stone-500">ID: {viewingExpense.id.slice(0, 8)}...</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingExpense(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Amount Banner */}
              <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xl text-center">
                <div className="text-[11px] text-stone-500 uppercase tracking-wider font-semibold">
                  Expense Amount
                </div>
                <div className="text-2xl font-bold text-stone-900 mt-1">
                  {formatINR(viewingExpense.amount_paise)}
                </div>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      CATEGORY_COLORS[viewingExpense.category] || 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    {viewingExpense.category}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      viewingExpense.status === 'RECORDED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-stone-100 text-stone-600 border-stone-200 line-through'
                    }`}
                  >
                    {viewingExpense.status}
                  </span>
                </div>
              </div>

              {/* Data Rows */}
              <div className="space-y-2.5 divide-y divide-stone-100">
                <div className="flex justify-between items-center pt-2">
                  <span className="text-stone-500 font-medium">Title / Description:</span>
                  <span className="font-semibold text-stone-900 text-right max-w-xs">
                    {viewingExpense.description}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-stone-500 font-medium">Expense Date:</span>
                  <span className="font-semibold text-stone-900">
                    {formatDate(viewingExpense.expense_date)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-stone-500 font-medium">Vendor / Supplier:</span>
                  <span className="font-semibold text-stone-900">
                    {viewingExpense.vendor_name || '—'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-stone-500 font-medium">Recorded By:</span>
                  <span className="font-semibold text-stone-900">
                    {viewingExpense.recorded_by || 'Studio Staff'}
                  </span>
                </div>

                {viewingExpense.notes && (
                  <div className="pt-2">
                    <span className="text-stone-500 font-medium block mb-1">Notes:</span>
                    <p className="p-2.5 bg-stone-50 rounded-lg text-stone-700 text-xs leading-relaxed">
                      {viewingExpense.notes}
                    </p>
                  </div>
                )}

                {viewingExpense.receipt_url && (
                  <div className="pt-2">
                    <span className="text-stone-500 font-medium block mb-1">Receipt:</span>
                    {viewingExpense.receipt_url.startsWith('data:image') ? (
                      <div className="mt-1 border border-stone-200 rounded-lg overflow-hidden max-h-48 flex items-center justify-center bg-stone-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={viewingExpense.receipt_url}
                          alt="Receipt Preview"
                          className="object-contain max-h-48 w-full"
                        />
                      </div>
                    ) : (
                      <a
                        href={viewingExpense.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#EA580C] hover:underline flex items-center gap-1 font-medium mt-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View Attached Receipt Link
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const exp = viewingExpense;
                    setViewingExpense(null);
                    handleOpenEditModal(exp);
                  }}
                  className="rounded-xl border-stone-200 text-stone-700"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  Edit
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const exp = viewingExpense;
                    setViewingExpense(null);
                    handleDeleteClick(exp);
                  }}
                  className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Delete
                </Button>

                <Button
                  size="sm"
                  onClick={() => setViewingExpense(null)}
                  className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
