'use client';

import { useEffect, useState } from 'react';
import { ScrollText, Calendar, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_SIGNATURE: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  RENEWED: 'bg-blue-100 text-blue-800',
  TERMINATED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-orange-100 text-orange-800',
};

export default function LeasesPage() {
  const [leases, setLeases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filter) params.status = filter;
    api.getLeases(params)
      .then((res) => setLeases(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leases</h1>
        <p className="text-gray-500 mt-1">Manage lease agreements</p>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter('')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${!filter ? 'bg-primary-100 text-primary-700' : 'bg-white border border-gray-200 text-gray-600'}`}>All</button>
        {['ACTIVE', 'DRAFT', 'PENDING_SIGNATURE', 'TERMINATED', 'EXPIRED'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === s ? 'bg-primary-100 text-primary-700' : 'bg-white border border-gray-200 text-gray-600'}`}>
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tenant</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Property / Unit</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Rent</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leases.map((lease: any) => (
              <tr key={lease.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {lease.tenant?.user?.firstName} {lease.tenant?.user?.lastName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {lease.unit?.property?.name} - Unit {lease.unit?.unitNumber}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="flex items-center gap-1 font-medium text-gray-900">
                    R {lease.monthlyRent?.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(lease.startDate).toLocaleDateString('en-ZA')}
                    {lease.endDate && ` - ${new Date(lease.endDate).toLocaleDateString('en-ZA')}`}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[lease.status] || 'bg-gray-100'}`}>
                    {lease.status.replace(/_/g, ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {leases.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <ScrollText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No leases found</p>
          </div>
        )}
      </div>
    </div>
  );
}
