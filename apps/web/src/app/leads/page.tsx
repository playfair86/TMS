'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Plus, Phone, Mail, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

const statusColors: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-800',
  CONTACTED: 'bg-blue-100 text-blue-800',
  QUALIFIED: 'bg-indigo-100 text-indigo-800',
  APPLIED: 'bg-purple-100 text-purple-800',
  SCREENED: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  LEASE_SIGNED: 'bg-emerald-100 text-emerald-800',
  MOVED_IN: 'bg-teal-100 text-teal-800',
  LOST: 'bg-red-100 text-red-800',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', source: 'WEBSITE',
    monthlyIncome: '', notes: '',
  });

  const loadLeads = () => {
    const params: Record<string, string> = {};
    if (filter) params.status = filter;
    api.getLeads(params)
      .then((res) => setLeads(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadLeads(); }, [filter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLead({
        ...form,
        monthlyIncome: form.monthlyIncome ? parseFloat(form.monthlyIncome) : undefined,
      });
      setShowForm(false);
      setForm({ firstName: '', lastName: '', email: '', phone: '', source: 'WEBSITE', monthlyIncome: '', notes: '' });
      loadLeads();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.updateLeadStatus(id, status);
      loadLeads();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 mt-1">Manage your lead pipeline</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          <Plus className="h-4 w-4" /> Add Lead
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button onClick={() => setFilter('')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!filter ? 'bg-primary-100 text-primary-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>All</button>
        {Object.keys(statusColors).map((status) => (
          <button key={status} onClick={() => setFilter(status)} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === status ? 'bg-primary-100 text-primary-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input type="text" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input type="text" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="WEBSITE">Website</option>
                <option value="WALK_IN">Walk-in</option>
                <option value="AGENT_REFERRAL">Agent Referral</option>
                <option value="PROPERTY24">Property24</option>
                <option value="PRIVATE_PROPERTY">Private Property</option>
                <option value="PHONE">Phone</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income (R)</label>
              <input type="number" value={form.monthlyIncome} onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">Create Lead</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.map((lead: any) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{lead.firstName} {lead.lastName}</p>
                  {lead.property && <p className="text-xs text-gray-500">{lead.property.name}</p>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {lead.email}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.phone}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{lead.source.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-gray-900">{lead.score || '-'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[lead.status] || 'bg-gray-100 text-gray-800'}`}>
                    {lead.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {lead.status === 'NEW' && (
                    <button onClick={() => handleStatusChange(lead.id, 'CONTACTED')} className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1">
                      Mark Contacted <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                  {lead.status === 'CONTACTED' && (
                    <button onClick={() => handleStatusChange(lead.id, 'QUALIFIED')} className="text-xs text-primary-600 hover:text-primary-800 font-medium flex items-center gap-1">
                      Qualify <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {leads.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <UserPlus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No leads found</p>
            <p className="text-sm">Create your first lead or adjust filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
