import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupAPI, expenseAPI, balanceAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import toast from 'react-hot-toast';


const Avatar = ({ name, size = 'sm', className = '' }) => {
  const initial = name?.[0]?.toUpperCase() || '?';
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base' };
  return (
    <div className={`${sizes[size]} rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center flex-shrink-0 ${className}`}>
      {initial}
    </div>
  );
};

const AddMemberModal = ({ groupId, onClose, onAdded }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Enter an email address'); return; }
    setLoading(true);
    try {
      const { data } = await groupAPI.addMember(groupId, email.trim());
      onAdded(data.group);
      toast.success(data.message);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800">Add member</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="friend@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition text-sm"
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-1.5">The person must already have a SplitEase account</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              {loading ? 'Adding...' : 'Add member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddExpenseModal = ({ group, onClose, onAdded }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    description: '',
    amount: '',
    paidBy: user?._id || '',
    splitAmong: group.members.map(m => m._id)
  });
  const [loading, setLoading] = useState(false);

  const toggleSplitMember = (memberId) => {
    setForm(prev => ({
      ...prev,
      splitAmong: prev.splitAmong.includes(memberId)
        ? prev.splitAmong.filter(id => id !== memberId)
        : [...prev.splitAmong, memberId]
    }));
  };

  const perPerson = form.amount && form.splitAmong.length > 0
    ? (parseFloat(form.amount) / form.splitAmong.length).toFixed(2)
    : '0.00';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) { toast.error('Description is required'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('Enter a valid amount'); return; }
    if (!form.paidBy) { toast.error('Select who paid'); return; }
    if (form.splitAmong.length === 0) { toast.error('Select at least one member to split with'); return; }
    setLoading(true);
    try {
      const { data } = await expenseAPI.add({ ...form, amount: parseFloat(form.amount), groupId: group._id });
      onAdded(data.expense);
      toast.success('Expense added!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800">Add expense</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description *</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Dinner, Hotel, Petrol"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (₹) *</label>
            <input
              type="number"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Paid by *</label>
            <select
              value={form.paidBy}
              onChange={e => setForm({ ...form, paidBy: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition text-sm bg-white"
            >
              <option value="">Select member</option>
              {group.members.map(m => (
                <option key={m._id} value={m._id}>{m.name}{m._id === user?._id ? ' (you)' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Split among *</label>
            <div className="space-y-2 bg-slate-50 rounded-xl p-3">
              {group.members.map(m => (
                <label key={m._id} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.splitAmong.includes(m._id)}
                    onChange={() => toggleSplitMember(m._id)}
                    className="w-4 h-4 accent-primary-500 cursor-pointer"
                  />
                  <Avatar name={m.name} size="xs" />
                  <span className="text-sm text-slate-700 flex-1">
                    {m.name}{m._id === user?._id ? ' (you)' : ''}
                  </span>
                  {form.splitAmong.includes(m._id) && form.amount && (
                    <span className="text-xs font-semibold text-primary-600">₹{perPerson}</span>
                  )}
                </label>
              ))}
            </div>
            {form.splitAmong.length > 0 && form.amount && (
              <p className="text-xs text-slate-500 mt-2 text-right">
                ₹{perPerson} each · {form.splitAmong.length} people
              </p>
            )}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              {loading ? 'Adding...' : 'Add expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ExpenseItem = ({ expense, currentUserId, onDelete }) => {
  const isOwner = expense.createdBy?._id === currentUserId;
  const sharePerPerson = (expense.amount / expense.splitAmong.length).toFixed(2);
  const date = new Date(expense.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div className="flex items-start gap-3 py-3 group">
      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-slate-800 text-sm">{expense.description}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Paid by <span className="font-medium text-slate-700">
                {expense.paidBy?._id === currentUserId ? 'you' : expense.paidBy?.name}
              </span> · {date}
            </p>
          </div>
          <div className="text-right flex-shrink-0 flex items-start gap-2">
            <div>
              <p className="font-bold text-slate-800 text-sm">₹{expense.amount.toFixed(2)}</p>
              <p className="text-xs text-slate-400">₹{sharePerPerson}/person</p>
            </div>
            {isOwner && (
              <button
                onClick={() => onDelete(expense._id, expense.description)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all mt-0.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {expense.splitAmong?.map(m => (
            <span key={m._id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {m._id === currentUserId ? 'you' : m.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const BalanceSummary = ({ balances, settlements, totalExpenses, currentUserId }) => {
  return (
    <div className="space-y-4">
      {/* Total */}
      <div className="bg-primary-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-primary-600 uppercase tracking-wide">Total expenses</p>
          <p className="text-2xl font-bold text-primary-700 mt-0.5">₹{totalExpenses?.toFixed(2)}</p>
        </div>
        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {/* Individual balances */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Balances</h4>
        <div className="space-y-2">
          {balances?.map(b => (
            <div key={b.userId} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-slate-50">
              <Avatar name={b.name} size="xs" />
              <span className="flex-1 text-sm font-medium text-slate-700">
                {b.userId === currentUserId ? 'You' : b.name}
              </span>
              <span className={`text-sm font-bold ${b.balance > 0 ? 'text-green-600' : b.balance < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                {b.balance > 0 ? '+' : ''}{b.balance === 0 ? 'settled' : `₹${Math.abs(b.balance).toFixed(2)}`}
              </span>
              {b.balance > 0 && <span className="text-xs text-green-500 font-medium">gets back</span>}
              {b.balance < 0 && <span className="text-xs text-red-400 font-medium">owes</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Settlements */}
      {settlements?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Suggested settlements</h4>
          <div className="space-y-2">
            {settlements.map((s, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white text-sm">
                <Avatar name={s.from.name} size="xs" />
                <span className="font-medium text-slate-700">{s.from.userId === currentUserId ? 'You' : s.from.name}</span>
                <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <Avatar name={s.to.name} size="xs" />
                <span className="font-medium text-slate-700 flex-1">{s.to.userId === currentUserId ? 'You' : s.to.name}</span>
                <span className="font-bold text-slate-800">₹{s.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {settlements?.length === 0 && balances?.length > 0 && (
        <div className="text-center py-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-green-700">All settled up!</p>
          <p className="text-xs text-slate-500 mt-0.5">No pending payments</p>
        </div>
      )}
    </div>
  );
};


const GroupDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balanceSummary, setBalanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [groupRes, expenseRes, balanceRes] = await Promise.all([
        groupAPI.getOne(id),
        expenseAPI.getByGroup(id),
        balanceAPI.getGroupBalances(id)
      ]);
      setGroup(groupRes.data.group);
      setExpenses(expenseRes.data.expenses);
      setBalanceSummary(balanceRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load group');
      if (err.response?.status === 403 || err.response?.status === 404) {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const refreshBalances = async () => {
    try {
      const { data } = await balanceAPI.getGroupBalances(id);
      setBalanceSummary(data);
    } catch { /* silent */ }
  };

  const handleExpenseAdded = (expense) => {
    setExpenses(prev => [expense, ...prev]);
    refreshBalances();
  };

  const handleExpenseDelete = async (expenseId, desc) => {
    if (!window.confirm(`Delete "${desc}"?`)) return;
    try {
      await expenseAPI.delete(expenseId);
      setExpenses(prev => prev.filter(e => e._id !== expenseId));
      refreshBalances();
      toast.success('Expense deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from this group?`)) return;
    try {
      const { data } = await groupAPI.removeMember(id, memberId);
      setGroup(data.group);
      toast.success(`${memberName} removed`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Loading group...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!group) return null;

  const isCreator = group.createdBy?._id === user?._id;
  const tabs = [
    { id: 'expenses', label: 'Expenses', count: expenses.length },
    { id: 'balances', label: 'Balances & Settlements' },
    { id: 'members', label: 'Members', count: group.members?.length }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back + Header */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to groups
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{group.groupName}</h1>
            {group.description && <p className="text-slate-500 text-sm mt-1">{group.description}</p>}
            <p className="text-xs text-slate-400 mt-1">
              Created by {group.createdBy?._id === user?._id ? 'you' : group.createdBy?.name}
            </p>
          </div>
          <button
            onClick={() => setShowAddExpense(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors shadow-sm text-sm whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Expense
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-primary-400 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">

          {/* Expenses tab */}
          {activeTab === 'expenses' && (
            <div>
              {expenses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="font-semibold text-slate-600">No expenses yet</p>
                  <p className="text-slate-400 text-sm mt-1">Add your first expense to get started</p>
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="mt-4 px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    Add first expense
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {expenses.map(exp => (
                    <ExpenseItem
                      key={exp._id}
                      expense={exp}
                      currentUserId={user?._id}
                      onDelete={handleExpenseDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Balances tab */}
          {activeTab === 'balances' && (
            <BalanceSummary
              {...balanceSummary}
              currentUserId={user?._id}
            />
          )}

          {/* Members tab */}
          {activeTab === 'members' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500">{group.members?.length} members</p>
                {isCreator && (
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="flex items-center gap-1.5 text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add member
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {group.members?.map(m => (
                  <div key={m._id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <Avatar name={m.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {m.name}{m._id === user?._id ? ' (you)' : ''}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{m.email}</p>
                    </div>
                    {m._id === group.createdBy?._id && (
                      <span className="text-xs bg-primary-100 text-primary-700 font-medium px-2 py-0.5 rounded-full">Admin</span>
                    )}
                    {isCreator && m._id !== group.createdBy?._id && m._id !== user?._id && (
                      <button
                        onClick={() => handleRemoveMember(m._id, m.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Remove member"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" /></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {showAddExpense && (
        <AddExpenseModal
          group={group}
          onClose={() => setShowAddExpense(false)}
          onAdded={handleExpenseAdded}
        />
      )}
      {showAddMember && (
        <AddMemberModal
          groupId={id}
          onClose={() => setShowAddMember(false)}
          onAdded={setGroup}
        />
      )}
    </div>
  );
};

export default GroupDetailsPage;
