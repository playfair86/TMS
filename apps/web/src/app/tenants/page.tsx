'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Mail, Phone, Home } from 'lucide-react';
import { api } from '@/lib/api';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    api.getTenants(params)
      .then((res) => setTenants(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-500 mt-1">Manage your tenant database</p>
        </div>
        <input
          type="search"
          placeholder="Search tenants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm w-64 focus:border-primary-500 focus:ring-primary-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenants.map((tenant: any) => (
          <Link key={tenant.id} href={`/tenants/${tenant.id}`} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                {tenant.user?.firstName?.[0]}{tenant.user?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {tenant.user?.firstName} {tenant.user?.lastName}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {tenant.user?.email}
                </p>
                {tenant.user?.phone && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {tenant.user?.phone}
                  </p>
                )}
                {tenant.leases?.[0] && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-2">
                    <Home className="h-3 w-3" />
                    {tenant.leases[0].unit?.property?.name} - Unit {tenant.leases[0].unit?.unitNumber}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}

        {tenants.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No tenants found</p>
          </div>
        )}
      </div>
    </div>
  );
}
