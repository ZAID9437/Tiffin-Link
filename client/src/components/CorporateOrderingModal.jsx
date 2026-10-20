import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  CheckCircle2,
  Clock,
  X,
  Plus,
  ArrowRight,
  ShieldCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import {
  getOrganizations,
  createOrganization,
  createCorporateMealOrder,
  getCorporateMealOrders,
  approveCorporateMealOrder
} from '../services/advancedFeaturesApi';

export default function CorporateOrderingModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('orders'); // 'orders' | 'new_order' | 'register_org'
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // New Order Form state
  const [department, setDepartment] = useState('Engineering & Design');
  const [headcount, setHeadcount] = useState(12);
  const [mealCategory, setMealCategory] = useState('Executive Satvik Thali');
  const [unitPrice, setUnitPrice] = useState(160);
  const [deliveryDate, setDeliveryDate] = useState('Tomorrow, 1:00 PM');
  const [dietaryOptions, setDietaryOptions] = useState({ veg: 8, jain: 4, vegan: 0 });

  // Register Org form
  const [newOrgName, setNewOrgName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [subsidyPercentage, setSubsidyPercentage] = useState(80);
  const [monthlyBudget, setMonthlyBudget] = useState(50000);

  const loadOrgs = async () => {
    setLoading(true);
    try {
      const res = await getOrganizations();
      if (res && res.success) {
        setOrganizations(res.organizations || []);
        if (res.organizations?.length > 0 && !selectedOrgId) {
          setSelectedOrgId(res.organizations[0].organizationId);
        }
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async (orgId) => {
    if (!orgId) return;
    try {
      const res = await getCorporateMealOrders(orgId);
      if (res && res.success) {
        setOrders(res.orders || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (isOpen) {
      loadOrgs();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedOrgId) {
      loadOrders(selectedOrgId);
    }
  }, [selectedOrgId]);

  if (!isOpen) return null;

  const currentOrg = organizations.find(o => o.organizationId === selectedOrgId) || organizations[0];
  const subsidyPct = currentOrg ? currentOrg.subsidyPercentage : 80;
  const totalCost = headcount * unitPrice;
  const companySubsidy = Math.round((totalCost * subsidyPct) / 100);
  const employeeCoPay = totalCost - companySubsidy;

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!selectedOrgId) return;
    setSubmitting(true);
    setMessage('');

    try {
      const res = await createCorporateMealOrder({
        organizationId: selectedOrgId,
        department,
        orderDate: new Date().toISOString(),
        shift: 'lunch',
        items: [
          {
            mealType: mealCategory,
            quantity: headcount,
            unitPrice,
            specialDietary: `Pure Veg: ${dietaryOptions.veg}, Jain: ${dietaryOptions.jain}`
          }
        ],
        coordinatorEmail: 'admin@corporate.corp'
      });

      if (res && res.success) {
        setMessage('Corporate bulk meal order submitted successfully! Awaiting coordinator approval.');
        loadOrders(selectedOrgId);
        setTab('orders');
      }
    } catch (err) {
      setMessage('Error creating corporate order: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName) return;
    setSubmitting(true);

    try {
      const res = await createOrganization({
        name: newOrgName,
        code: companyCode || newOrgName.slice(0, 4).toUpperCase(),
        subsidyPercentage: Number(subsidyPercentage) || 75,
        monthlyBudget: Number(monthlyBudget) || 50000,
        address: 'SG Highway Tech Park, Ahmedabad'
      });

      if (res && res.success) {
        await loadOrgs();
        setSelectedOrgId(res.organization?.organizationId);
        setTab('new_order');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (orderId) => {
    try {
      const res = await approveCorporateMealOrder(orderId);
      if (res && res.success) {
        loadOrders(selectedOrgId);
      }
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Corporate Meal Solutions</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 uppercase tracking-widest">
                  B2B Subsidies
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Automated employee lunch allowances, consolidated invoices & team batches
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Org Selector & Tab Nav */}
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-600 dark:text-stone-300">Organization:</span>
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {organizations.map(o => (
                <option key={o.organizationId} value={o.organizationId}>
                  {o.name} ({o.subsidyPercentage}% Subsidy)
                </option>
              ))}
              <option value="">+ Register New Company</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('orders')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                tab === 'orders'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300'
              }`}
            >
              Active Orders ({orders.length})
            </button>
            <button
              onClick={() => setTab('new_order')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                tab === 'new_order'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Batch Order</span>
            </button>
            <button
              onClick={() => setTab('register_org')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                tab === 'register_org'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300'
              }`}
            >
              Company Settings
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-stone-900 dark:text-stone-100">
          {message && (
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {tab === 'orders' && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-stone-200 dark:border-stone-800 rounded-2xl">
                  <Building2 className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-stone-600 dark:text-stone-300">
                    No active corporate meal batches found for this company
                  </p>
                  <button
                    onClick={() => setTab('new_order')}
                    className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
                  >
                    Place Team Lunch Batch
                  </button>
                </div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.orderId}
                    className="p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          {ord.department || 'All Departments'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          ord.status === 'approved'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                        }`}>
                          {ord.status}
                        </span>
                      </div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-3">
                        <span>{ord.totalHeadcount || ord.items?.reduce((s, i) => s + i.quantity, 0)} Meals</span>
                        <span>&bull;</span>
                        <span>Shift: {ord.shift || 'Lunch'}</span>
                        <span>&bull;</span>
                        <span>Company Pays: ₹{ord.companySubsidyAmount || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-base font-black text-blue-600 dark:text-blue-400">
                          ₹{ord.totalAmount}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          Emp Co-Pay: ₹{ord.employeeCoPayAmount || 0}
                        </div>
                      </div>

                      {ord.status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(ord.orderId)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Dispatch</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'new_order' && (
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Department / Team
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Headcount (People)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="500"
                    value={headcount}
                    onChange={(e) => setHeadcount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Meal Tier
                  </label>
                  <select
                    value={mealCategory}
                    onChange={(e) => setMealCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Executive Satvik Thali">Executive Satvik Thali (₹160)</option>
                    <option value="Premium Gujarati Royal Thali">Premium Gujarati Royal Thali (₹190)</option>
                    <option value="Light Corporate Balanced Box">Light Corporate Balanced Box (₹135)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Dietary Split
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Veg"
                      value={dietaryOptions.veg}
                      onChange={(e) => setDietaryOptions(p => ({ ...p, veg: Number(e.target.value) }))}
                      className="w-1/2 px-2 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold text-center"
                    />
                    <input
                      type="number"
                      placeholder="Jain"
                      value={dietaryOptions.jain}
                      onChange={(e) => setDietaryOptions(p => ({ ...p, jain: Number(e.target.value) }))}
                      className="w-1/2 px-2 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Subsidy Calculation Card */}
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Gross Batch Amount ({headcount} Meals &times; ₹{unitPrice}):</span>
                  <span>₹{totalCost}</span>
                </div>
                <div className="flex justify-between text-xs text-blue-700 dark:text-blue-300 font-bold">
                  <span>Company Subsidy Covered ({subsidyPct}%):</span>
                  <span>-₹{companySubsidy}</span>
                </div>
                <div className="pt-2 border-t border-blue-200 dark:border-blue-900 flex justify-between text-sm font-black text-stone-900 dark:text-white">
                  <span>Total Employee Co-Pay:</span>
                  <span>₹{employeeCoPay} (₹{Math.round(employeeCoPay / (headcount || 1))}/person)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider transition shadow-lg shadow-blue-500/20"
              >
                {submitting ? 'Submitting Batch...' : `Place Corporate Batch Order (₹${totalCost})`}
              </button>
            </form>
          )}

          {tab === 'register_org' && (
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <h4 className="font-bold text-sm">Register New Corporate Employer Portal</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="e.g. Acme Tech Solutions"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Company Code
                  </label>
                  <input
                    type="text"
                    value={companyCode}
                    onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ACMET"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Employer Meal Subsidy (%)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={subsidyPercentage}
                    onChange={(e) => setSubsidyPercentage(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Monthly Budget Allocation (₹)
                  </label>
                  <input
                    type="number"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wider transition"
              >
                {submitting ? 'Registering...' : 'Register Corporate Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
