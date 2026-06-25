import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import toast from 'react-hot-toast';

const GroupCard = ({ group, currentUserId, onDelete }) => {
  const navigate = useNavigate();
  const isCreator = group.createdBy?._id === currentUserId;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div
            className="flex-1 cursor-pointer"
            onClick={() => navigate(`/groups/${group._id}`)}
          >
            <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-primary-600 transition-colors">
              {group.groupName}
            </h3>
            {group.description && (
              <p className="text-slate-500 text-sm mt-1 line-clamp-2">{group.description}</p>
            )}
          </div>
          {isCreator && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(group._id, group.groupName); }}
              className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {group.members?.slice(0, 4).map((m, i) => (
              <div
                key={m._id}
                title={m.name}
                className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center border-2 border-white"
              >
                {m.name[0].toUpperCase()}
              </div>
            ))}
            {group.members?.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center border-2 border-white">
                +{group.members.length - 4}
              </div>
            )}
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {group.members?.length} member{group.members?.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <div
        className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between cursor-pointer hover:bg-primary-50 transition-colors"
        onClick={() => navigate(`/groups/${group._id}`)}
      >
        <span className="text-xs text-slate-500 font-medium">
          Created by {group.createdBy?._id === currentUserId ? 'you' : group.createdBy?.name}
        </span>
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

const CreateGroupModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({ groupName: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.groupName.trim()) { toast.error('Group name is required'); return; }
    setLoading(true);
    try {
      await onCreate(form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800">Create new group</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Group name *</label>
            <input
              type="text"
              value={form.groupName}
              onChange={e => setForm({ ...form, groupName: e.target.value })}
              placeholder="e.g. Goa Trip, Roommates, Office"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition text-sm text-slate-800 placeholder-slate-400"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description <span className="text-slate-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="What's this group for?"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition text-sm text-slate-800 placeholder-slate-400"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              {loading ? 'Creating...' : 'Create group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuth();

  const fetchGroups = useCallback(async () => {
    try {
      const { data } = await groupAPI.getAll();
      setGroups(data.groups);
    } catch {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const handleCreate = async (formData) => {
    try {
      const { data } = await groupAPI.create(formData);
      setGroups(prev => [data.group, ...prev]);
      toast.success(`"${data.group.groupName}" created!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
      throw err;
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" and all its expenses? This cannot be undone.`)) return;
    try {
      await groupAPI.delete(id);
      setGroups(prev => prev.filter(g => g._id !== id));
      toast.success(`"${name}" deleted`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete group');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">My Groups</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {loading ? 'Loading...' : `${groups.length} group${groups.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors shadow-sm text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Group
          </button>
        </div>

        {/* Groups grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-8 bg-slate-100 rounded mt-4" />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No groups yet</h3>
            <p className="text-slate-500 text-sm mb-6">Create a group to start splitting expenses with friends</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors shadow-sm text-sm"
            >
              Create your first group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(group => (
              <GroupCard
                key={group._id}
                group={group}
                currentUserId={user?._id}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
};

export default DashboardPage;
