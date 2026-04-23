'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/sidebar';
import { api } from '@/lib/api';
import { ArrowLeft, User, Home, Mail, Phone, ScrollText, CreditCard } from 'lucide-react';

const DEMO_TENANT_DETAILS: Record<string, any> = {
  'tenant-1': {
    id: 'tenant-1',
    user: { firstName: 'Thabo', lastName: 'Mokoena', email: 'thabo@example.co.za', phone: '+27 82 123 4567' },
    leases: [{
      id: 'lease-1', status: 'ACTIVE', monthlyRent: 12500, startDate: '2025-03-01', endDate: '2026-02-28',
      unit: { unitNumber: 'A101', property: { name: 'Sandton Central Apartments' } },
    }],
    payments: [
      { id: 'p1', amount: 12500, date: '2026-04-01', status: 'PAID', method: 'EFT' },
      { id: 'p2', amount: 12500, date: '2026-03-01', status: 'PAID', method: 'EFT' },
      { id: 'p3', amount: 12500, date: '2026-02-01', status: 'PAID', method: 'EFT' },
      { id: 'p4', amount: 12500, date: '2026-01-01', status: 'PAID', method: 'DEBIT_ORDER' },
    ],
  },
  'tenant-2': {
    id: 'tenant-2',
    user: { firstName: 'Lindiwe', lastName: 'Zulu', email: 'lindiwe@example.co.za', phone: '+27 83 234 5678' },
    leases: [{
      id: 'lease-2', status: 'ACTIVE', monthlyRent: 9800, startDate: '2025-06-01', endDate: '2026-05-31',
      unit: { unitNumber: 'RG-3', property: { name: 'Rosebank Garden Village' } },
    }],
    payments: [
      { id: 'p5', amount: 9800, date: '2026-04-01', status: 'PAID', method: 'EFT' },
      { id: 'p6', amount: 9800, date: '2026-03-01', status: 'PAID', method: 'EFT' },
      { id: 'p7', amount: 9800, date: '2026-02-01', status: 'LATE', method: 'EFT' },
    ],
  },
  'tenant-3': {
    id: 'tenant-3',
    user: { firstName: 'Priya', lastName: 'Naidoo', email: 'priya@example.co.za', phone: '+27 84 345 6789' },
    leases: [{
      id: 'lease-4', status: 'ACTIVE', monthlyRent: 15500, startDate: '2025-01-01', endDate: '2025-12-31',
      unit: { unitNumber: 'UR-5', property: { name: 'Umhlanga Ridge Estate' } },
    }],
    payments: [
      { id: 'p8', amount: 15500, date: '2026-04-01', status: 'PAID', method: 'DEBIT_ORDER' },
      { id: 'p9', amount: 15500, date: '2026-03-01', status: 'PAID', method: 'DEBIT_ORDER' },
    ],
  },
  'tenant-5': {
    id: 'tenant-5',
    user: { firstName: 'Fatima', lastName: 'Essop', email: 'fatima@example.co.za', phone: '+27 82 567 8901' },
    leases: [{
      id: 'lease-6', status: 'ACTIVE', monthlyRent: 22000, startDate: '2025-09-01', endDate: '2026-08-31',
      unit: { unitNumber: 'SP-1A', property: { name: 'Sea Point Residences' } },
    }],
    payments: [
      { id: 'p10', amount: 22000, date: '2026-04-01', status: 'PAID', method: 'EFT' },
      { id: 'p11', amount: 22000, date: '2026-03-01', status: 'PAID', method: 'EFT' },
    ],
  },
};

export default function TenantDetailPage() {
  const params = useParams();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getTenant(params.id as string);
        setTenant(res.data);
      } catch {
        setTenant(DEMO_TENANT_DETAILS[params.id as string] || DEMO_TENANT_DETAILS['tenant-1']);
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading || !tenant) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 p-8"><p className="text-gray-500">Loading...</p></main>
      </div>
    );
  }

  const activeLease = tenant.leases?.find((l: any) => l.status === 'ACTIVE');
  const payments = tenant.payments || [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <Link href="/tenants" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Tenants
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tenant.user?.firstName} {tenant.user?.lastName}</h1>
            <div className="flex items-center gap-4 text-gray-500 text-sm mt-1">
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {tenant.user?.email}</span>
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {tenant.user?.phone}</span>
            </div>
          </div>
        </div>

        {activeLease && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
              <ScrollText className="h-4 w-4" /> Active Lease
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Property</p>
                <p className="font-medium flex items-center gap-1"><Home className="h-4 w-4 text-gray-400" /> {activeLease.unit?.property?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unit</p>
                <p className="font-medium">{activeLease.unit?.unitNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Monthly Rent</p>
                <p className="font-medium">R {activeLease.monthlyRent?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Lease Period</p>
                <p className="font-medium">{new Date(activeLease.startDate).toLocaleDateString()} — {new Date(activeLease.endDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Payment History
          </h2>
          {payments.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment: any) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{new Date(payment.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">R {payment.amount?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{payment.method?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        payment.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400 text-sm">No payment records</p>
          )}
        </div>
      </main>
    </div>
  );
}
