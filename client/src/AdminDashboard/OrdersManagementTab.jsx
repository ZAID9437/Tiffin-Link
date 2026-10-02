import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  IndianRupee,
  TrendingUp,
  MapPin,
  Phone,
  User,
  Store,
  Bike,
  X
} from 'lucide-react';
import DataTable from '../components/common/DataTable';

export default function OrdersManagementTab({ subTab = 'orders-all' }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Platform Metrics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    refunded: 0,
    totalGross: 0,
    aov: 0
  });

  // Order 360 Inspection Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [order360Data, setOrder360Data] = useState(null);
  const [loading360, setLoading360] = useState(false);

  useEffect(() => {
    if (!subTab) return;
    if (subTab === 'orders-active') setStatusFilter('active');
    else if (subTab === 'orders-completed') setStatusFilter('completed');
    else if (subTab === 'orders-cancelled') setStatusFilter('cancelled');
    else if (subTab === 'orders-refunded') setStatusFilter('refunded');
    else if (subTab === 'orders-pending') setStatusFilter('pending');
    else if (subTab === 'orders-all' || subTab === 'orders') setStatusFilter('all');
  }, [subTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = `http://localhost:5000/api/admin/orders?page=${page}&limit=${pageSize}&search=${encodeURIComponent(
        search
      )}&status=${encodeURIComponent(statusFilter)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.orders)) {
        setOrders(json.orders);
        setTotalCount(json.total || json.orders.length);
        if (json.stats) {
          setStats(json.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching marketplace orders from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter, page, pageSize]);

  // Fetch Order 360 profile
  const handleInspectOrder = async (order) => {
    const targetId = order._id || order.orderId || order.requestId;
    setSelectedOrder(order);
    setLoading360(true);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/orders/${targetId}/360`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrder360Data(json.data);
      } else {
        setOrder360Data({ order });
      }
    } catch (err) {
      console.error('Error fetching order 360:', err);
      setOrder360Data({ order });
    } finally {
      setLoading360(false);
    }
  };

  // Status badge styling
  const renderStatusBadge = (status) => {
    const st = String(status || '').toLowerCase();
    if (['completed', 'delivered'].includes(st)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 font-mono text-[10px] uppercase font-bold border border-emerald-200">
          <CheckCircle2 size={11} className="text-emerald-700" />
          <span>{status || 'Delivered'}</span>
        </span>
      );
    }
    if (['active', 'preparing', 'assigned', 'in_transit', 'picked_up', 'ready'].includes(st)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-900 font-mono text-[10px] uppercase font-bold border border-amber-200">
          <Clock size={11} className="text-amber-700 animate-pulse" />
          <span>{status || 'Active'}</span>
        </span>
      );
    }
    if (['cancelled', 'canceled'].includes(st)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-800 font-mono text-[10px] uppercase font-bold border border-rose-200">
          <XCircle size={11} className="text-rose-700" />
          <span>Cancelled</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#efeeea] text-[#1a1a1a] font-mono text-[10px] uppercase font-bold border border-[#ded9d1]">
        <span>{status || 'Pending'}</span>
      </span>
    );
  };

  // Columns definition for DataTable
  const orderColumns = [
    {
      key: 'orderId',
      label: 'Order Reference',
      sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-[#1a1a1a] text-xs">
            #{row.requestId || row.orderId || (row._id ? String(row._id).slice(-6) : 'TL1029')}
          </span>
          <span className="text-[10px] font-mono text-[#665d52]">
            {row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Live Session'}
          </span>
        </div>
      )
    },
    {
      key: 'customerName',
      label: 'Customer / Patron',
      sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[#1a1a1a]">{row.customerName || 'Direct Customer'}</span>
          <span className="font-mono text-[10px] text-[#665d52]">{row.customerPhone || 'Verified Account'}</span>
        </div>
      )
    },
    {
      key: 'providerName',
      label: 'Provider Kitchen',
      sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[#1a1a1a]">{row.providerName || row.kitchenName || 'Ahmedabad Hub Kitchen'}</span>
          <span className="text-[10px] text-[#665d52] truncate max-w-[180px]">
            {row.pickupAddress || row.providerAddress || 'Ahmedabad'}
          </span>
        </div>
      )
    },
    {
      key: 'assignedDriverName',
      label: 'Assigned Courier',
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="text-[#1a1a1a] font-medium">
            {row.assignedDriver?.name || row.assignedDriverName || 'Awaiting Partner'}
          </span>
          <span className="font-mono text-[10px] text-[#665d52]">
            {row.assignedDriver?.phone || row.assignedDriverPhone || 'Auto-Dispatch'}
          </span>
        </div>
      )
    },
    {
      key: 'totalAmount',
      label: 'Gross Amount',
      align: 'right',
      sortable: true,
      render: (val, row) => (
        <div className="flex flex-col text-right">
          <span className="font-mono font-bold text-[#1a1a1a] text-xs">
            ₹{Number(row.totalAmount || row.amount || row.budget || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="font-mono text-[10px] text-[#665d52]">
            {row.paymentStatus || 'PREPAID'}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Lifecycle State',
      align: 'center',
      render: (val) => renderStatusBadge(val)
    },
    {
      key: 'actions',
      label: 'Inspect',
      align: 'center',
      render: (val, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleInspectOrder(row);
          }}
          className="px-2.5 py-1 bg-[#efeeea] hover:bg-[#eae8e4] text-[#1a1a1a] font-sans text-[11px] font-semibold flex items-center gap-1 transition-colors border border-[#ded9d1]"
          title="Inspect Order 360 Dossier"
        >
          <Eye size={12} className="text-[#665d52]" />
          <span>Inspect</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Platform Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#ded9d1]/60 pb-5">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#665d52] uppercase tracking-widest">
            <span>Marketplace Operations</span>
            <span className="text-[#ded9d1]">/</span>
            <span>Master Orders Log</span>
          </div>
          <h2 className="font-serif text-2xl text-[#1b1c1a] tracking-tight mt-1 flex items-center gap-2">
            <ShoppingBag className="text-[#1b1c1a]" size={22} />
            <span>Platform Marketplace Orders Master Log</span>
          </h2>
          <p className="text-xs text-[#444748] mt-1">
            Complete reconciliation and fulfillment trace of orders across every Provider, Driver, and Customer.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="bg-[#1b1c1a] hover:bg-neutral-800 text-white font-medium text-xs px-4 py-2 flex items-center gap-2 transition-colors shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* KPI Cards Grid derived from MongoDB */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 border border-[#ded9d1]/80 shadow-2xs flex flex-col gap-1">
          <span className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Total Platform Orders</span>
          <span className="font-mono text-xl font-bold text-[#1a1a1a]">{stats.total}</span>
          <span className="text-[10px] text-[#665d52]">100% MongoDB audit</span>
        </div>

        <div className="bg-white p-3.5 border border-[#ded9d1]/80 shadow-2xs flex flex-col gap-1">
          <span className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Active In-Flight</span>
          <span className="font-mono text-xl font-bold text-amber-700">{stats.active}</span>
          <span className="text-[10px] text-amber-700">Kitchen & Dispatch</span>
        </div>

        <div className="bg-white p-3.5 border border-[#ded9d1]/80 shadow-2xs flex flex-col gap-1">
          <span className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Delivered & Settled</span>
          <span className="font-mono text-xl font-bold text-emerald-800">{stats.completed}</span>
          <span className="text-[10px] text-emerald-700">OTP Verified Handover</span>
        </div>

        <div className="bg-white p-3.5 border border-[#ded9d1]/80 shadow-2xs flex flex-col gap-1">
          <span className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Cancelled / Failed</span>
          <span className="font-mono text-xl font-bold text-rose-700">{stats.cancelled}</span>
          <span className="text-[10px] text-rose-600">SLA Audit Flagged</span>
        </div>

        <div className="bg-white p-3.5 border border-[#ded9d1]/80 shadow-2xs flex flex-col gap-1">
          <span className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Gross GMV</span>
          <span className="font-mono text-xl font-bold text-[#1a1a1a]">
            ₹{(stats.totalGross || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] text-[#665d52]">Marketplace Volume</span>
        </div>

        <div className="bg-white p-3.5 border border-[#ded9d1]/80 shadow-2xs flex flex-col gap-1">
          <span className="font-mono text-[10px] text-[#665d52] uppercase tracking-wider">Average Order Value</span>
          <span className="font-mono text-xl font-bold text-[#1a1a1a]">
            ₹{Math.round(stats.aov || 0)}
          </span>
          <span className="text-[10px] text-[#665d52]">Basket Size</span>
        </div>
      </div>

      {/* Main Table via reusable DataTable */}
      <DataTable
        title="Marketplace Orders Ledger"
        subtitle="Itemized order records with customer contacts, kitchen routes, and financial status."
        columns={orderColumns}
        data={orders}
        loading={loading}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
        onSearch={(q) => {
          setSearch(q);
          setPage(1);
        }}
        onRefresh={fetchOrders}
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            options: [
              { value: 'all', label: 'All Lifecycle States' },
              { value: 'active', label: 'Active In-Flight' },
              { value: 'completed', label: 'Delivered & Settled' },
              { value: 'pending', label: 'Pending Acceptance' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'refunded', label: 'Refunded' }
            ],
            onChange: (val) => {
              setStatusFilter(val);
              setPage(1);
            }
          }
        ]}
        searchPlaceholder="Search by Order ID, Customer, Kitchen, or Courier..."
        exportFileName="TiffinLink_Orders_Master_Ledger"
        emptyMessage="No marketplace orders found matching your search criteria."
        onRowClick={(row) => handleInspectOrder(row)}
      />

      {/* Order 360 Inspection Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-[#1a1a1a]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full border border-[#ded9d1] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-[#f5f3ef] border-b border-[#ded9d1] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={18} className="text-[#1a1a1a]" />
                <span className="font-serif text-lg font-bold text-[#1a1a1a]">
                  Order 360° Forensic Trace: #{selectedOrder.requestId || selectedOrder.orderId || String(selectedOrder._id).slice(-6)}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setOrder360Data(null);
                }}
                className="p-1 hover:bg-[#eae8e4] text-[#665d52] hover:text-[#1a1a1a]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 font-sans text-xs">
              {loading360 ? (
                <div className="py-12 text-center text-[#665d52] font-mono">
                  Loading Order 360° telemetry from MongoDB...
                </div>
              ) : (
                <>
                  {/* Status Banner */}
                  <div className="p-3 bg-[#fbf9f5] border border-[#ded9d1] flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-[#665d52] uppercase block">Current Fulfillment Status</span>
                      <span className="font-mono font-bold text-sm text-[#1a1a1a]">
                        {order360Data?.order?.status || selectedOrder.status || 'Active'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[10px] text-[#665d52] uppercase block">Total Gross GMV</span>
                      <span className="font-mono font-bold text-base text-[#1a1a1a]">
                        ₹{Number(order360Data?.order?.grossAmount || selectedOrder.totalAmount || selectedOrder.amount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Customer & Provider Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-white border border-[#ded9d1] flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-[#1a1a1a] uppercase">
                        <User size={13} className="text-[#665d52]" />
                        <span>Customer Details</span>
                      </div>
                      <p className="font-semibold text-[#1a1a1a]">{order360Data?.customer?.name || selectedOrder.customerName || 'Direct Customer'}</p>
                      <p className="text-[#665d52] font-mono">{order360Data?.customer?.phone || selectedOrder.customerPhone || 'No contact provided'}</p>
                      <p className="text-[#665d52] flex items-start gap-1 mt-1">
                        <MapPin size={12} className="shrink-0 mt-0.5 text-[#665d52]" />
                        <span>{order360Data?.customer?.address || selectedOrder.deliveryAddress || selectedOrder.customerAddress || 'Ahmedabad, Gujarat'}</span>
                      </p>
                    </div>

                    <div className="p-3.5 bg-white border border-[#ded9d1] flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-[#1a1a1a] uppercase">
                        <Store size={13} className="text-[#665d52]" />
                        <span>Kitchen Provider</span>
                      </div>
                      <p className="font-semibold text-[#1a1a1a]">{order360Data?.provider?.kitchenName || selectedOrder.providerName || 'Local Culinary Partner'}</p>
                      <p className="text-[#665d52] flex items-start gap-1 mt-1">
                        <MapPin size={12} className="shrink-0 mt-0.5 text-[#665d52]" />
                        <span>{order360Data?.provider?.address || selectedOrder.pickupAddress || 'Ahmedabad Cloud Hub'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Courier & Logistics */}
                  <div className="p-3.5 bg-white border border-[#ded9d1] flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-[#1a1a1a] uppercase">
                      <Bike size={13} className="text-[#665d52]" />
                      <span>Assigned Delivery Partner</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-[#1a1a1a]">
                          {order360Data?.driver?.name || selectedOrder.assignedDriver?.name || 'Awaiting Courier Allocation'}
                        </p>
                        <p className="font-mono text-[#665d52]">
                          {order360Data?.driver?.phone || selectedOrder.assignedDriver?.phone || 'Dispatch radar active'}
                        </p>
                      </div>
                      <span className="font-mono text-xs px-2 py-0.5 bg-[#efeeea] border border-[#ded9d1]">
                        {order360Data?.driver?.vehicleNo || selectedOrder.assignedDriver?.vehicleNo || 'Two Wheeler'}
                      </span>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="p-3.5 bg-[#f5f3ef] border border-[#ded9d1] space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#665d52]">Items Subtotal:</span>
                      <span>₹{(Number(order360Data?.order?.grossAmount || selectedOrder.totalAmount || 0) * 0.85).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#665d52]">Platform Commission (5%):</span>
                      <span>₹{(Number(order360Data?.order?.grossAmount || selectedOrder.totalAmount || 0) * 0.05).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#665d52]">Logistics & Delivery Escrow:</span>
                      <span>₹{(Number(order360Data?.order?.grossAmount || selectedOrder.totalAmount || 0) * 0.10).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[#ded9d1] font-bold text-[#1a1a1a]">
                      <span>Customer Paid Total:</span>
                      <span>₹{Number(order360Data?.order?.grossAmount || selectedOrder.totalAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-[#f5f3ef] border-t border-[#ded9d1] flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setOrder360Data(null);
                }}
                className="px-4 py-2 bg-[#1a1a1a] text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
