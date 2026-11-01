'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  X,
  IndianRupee,
  AlertTriangle,
  ArrowUpDown,
  Trash2,
  Edit2,
  Eye,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  Package,
  Calendar,
  Barcode,
  History,
  TrendingDown,
  Info,
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
import { inventoryApi } from '@/services/api/modules';
import { formatINR } from '@/utils/formatters';

// Bridal and Makeup Studios Categories
const BRIDAL_INVENTORY_CATEGORIES = [
  'Foundation and concealer',
  'Makeup palettes',
  'Lipsticks and lip products',
  'Eyelashes',
  'Skincare products',
  'Setting sprays',
  'Brushes and tools',
  'Makeup kits',
  'Hair styling products',
  'Saree draping supplies',
  'Other supplies',
];

const UNIT_OPTIONS = [
  'Pieces (pcs)',
  'Bottles',
  'Boxes',
  'Kits',
  'Tubes',
  'Palettes',
  'Sets',
  'Packs',
  'Unit',
];

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const modalAlert = useModalAlert();

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL'); // ALL, IN_STOCK, LOW_STOCK, OUT_OF_STOCK
  const [sortBy, setSortBy] = useState('recent'); // name, quantity, recent
  const [page, setPage] = useState(1);
  const limit = 15;

  // Modals & Drawers State
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null for Add, item object for Edit

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementTargetItem, setMovementTargetItem] = useState(null); // item object or null

  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 1. Fetch Inventory Summary Stats
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: () => inventoryApi.getSummary(),
    staleTime: 1000 * 30,
  });

  const summary = summaryData?.data?.data || summaryData?.data || {};

  // 2. Fetch Inventory Items
  const queryParams = useMemo(() => {
    const params = {
      page,
      limit,
    };
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (selectedCategory && selectedCategory !== 'ALL') params.category = selectedCategory;
    if (stockStatusFilter !== 'ALL') {
      if (stockStatusFilter === 'IN_STOCK') params.stock_status = 'in_stock';
      if (stockStatusFilter === 'LOW_STOCK') params.stock_status = 'low_stock';
      if (stockStatusFilter === 'OUT_OF_STOCK') params.stock_status = 'out_of_stock';
    }
    if (sortBy === 'name') {
      params.sortBy = 'name';
      params.sortOrder = 'asc';
    } else if (sortBy === 'quantity') {
      params.sortBy = 'quantity';
      params.sortOrder = 'desc';
    } else {
      params.sortBy = 'recent';
    }
    return params;
  }, [page, limit, debouncedSearch, selectedCategory, stockStatusFilter, sortBy]);

  const {
    data: itemsData,
    isLoading: isItemsLoading,
    isError: isItemsError,
    error: itemsError,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ['inventory-items', queryParams],
    queryFn: () => inventoryApi.list(queryParams),
    staleTime: 1000 * 20,
  });

  const items = itemsData?.data?.data?.items || itemsData?.data?.items || [];
  const pagination = itemsData?.data?.data?.pagination || itemsData?.data?.pagination || {
    total: 0,
    page: 1,
    limit,
    totalPages: 1,
  };

  // Helper to refresh all queries after mutations
  const refreshAllInventory = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
    if (selectedDetailItem) {
      queryClient.invalidateQueries({ queryKey: ['inventory-movements', selectedDetailItem.id] });
    }
  };

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => inventoryApi.delete(id),
    onSuccess: () => {
      refreshAllInventory();
      modalAlert.showSuccess('Deleted', 'Inventory item removed successfully');
    },
    onError: (err) => {
      modalAlert.showError('Delete Failed', err.response?.data?.message || err.message || 'Unable to delete item');
    },
  });

  const handleDelete = async (item) => {
    const confirmed = await modalAlert.showConfirm({
      title: 'Delete Inventory Item',
      message: `Are you sure you want to delete "${item.name}"? This action cannot be undone and will remove associated stock history.`,
      confirmText: 'Delete Item',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(item.id);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setIsAddEditModalOpen(true);
  };

  const handleOpenMovement = (item = null) => {
    setMovementTargetItem(item);
    setIsMovementModalOpen(true);
  };

  const handleOpenDetail = (item) => {
    setSelectedDetailItem(item);
    setIsDetailDrawerOpen(true);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedCategory('ALL');
    setStockStatusFilter('ALL');
    setSortBy('recent');
    setPage(1);
  };

  const hasActiveFilters = searchTerm !== '' || selectedCategory !== 'ALL' || stockStatusFilter !== 'ALL' || sortBy !== 'recent';

  // Category dropdown options
  const categoryOptions = useMemo(() => {
    return [
      { value: 'ALL', label: 'All Categories' },
      ...BRIDAL_INVENTORY_CATEGORIES.map((cat) => ({ value: cat, label: cat })),
    ];
  }, []);

  const stockStatusOptions = [
    { value: 'ALL', label: 'All Stock Levels' },
    { value: 'IN_STOCK', label: 'In Stock' },
    { value: 'LOW_STOCK', label: 'Low Stock' },
    { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
  ];

  const sortOptions = [
    { value: 'recent', label: 'Recently Updated' },
    { value: 'name', label: 'Product Name (A-Z)' },
    { value: 'quantity', label: 'Quantity (High to Low)' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Cosmetics Inventory</h1>
          <p className="text-sm text-stone-500 mt-1">
            Track stock levels, makeup kits, product quantities, and low-stock alerts.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenMovement(null)}
            className="border-stone-300 text-stone-700 hover:bg-stone-50 hover:text-stone-900 shadow-sm font-medium"
          >
            <History className="w-4 h-4 mr-1.5 text-stone-500" />
            Record Stock Movement
          </Button>
          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Product
          </Button>
        </div>
      </div>

      {/* 2. Inventory Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Products */}
        <Card className="p-4 sm:p-5 border border-stone-200/80 shadow-sm bg-white hover:border-stone-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Products</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {isSummaryLoading ? '...' : (summary.total_products ?? summary.total_items ?? 0)}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">Catalogued SKUs</p>
          </div>
        </Card>

        {/* Total Units */}
        <Card className="p-4 sm:p-5 border border-stone-200/80 shadow-sm bg-white hover:border-stone-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Units</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {isSummaryLoading ? '...' : (summary.total_units ?? 0)}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">In studio stock</p>
          </div>
        </Card>

        {/* Low Stock Products */}
        <Card className="p-4 sm:p-5 border border-stone-200/80 shadow-sm bg-white hover:border-stone-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Low Stock</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight">
              {isSummaryLoading ? '...' : (summary.low_stock_count ?? 0)}
            </div>
            {Number(summary.low_stock_count) > 0 && (
              <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                Reorder soon
              </span>
            )}
          </div>
          <p className="text-xs text-stone-400 mt-0.5">Below threshold</p>
        </Card>

        {/* Out of Stock */}
        <Card className="p-4 sm:p-5 border border-stone-200/80 shadow-sm bg-white hover:border-stone-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Out of Stock</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
              {isSummaryLoading ? '...' : (summary.out_of_stock_count ?? 0)}
            </div>
            {Number(summary.out_of_stock_count) > 0 && (
              <span className="text-[11px] font-medium text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                Action required
              </span>
            )}
          </div>
          <p className="text-xs text-stone-400 mt-0.5">Zero quantity</p>
        </Card>

        {/* Total Inventory Value */}
        <Card className="col-span-2 lg:col-span-1 p-4 sm:p-5 border border-stone-200/80 shadow-sm bg-white hover:border-stone-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Value</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight">
              {isSummaryLoading ? '...' : formatINR(summary.total_valuation_paise || 0)}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">Stock asset value</p>
          </div>
        </Card>
      </div>

      {/* 3. Toolbar: Search, Filters & Sorting */}
      <Card className="p-4 border border-stone-200/80 shadow-sm bg-white">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* Category Filter */}
            <div className="w-full sm:w-44">
              <ModernDropdown
                value={selectedCategory}
                onChange={(val) => {
                  setSelectedCategory(val);
                  setPage(1);
                }}
                options={categoryOptions}
                placeholder="Category"
              />
            </div>

            {/* Stock Status Filter */}
            <div className="w-full sm:w-40">
              <ModernDropdown
                value={stockStatusFilter}
                onChange={(val) => {
                  setStockStatusFilter(val);
                  setPage(1);
                }}
                options={stockStatusOptions}
                placeholder="Stock Level"
              />
            </div>

            {/* Sort Filter */}
            <div className="w-full sm:w-44">
              <ModernDropdown
                value={sortBy}
                onChange={(val) => {
                  setSortBy(val);
                  setPage(1);
                }}
                options={sortOptions}
                placeholder="Sort By"
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-stone-500 hover:text-stone-800 hover:bg-stone-100 whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Active Filter Indicators & Total Results Count */}
        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <div>
            Showing <span className="font-semibold text-stone-800">{items.length}</span> of{' '}
            <span className="font-semibold text-stone-800">{pagination.total || items.length}</span> items
            {hasActiveFilters && <span className="text-stone-400 ml-1.5">(filtered)</span>}
          </div>
          {Number(summary.low_stock_count) > 0 && stockStatusFilter !== 'LOW_STOCK' && (
            <button
              onClick={() => {
                setStockStatusFilter('LOW_STOCK');
                setPage(1);
              }}
              className="text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              {summary.low_stock_count} low-stock alert{summary.low_stock_count > 1 ? 's' : ''} require attention
            </button>
          )}
        </div>
      </Card>

      {/* 4. Inventory List / Table / Empty States */}
      {isItemsLoading ? (
        <Card className="p-12 text-center border border-stone-200/80 shadow-sm bg-white">
          <LoadingSpinner text="Loading cosmetics stock from database..." />
        </Card>
      ) : isItemsError ? (
        <Card className="p-8 text-center border border-rose-200 bg-rose-50/50">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-rose-900">Unable to load inventory</h3>
          <p className="text-xs text-rose-600 mt-1 max-w-md mx-auto">
            {itemsError?.response?.data?.message || itemsError?.message || 'A network error occurred while connecting to the database.'}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetchItems()}
            className="mt-4 border-rose-300 text-rose-800 hover:bg-rose-100"
          >
            Retry Loading
          </Button>
        </Card>
      ) : items.length === 0 ? (
        hasActiveFilters ? (
          <Card className="p-10 text-center border border-stone-200/80 shadow-sm bg-white">
            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900">No products match your filters</h3>
            <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
              We couldn't find any cosmetics matching your search or category selection.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="mt-4 border-stone-300 text-stone-700 hover:bg-stone-50"
            >
              <RotateCcw className="w-4 h-4 mr-1.5 text-stone-400" />
              Clear All Filters
            </Button>
          </Card>
        ) : (
          <Card className="p-12 text-center border border-stone-200/80 shadow-sm bg-white">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-orange-600">
              <Boxes className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">Your inventory is empty</h3>
            <p className="text-sm text-stone-500 mt-1 max-w-md mx-auto">
              Add your first makeup product to start tracking stock levels, kits, foundation shades, and low stock threshold alerts.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                size="sm"
                onClick={handleOpenAdd}
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add First Product
              </Button>
            </div>
          </Card>
        )
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block">
            <Card className="overflow-hidden border border-stone-200/80 shadow-sm bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-stone-50/75 border-b border-stone-200 text-stone-500 text-[11px] font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-3">SKU</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3 text-right">Quantity</th>
                      <th className="py-3 px-3">Unit</th>
                      <th className="py-3 px-3 text-right">Threshold</th>
                      <th className="py-3 px-3 text-right">Unit Cost</th>
                      <th className="py-3 px-3 text-right">Stock Value</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {items.map((item) => {
                      const qty = Number(item.quantity_on_hand);
                      const min = Number(item.minimum_quantity);
                      const unitCost = Number(item.unit_cost_paise || 0);
                      const stockVal = Math.round(qty * unitCost);
                      const isOutOfStock = qty <= 0;
                      const isLowStock = !isOutOfStock && qty <= min;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-stone-50/60 transition-colors group cursor-pointer"
                          onClick={() => handleOpenDetail(item)}
                        >
                          {/* Product */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 shrink-0 font-bold text-xs uppercase">
                                {item.name.slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-stone-900 group-hover:text-orange-600 transition-colors truncate max-w-[180px] lg:max-w-[220px]">
                                  {item.name}
                                </div>
                                {item.expiry_date && (
                                  <div className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                                    <Calendar className="w-3 h-3 text-stone-400" />
                                    Exp: {new Date(item.expiry_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* SKU */}
                          <td className="py-3.5 px-3">
                            {item.sku ? (
                              <span className="font-mono text-xs text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                                {item.sku}
                              </span>
                            ) : (
                              <span className="text-stone-300 text-xs">—</span>
                            )}
                          </td>

                          {/* Category */}
                          <td className="py-3.5 px-3">
                            <span className="inline-block text-xs text-stone-600 bg-stone-50 px-2 py-0.5 rounded-full border border-stone-200/70 truncate max-w-[140px]">
                              {item.category || 'Uncategorized'}
                            </span>
                          </td>

                          {/* Quantity */}
                          <td className="py-3.5 px-3 text-right">
                            <span
                              className={`font-bold tabular-nums text-sm ${
                                isOutOfStock
                                  ? 'text-rose-600'
                                  : isLowStock
                                  ? 'text-amber-600'
                                  : 'text-stone-900'
                              }`}
                            >
                              {qty}
                            </span>
                          </td>

                          {/* Unit */}
                          <td className="py-3.5 px-3 text-xs text-stone-500">{item.unit || 'pcs'}</td>

                          {/* Threshold */}
                          <td className="py-3.5 px-3 text-right text-xs text-stone-500 tabular-nums">
                            {min}
                          </td>

                          {/* Unit Cost */}
                          <td className="py-3.5 px-3 text-right text-xs text-stone-600 tabular-nums">
                            {formatINR(unitCost)}
                          </td>

                          {/* Stock Value */}
                          <td className="py-3.5 px-3 text-right font-medium text-stone-900 tabular-nums">
                            {formatINR(stockVal)}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3 text-center">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle className="w-3 h-3 text-amber-600" /> Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                In Stock
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td
                            className="py-3.5 px-4 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1">
                              <button
                                title="Adjust Stock"
                                onClick={() => handleOpenMovement(item)}
                                className="p-1.5 text-stone-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              >
                                <ArrowUpDown className="w-4 h-4" />
                              </button>
                              <button
                                title="View History & Details"
                                onClick={() => handleOpenDetail(item)}
                                className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                title="Edit Product"
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                title="Delete Product"
                                onClick={() => handleDelete(item)}
                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Mobile Product Cards View */}
          <div className="md:hidden space-y-3">
            {items.map((item) => {
              const qty = Number(item.quantity_on_hand);
              const min = Number(item.minimum_quantity);
              const unitCost = Number(item.unit_cost_paise || 0);
              const stockVal = Math.round(qty * unitCost);
              const isOutOfStock = qty <= 0;
              const isLowStock = !isOutOfStock && qty <= min;

              return (
                <Card
                  key={item.id}
                  className="p-4 border border-stone-200/80 shadow-sm bg-white space-y-3 cursor-pointer hover:border-stone-300 transition-all"
                  onClick={() => handleOpenDetail(item)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-stone-900 text-sm truncate">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
                        {item.sku && <span className="font-mono text-[11px] bg-stone-100 px-1 rounded">{item.sku}</span>}
                        <span>{item.category || 'Uncategorized'}</span>
                      </div>
                    </div>
                    <div>
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          In Stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock Quantities Bar */}
                  <div className="grid grid-cols-3 gap-2 bg-stone-50 p-2.5 rounded-lg border border-stone-100 text-center">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-stone-400">In Stock</div>
                      <div className={`font-bold text-sm ${isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-stone-900'}`}>
                        {qty} <span className="text-[10px] font-normal text-stone-500">{item.unit}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-stone-400">Min Alert</div>
                      <div className="font-semibold text-sm text-stone-600">{min}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-stone-400">Total Value</div>
                      <div className="font-bold text-sm text-stone-800">{formatINR(stockVal)}</div>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div
                    className="flex items-center justify-between pt-1 border-t border-stone-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-xs text-stone-400">
                      Unit: {formatINR(unitCost)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleOpenMovement(item)}
                        className="text-stone-700 border-stone-200"
                      >
                        <ArrowUpDown className="w-3 h-3 mr-1 text-orange-600" />
                        Adjust
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleOpenEdit(item)}
                        className="text-stone-600 hover:text-stone-900"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleDelete(item)}
                        className="text-stone-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-xs text-stone-500">
                Page <span className="font-semibold text-stone-800">{page}</span> of{' '}
                <span className="font-semibold text-stone-800">{pagination.totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="border-stone-200"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="border-stone-200"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 5. Add / Edit Product Modal */}
      {isAddEditModalOpen && (
        <AddEditProductModal
          isOpen={isAddEditModalOpen}
          item={editingItem}
          onClose={() => {
            setIsAddEditModalOpen(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setIsAddEditModalOpen(false);
            setEditingItem(null);
            refreshAllInventory();
          }}
        />
      )}

      {/* 6. Stock Movement / Adjustment Modal */}
      {isMovementModalOpen && (
        <StockMovementModal
          isOpen={isMovementModalOpen}
          initialItem={movementTargetItem}
          allItems={items}
          onClose={() => {
            setIsMovementModalOpen(false);
            setMovementTargetItem(null);
          }}
          onSuccess={() => {
            setIsMovementModalOpen(false);
            setMovementTargetItem(null);
            refreshAllInventory();
          }}
        />
      )}

      {/* 7. Product Details & Stock History Drawer */}
      {isDetailDrawerOpen && selectedDetailItem && (
        <ProductDetailDrawer
          isOpen={isDetailDrawerOpen}
          item={selectedDetailItem}
          onClose={() => {
            setIsDetailDrawerOpen(false);
            setSelectedDetailItem(null);
          }}
          onAdjustStock={(item) => {
            setIsDetailDrawerOpen(false);
            handleOpenMovement(item);
          }}
          onEdit={(item) => {
            setIsDetailDrawerOpen(false);
            handleOpenEdit(item);
          }}
        />
      )}
    </div>
  );
}

/**
 * -------------------------------------------------------------
 * 5. Add / Edit Product Modal Component
 * -------------------------------------------------------------
 */
function AddEditProductModal({ isOpen, item, onClose, onSuccess }) {
  const modalAlert = useModalAlert();
  const isEditing = Boolean(item);

  const [formData, setFormData] = useState({
    name: item?.name || '',
    sku: item?.sku || '',
    category: item?.category || BRIDAL_INVENTORY_CATEGORIES[0],
    unit: item?.unit || 'Pieces (pcs)',
    quantity_on_hand: item ? String(Number(item.quantity_on_hand)) : '0',
    minimum_quantity: item ? String(Number(item.minimum_quantity)) : '5',
    unit_cost_inr: item?.unit_cost_paise ? (Number(item.unit_cost_paise) / 100).toString() : '',
    expiry_date: item?.expiry_date ? item.expiry_date.split('T')[0] : '',
  });

  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: async (payload) => {
      if (isEditing) {
        return inventoryApi.update(item.id, payload);
      } else {
        return inventoryApi.create(payload);
      }
    },
    onSuccess: () => {
      modalAlert.showSuccess(
        isEditing ? 'Product Updated' : 'Product Added',
        `Successfully saved "${formData.name.trim()}" in your cosmetics inventory.`
      );
      onSuccess();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to save product';
      modalAlert.showError('Save Error', msg);
    },
  });

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Product name is required (min 2 chars)';
    if (formData.name.trim().length < 2) errs.name = 'Product name must be at least 2 characters';

    const qty = Number(formData.quantity_on_hand);
    if (isNaN(qty) || qty < 0) errs.quantity_on_hand = 'Quantity cannot be negative';

    const minQty = Number(formData.minimum_quantity);
    if (isNaN(minQty) || minQty < 0) errs.minimum_quantity = 'Threshold cannot be negative';

    if (formData.unit_cost_inr) {
      const cost = Number(formData.unit_cost_inr);
      if (isNaN(cost) || cost < 0) errs.unit_cost_inr = 'Cost must be a valid non-negative number';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim() || null,
      category: formData.category || null,
      unit: formData.unit.trim() || 'unit',
      minimum_quantity: Number(formData.minimum_quantity || 0),
      unit_cost_paise: formData.unit_cost_inr ? Math.round(Number(formData.unit_cost_inr) * 100) : 0,
      expiry_date: formData.expiry_date || null,
    };

    if (!isEditing) {
      payload.quantity_on_hand = Number(formData.quantity_on_hand || 0);
    }

    mutation.mutate(payload);
  };

  const categoryOptions = BRIDAL_INVENTORY_CATEGORIES.map((cat) => ({ value: cat, label: cat }));
  const unitOptions = UNIT_OPTIONS.map((u) => ({ value: u, label: u }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                {isEditing ? 'Edit Cosmetic Product' : 'Add New Cosmetic Product'}
              </h3>
              <p className="text-xs text-stone-500">
                {isEditing ? 'Update product specifications and stock thresholds' : 'Save bridal cosmetics to your studio database'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. MAC Studio Fix Fluid Foundation NC35"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3.5 py-2 text-sm bg-stone-50 border rounded-lg text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${
                errors.name ? 'border-rose-400' : 'border-stone-200'
              }`}
            />
            {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
          </div>

          {/* SKU & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                SKU / Product Code (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. FND-MAC-NC35"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Category
              </label>
              <ModernDropdown
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val })}
                options={categoryOptions}
                placeholder="Select Category"
              />
            </div>
          </div>

          {/* Initial Stock (Only for new product) & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {!isEditing ? (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Initial Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.quantity_on_hand}
                  onChange={(e) => setFormData({ ...formData, quantity_on_hand: e.target.value })}
                  className={`w-full px-3.5 py-2 text-sm bg-stone-50 border rounded-lg text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${
                    errors.quantity_on_hand ? 'border-rose-400' : 'border-stone-200'
                  }`}
                />
                {errors.quantity_on_hand && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.quantity_on_hand}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Current Stock
                </label>
                <div className="px-3.5 py-2 text-sm bg-stone-100 border border-stone-200 rounded-lg text-stone-700 font-bold">
                  {Number(item.quantity_on_hand)} {item.unit}
                  <span className="text-xs font-normal text-stone-400 ml-2">
                    (Use "Adjust Stock" to change)
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Unit of Measurement
              </label>
              <ModernDropdown
                value={formData.unit}
                onChange={(val) => setFormData({ ...formData, unit: val })}
                options={unitOptions}
                placeholder="Unit"
              />
            </div>
          </div>

          {/* Low-Stock Threshold & Unit Purchase Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Low-Stock Threshold
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.minimum_quantity}
                onChange={(e) => setFormData({ ...formData, minimum_quantity: e.target.value })}
                className={`w-full px-3.5 py-2 text-sm bg-stone-50 border rounded-lg text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${
                  errors.minimum_quantity ? 'border-rose-400' : 'border-stone-200'
                }`}
              />
              <p className="text-[10px] text-stone-400 mt-1">Alerts trigger when stock falls below this</p>
              {errors.minimum_quantity && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.minimum_quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Unit Purchase Cost (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-semibold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.unit_cost_inr}
                  onChange={(e) => setFormData({ ...formData, unit_cost_inr: e.target.value })}
                  className={`w-full pl-7 pr-3.5 py-2 text-sm bg-stone-50 border rounded-lg text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${
                    errors.unit_cost_inr ? 'border-rose-400' : 'border-stone-200'
                  }`}
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">Used to evaluate inventory valuation</p>
              {errors.unit_cost_inr && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.unit_cost_inr}</p>
              )}
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Product Expiry Date (Optional)
            </label>
            <ModernDatePicker
              value={formData.expiry_date}
              onChange={(val) => setFormData({ ...formData, expiry_date: val })}
              placeholder="Select expiry date"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={mutation.isPending}
              className="border-stone-300 text-stone-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={mutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm min-w-[110px]"
            >
              {mutation.isPending ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Add Product'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * -------------------------------------------------------------
 * 6. Stock Movement & Adjustment Modal Component
 * -------------------------------------------------------------
 */
function StockMovementModal({ isOpen, initialItem, allItems, onClose, onSuccess }) {
  const modalAlert = useModalAlert();

  const [selectedItemId, setSelectedItemId] = useState(initialItem?.id || (allItems[0]?.id || ''));
  const [movementType, setMovementType] = useState('PURCHASE'); // PURCHASE (Stock In), USAGE (Stock Out), ADJUSTMENT (Physical Count)
  const [quantity, setQuantity] = useState('');
  const [unitCostInr, setUnitCostInr] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});

  const currentItem = useMemo(() => {
    return allItems.find((i) => i.id === selectedItemId) || initialItem;
  }, [allItems, selectedItemId, initialItem]);

  // Pre-fill unit cost if available
  useEffect(() => {
    if (currentItem?.unit_cost_paise && movementType === 'PURCHASE') {
      setUnitCostInr((Number(currentItem.unit_cost_paise) / 100).toString());
    }
  }, [currentItem, movementType]);

  const movementMutation = useMutation({
    mutationFn: async () => {
      if (!selectedItemId) throw new Error('Please select a cosmetic product');

      if (movementType === 'PURCHASE') {
        const payload = {
          quantity: Number(quantity),
          reason: reason.trim() || 'Restocked cosmetics inventory',
        };
        if (unitCostInr) {
          payload.unit_cost_paise = Math.round(Number(unitCostInr) * 100);
        }
        return inventoryApi.stockIn(selectedItemId, payload);
      } else if (movementType === 'USAGE' || movementType === 'WASTE') {
        const payload = {
          quantity: Number(quantity),
          movement_type: movementType,
          reason: reason.trim() || 'Used for bridal makeup appointment',
        };
        return inventoryApi.stockOut(selectedItemId, payload);
      } else if (movementType === 'ADJUSTMENT') {
        const payload = {
          counted_quantity: Number(quantity),
          reason: reason.trim() || 'Physical inventory audit correction',
        };
        return inventoryApi.adjust(selectedItemId, payload);
      }
    },
    onSuccess: (res) => {
      const msg = res?.data?.message || 'Stock movement recorded successfully';
      modalAlert.showSuccess('Stock Updated', msg);
      onSuccess();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to record stock movement';
      modalAlert.showError('Movement Failed', msg);
    },
  });

  const validate = () => {
    const errs = {};
    if (!selectedItemId) errs.item = 'Product is required';

    const qty = Number(quantity);
    if (isNaN(qty) || quantity === '') {
      errs.quantity = 'Quantity is required';
    } else if (movementType === 'ADJUSTMENT' && qty < 0) {
      errs.quantity = 'Counted quantity cannot be negative';
    } else if (movementType !== 'ADJUSTMENT' && qty <= 0) {
      errs.quantity = 'Quantity must be greater than zero';
    }

    if (movementType !== 'ADJUSTMENT' && currentItem && (movementType === 'USAGE' || movementType === 'WASTE')) {
      const available = Number(currentItem.quantity_on_hand);
      if (qty > available) {
        errs.quantity = `Cannot deduct ${qty} ${currentItem.unit}. Only ${available} available in stock.`;
      }
    }

    if (movementType === 'ADJUSTMENT' && !reason.trim()) {
      errs.reason = 'Reason is required for inventory audit adjustment';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    movementMutation.mutate();
  };

  const itemOptions = allItems.map((i) => ({
    value: i.id,
    label: `${i.name} (In stock: ${Number(i.quantity_on_hand)} ${i.unit})`,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
              <ArrowUpDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">Record Stock Movement</h3>
              <p className="text-xs text-stone-500">Track purchases, bridal usage, or audit adjustments</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Movement Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Select Item */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Select Cosmetic Product <span className="text-rose-500">*</span>
            </label>
            <ModernDropdown
              value={selectedItemId}
              onChange={(val) => {
                setSelectedItemId(val);
                setQuantity('');
              }}
              options={itemOptions}
              placeholder="Choose a product..."
            />
            {errors.item && <p className="text-[11px] text-rose-500 mt-1">{errors.item}</p>}
          </div>

          {/* Current Stock Banner */}
          {currentItem && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-stone-500">Current Stock:</span>{' '}
                <span className="font-bold text-stone-900">
                  {Number(currentItem.quantity_on_hand)} {currentItem.unit}
                </span>
              </div>
              <div>
                <span className="text-stone-500">Threshold:</span>{' '}
                <span className="font-medium text-stone-700">{Number(currentItem.minimum_quantity)}</span>
              </div>
            </div>
          )}

          {/* Movement Type Tabs */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Movement Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMovementType('PURCHASE')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  movementType === 'PURCHASE'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                Stock In
              </button>
              <button
                type="button"
                onClick={() => setMovementType('USAGE')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  movementType === 'USAGE'
                    ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-sm'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                Stock Out
              </button>
              <button
                type="button"
                onClick={() => setMovementType('ADJUSTMENT')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                  movementType === 'ADJUSTMENT'
                    ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-sm'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                Adjustment
              </button>
            </div>
          </div>

          {/* Quantity Field */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              {movementType === 'ADJUSTMENT' ? 'New Physical Count Quantity' : 'Quantity to Add / Remove'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                placeholder={movementType === 'ADJUSTMENT' ? 'e.g. 15' : 'e.g. 5'}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={`w-full px-3.5 py-2 text-sm bg-stone-50 border rounded-lg text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${
                  errors.quantity ? 'border-rose-400' : 'border-stone-200'
                }`}
              />
              {currentItem && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-stone-400">
                  {currentItem.unit}
                </span>
              )}
            </div>
            {errors.quantity && <p className="text-[11px] text-rose-500 mt-1">{errors.quantity}</p>}
          </div>

          {/* Unit Cost (Only for Stock In) */}
          {movementType === 'PURCHASE' && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Purchase Cost per Unit (₹) (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-semibold">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={unitCostInr}
                  onChange={(e) => setUnitCostInr(e.target.value)}
                  className="w-full pl-7 pr-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">Updates the product unit cost in the catalog</p>
            </div>
          )}

          {/* Reason / Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Reason / Movement Note {movementType === 'ADJUSTMENT' && <span className="text-rose-500">*</span>}
            </label>
            <input
              type="text"
              placeholder={
                movementType === 'PURCHASE'
                  ? 'e.g. Purchased 10 bottles from Nykaa Pro'
                  : movementType === 'USAGE'
                  ? 'e.g. Consumed for Priya wedding bridal makeover'
                  : 'e.g. Corrected stock count after monthly shelf audit'
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`w-full px-3.5 py-2 text-sm bg-stone-50 border rounded-lg text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${
                errors.reason ? 'border-rose-400' : 'border-stone-200'
              }`}
            />
            {errors.reason && <p className="text-[11px] text-rose-500 mt-1">{errors.reason}</p>}
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={movementMutation.isPending}
              className="border-stone-300 text-stone-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={movementMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm min-w-[120px]"
            >
              {movementMutation.isPending ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Updating...</span>
                </div>
              ) : (
                'Confirm Stock'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * -------------------------------------------------------------
 * 7. Product Details & Stock History Drawer Component
 * -------------------------------------------------------------
 */
function ProductDetailDrawer({ isOpen, item, onClose, onAdjustStock, onEdit }) {
  const { data: movementsData, isLoading: isMovementsLoading } = useQuery({
    queryKey: ['inventory-movements', item.id],
    queryFn: () => inventoryApi.getMovements(item.id),
    enabled: Boolean(item.id),
  });

  const movements = movementsData?.data?.data?.movements || movementsData?.data?.movements || [];

  const qty = Number(item.quantity_on_hand);
  const min = Number(item.minimum_quantity);
  const unitCost = Number(item.unit_cost_paise || 0);
  const stockVal = Math.round(qty * unitCost);
  const isOutOfStock = qty <= 0;
  const isLowStock = !isOutOfStock && qty <= min;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-stone-200 flex flex-col">
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/75">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                {item.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-stone-900 text-base truncate max-w-[240px]">{item.name}</h3>
                <p className="text-xs text-stone-500">{item.category || 'Bridal Cosmetics'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status & Quick Stats */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-500 uppercase">Stock Status</span>
                {isOutOfStock ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Out of Stock
                  </span>
                ) : isLowStock ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Low Stock Alert
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    In Stock
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-200/60">
                <div>
                  <div className="text-[11px] text-stone-400 uppercase font-semibold">Quantity on Hand</div>
                  <div className="text-xl font-extrabold text-stone-900 mt-0.5">
                    {qty} <span className="text-xs font-normal text-stone-500">{item.unit}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-stone-400 uppercase font-semibold">Threshold Limit</div>
                  <div className="text-xl font-bold text-stone-700 mt-0.5">{min}</div>
                </div>
                <div>
                  <div className="text-[11px] text-stone-400 uppercase font-semibold">Unit Purchase Cost</div>
                  <div className="text-base font-bold text-stone-800 mt-0.5">{formatINR(unitCost)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-stone-400 uppercase font-semibold">Total Stock Value</div>
                  <div className="text-base font-extrabold text-emerald-700 mt-0.5">{formatINR(stockVal)}</div>
                </div>
              </div>
            </div>

            {/* Specifications Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">
                Product Details
              </h4>
              <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100 text-xs">
                {item.sku && (
                  <div className="flex items-center justify-between p-3 bg-white">
                    <span className="text-stone-500">SKU / Code</span>
                    <span className="font-mono font-medium text-stone-800">{item.sku}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 bg-white">
                  <span className="text-stone-500">Category</span>
                  <span className="font-medium text-stone-800">{item.category || 'Uncategorized'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white">
                  <span className="text-stone-500">Measurement Unit</span>
                  <span className="font-medium text-stone-800">{item.unit || 'unit'}</span>
                </div>
                {item.expiry_date && (
                  <div className="flex items-center justify-between p-3 bg-white">
                    <span className="text-stone-500">Expiry Date</span>
                    <span className="font-medium text-stone-800">
                      {new Date(item.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 bg-white">
                  <span className="text-stone-500">Created On</span>
                  <span className="text-stone-600">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Stock Movement History */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Recent Stock History
                </h4>
                <span className="text-[11px] text-stone-400">{movements.length} logged entries</span>
              </div>

              {isMovementsLoading ? (
                <div className="py-8 text-center text-xs text-stone-400">Loading stock history...</div>
              ) : movements.length === 0 ? (
                <div className="p-6 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-center text-xs text-stone-500">
                  <History className="w-6 h-6 text-stone-400 mx-auto mb-2" />
                  No stock movements recorded yet for this item.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {movements.map((m) => {
                    const isPositive = Number(m.quantity_change) > 0;
                    return (
                      <div
                        key={m.id}
                        className="p-3 bg-white border border-stone-200/80 rounded-xl shadow-xs flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              isPositive
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-stone-800 truncate">
                              {m.reason || (isPositive ? 'Restocked' : 'Stock usage')}
                            </div>
                            <div className="text-[11px] text-stone-400 flex items-center gap-1.5 mt-0.5">
                              <span>{new Date(m.created_at).toLocaleString()}</span>
                              {m.recorded_by && <span>• {m.recorded_by}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`font-bold tabular-nums ${
                              isPositive ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {isPositive ? `+${Number(m.quantity_change)}` : Number(m.quantity_change)}
                          </div>
                          <span className="text-[10px] text-stone-400 uppercase font-medium">
                            {m.movement_type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(item)}
              className="border-stone-300 text-stone-700"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1.5" />
              Edit Details
            </Button>
            <Button
              size="sm"
              onClick={() => onAdjustStock(item)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm flex-1"
            >
              <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
              Adjust Stock Level
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
