'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/sidebar';
import { api } from '@/lib/api';
import { ArrowLeft, FileText, User, Building2, Shield, CheckCircle, XCircle, Clock } from 'lucide-react';

const DEMO_DETAILS: Record<string, any> = {
  'app-1': {
    id: 'app-1', firstName: 'Thabo', lastName: 'Mokoena', email: 'thabo@example.co.za', phone: '+27 82 123 4567',
    idNumber: '9001015800089', status: 'APPROVED', employmentStatus: 'EMPLOYED', employer: 'Standard Bank',
    monthlyIncome: 45000, currentAddress: '12 Main Road, Braamfontein, Johannesburg',
    unit: { unitNumber: 'A101', monthlyRent: 12500, property: { name: 'Sandton Central Apartments' } },
    screeningChecks: [
      { type: 'IDENTITY_VERIFICATION', status: 'COMPLETED', result: { passed: true, score: 100 } },
      { type: 'CREDIT_CHECK', status: 'COMPLETED', result: { passed: true, score: 720, provider: 'TransUnion' } },
      { type: 'AFFORDABILITY', status: 'COMPLETED', result: { passed: true, ratio: 0.28 } },
      { type: 'CRIMINAL_RECORD', status: 'COMPLETED', result: { passed: true } },
      { type: 'EMPLOYMENT_VERIFICATION', status: 'COMPLETED', result: { passed: true, verified: true } },
    ],
    consents: [
      { type: 'POPIA_CONSENT', granted: true, grantedAt: '2026-03-15T10:00:00Z' },
      { type: 'CREDIT_CHECK_CONSENT', granted: true, grantedAt: '2026-03-15T10:00:00Z' },
    ],
  },
  'app-2': {
    id: 'app-2', firstName: 'Pieter', lastName: 'van der Merwe', email: 'pieter@example.co.za', phone: '+27 84 345 6789',
    idNumber: '8805125800087', status: 'SCREENING_IN_PROGRESS', employmentStatus: 'EMPLOYED', employer: 'Discovery Health',
    monthlyIncome: 55000, currentAddress: '88 Long Street, Cape Town',
    unit: { unitNumber: 'SP-3B', monthlyRent: 18000, property: { name: 'Sea Point Residences' } },
    screeningChecks: [
      { type: 'IDENTITY_VERIFICATION', status: 'COMPLETED', result: { passed: true, score: 100 } },
      { type: 'CREDIT_CHECK', status: 'COMPLETED', result: { passed: true, score: 695, provider: 'TransUnion' } },
      { type: 'AFFORDABILITY', status: 'IN_PROGRESS', result: null },
    ],
    consents: [
      { type: 'POPIA_CONSENT', granted: true, grantedAt: '2026-04-10T14:30:00Z' },
    ],
  },
  'app-3': {
    id: 'app-3', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@example.co.za', phone: '+27 82 567 8901',
    idNumber: '9203245800085', status: 'SUBMITTED', employmentStatus: 'SELF_EMPLOYED', employer: 'Johnson Consulting',
    monthlyIncome: 62000, currentAddress: '45 Umhlanga Rocks Drive, Durban',
    unit: { unitNumber: 'UR-12', monthlyRent: 15500, property: { name: 'Umhlanga Ridge Estate' } },
    screeningChecks: [],
    consents: [
      { type: 'POPIA_CONSENT', granted: true, grantedAt: '2026-04-20T09:15:00Z' },
    ],
  },
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-purple-100 text-purple-700',
  SCREENING_IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  DECLINED: 'bg-red-100 text-red-700',
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getApplication(params.id as string);
        setApp(res.data);
      } catch {
        setApp(DEMO_DETAILS[params.id as string] || DEMO_DETAILS['app-1']);
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading || !app) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 p-8"><p className="text-gray-500">Loading...</p></main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <Link href="/applications" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Applications
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{app.firstName} {app.lastName}</h1>
            <p className="text-gray-500">{app.email} &middot; {app.phone}</p>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusColors[app.status] || 'bg-gray-100 text-gray-700'}`}>
            {app.status?.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
              <User className="h-4 w-4" /> Personal Details
            </h2>
            <dl className="space-y-3">
              <div className="flex justify-between"><dt className="text-gray-500">ID Number</dt><dd className="font-medium">{app.idNumber}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Employment</dt><dd className="font-medium">{app.employmentStatus?.replace(/_/g, ' ')}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Employer</dt><dd className="font-medium">{app.employer}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Monthly Income</dt><dd className="font-medium">R {app.monthlyIncome?.toLocaleString()}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Current Address</dt><dd className="font-medium text-right max-w-[200px]">{app.currentAddress}</dd></div>
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Applying For
            </h2>
            <dl className="space-y-3">
              <div className="flex justify-between"><dt className="text-gray-500">Property</dt><dd className="font-medium">{app.unit?.property?.name}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Unit</dt><dd className="font-medium">{app.unit?.unitNumber}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Monthly Rent</dt><dd className="font-medium">R {app.unit?.monthlyRent?.toLocaleString()}</dd></div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Affordability Ratio</dt>
                <dd className="font-medium">
                  {app.monthlyIncome ? `${((app.unit?.monthlyRent / app.monthlyIncome) * 100).toFixed(0)}%` : 'N/A'}
                  {app.monthlyIncome && app.unit?.monthlyRent / app.monthlyIncome <= 0.33 && (
                    <span className="ml-2 text-green-600 text-xs">Passes</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4" /> Screening Checks
          </h2>
          {app.screeningChecks?.length > 0 ? (
            <div className="space-y-3">
              {app.screeningChecks.map((check: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    {check.status === 'COMPLETED' && check.result?.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : check.status === 'COMPLETED' && !check.result?.passed ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    )}
                    <span className="font-medium text-gray-900">{check.type?.replace(/_/g, ' ')}</span>
                  </div>
                  <span className={`text-sm ${check.status === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {check.status === 'COMPLETED' ? (check.result?.passed ? 'Passed' : 'Failed') : 'In Progress'}
                    {check.result?.score && ` (${check.result.score})`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No screening checks initiated yet</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4" /> POPIA Consents
          </h2>
          {app.consents?.length > 0 ? (
            <div className="space-y-2">
              {app.consents.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <span className="text-gray-700">{c.type?.replace(/_/g, ' ')}</span>
                  <span className={`text-sm ${c.granted ? 'text-green-600' : 'text-red-600'}`}>
                    {c.granted ? 'Granted' : 'Denied'} — {new Date(c.grantedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No consents recorded</p>
          )}
        </div>
      </main>
    </div>
  );
}
