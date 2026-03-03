'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

const statusConfig: Record<string, { color: string; icon: any }> = {
  DRAFT: { color: 'bg-gray-100 text-gray-800', icon: Clock },
  SUBMITTED: { color: 'bg-blue-100 text-blue-800', icon: Clock },
  DOCUMENTS_PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  UNDER_REVIEW: { color: 'bg-indigo-100 text-indigo-800', icon: Clock },
  SCREENING_IN_PROGRESS: { color: 'bg-purple-100 text-purple-800', icon: Clock },
  SCREENING_COMPLETE: { color: 'bg-cyan-100 text-cyan-800', icon: CheckCircle },
  APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CONDITIONALLY_APPROVED: { color: 'bg-lime-100 text-lime-800', icon: AlertTriangle },
  DECLINED: { color: 'bg-red-100 text-red-800', icon: XCircle },
  WITHDRAWN: { color: 'bg-gray-100 text-gray-600', icon: XCircle },
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filter) params.status = filter;
    api.getApplications(params)
      .then((res) => setApplications(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-500 mt-1">Review and manage tenant applications</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button onClick={() => setFilter('')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!filter ? 'bg-primary-100 text-primary-700' : 'bg-white border border-gray-200 text-gray-600'}`}>All</button>
        {['SUBMITTED', 'UNDER_REVIEW', 'SCREENING_IN_PROGRESS', 'SCREENING_COMPLETE', 'APPROVED', 'DECLINED'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === s ? 'bg-primary-100 text-primary-700' : 'bg-white border border-gray-200 text-gray-600'}`}>
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {applications.map((app: any) => {
          const config = statusConfig[app.status] || statusConfig.DRAFT;
          const StatusIcon = config.icon;
          return (
            <Link key={app.id} href={`/applications/${app.id}`} className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-indigo-50 p-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{app.firstName} {app.lastName}</h3>
                    <p className="text-sm text-gray-500">
                      {app.unit?.property?.name} - Unit {app.unit?.unitNumber} | R {app.unit?.monthlyRent?.toLocaleString()}/mo
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm text-gray-500">
                    <p>{app._count?.documents || 0} docs</p>
                    <p>{app._count?.screeningChecks || 0} checks</p>
                  </div>
                  <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.color}`}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {app.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}

        {applications.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No applications found</p>
            <p className="text-sm">Applications will appear here when leads apply</p>
          </div>
        )}
      </div>
    </div>
  );
}
