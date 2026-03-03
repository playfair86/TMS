'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Home,
  FileText,
  ScrollText,
  Upload,
  CreditCard,
  LogOut,
  Building2,
  Calendar,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function TenantDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getProfile().catch(() => null),
      api.request<any>('/tenants/me').catch(() => null),
    ])
      .then(([profileRes, tenantRes]) => {
        setProfile(profileRes?.data);
        setTenant(tenantRes?.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const activeLease = tenant?.leases?.[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-7 w-7 text-primary-600" />
            <span className="text-lg font-bold text-gray-900">Tenant Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {profile?.firstName} {profile?.lastName}
            </span>
            <button
              onClick={() => { api.logout(); window.location.href = '/login'; }}
              className="text-gray-400 hover:text-gray-600"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {profile?.firstName}
          </h1>
          <p className="text-gray-500 mt-1">Manage your tenancy from one place</p>
        </div>

        {/* Active Lease Card */}
        {activeLease && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Current Lease</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Property</p>
                <p className="font-medium text-gray-900">
                  {activeLease.unit?.property?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unit</p>
                <p className="font-medium text-gray-900">
                  {activeLease.unit?.unitNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Monthly Rent</p>
                <p className="font-medium text-gray-900">
                  R {activeLease.monthlyRent?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Lease Period</p>
                <p className="font-medium text-gray-900 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(activeLease.startDate).toLocaleDateString('en-ZA')}
                  {activeLease.endDate && ` - ${new Date(activeLease.endDate).toLocaleDateString('en-ZA')}`}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                activeLease.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {activeLease.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/apply" className="bg-white rounded-xl border border-gray-200 p-5 text-center hover:shadow-md transition-shadow">
            <FileText className="h-8 w-8 text-primary-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Apply</p>
            <p className="text-xs text-gray-500 mt-1">Start new application</p>
          </Link>
          <Link href="/lease" className="bg-white rounded-xl border border-gray-200 p-5 text-center hover:shadow-md transition-shadow">
            <ScrollText className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">My Lease</p>
            <p className="text-xs text-gray-500 mt-1">View & sign lease</p>
          </Link>
          <Link href="/documents" className="bg-white rounded-xl border border-gray-200 p-5 text-center hover:shadow-md transition-shadow">
            <Upload className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Documents</p>
            <p className="text-xs text-gray-500 mt-1">Upload & manage</p>
          </Link>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center opacity-50">
            <CreditCard className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">Payments</p>
            <p className="text-xs text-gray-500 mt-1">Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
