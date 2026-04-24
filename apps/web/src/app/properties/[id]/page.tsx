'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/sidebar';
import { api } from '@/lib/api';
import { Building2, MapPin, ArrowLeft, Home } from 'lucide-react';

const DEMO_UNITS: Record<string, any[]> = {
  'prop-1': [
    { id: 'u1', unitNumber: 'A101', type: 'TWO_BEDROOM', floor: 1, monthlyRent: 12500, status: 'OCCUPIED', bedrooms: 2, bathrooms: 1, sizeSqm: 65 },
    { id: 'u2', unitNumber: 'A102', type: 'ONE_BEDROOM', floor: 1, monthlyRent: 9500, status: 'VACANT', bedrooms: 1, bathrooms: 1, sizeSqm: 45 },
    { id: 'u3', unitNumber: 'A201', type: 'TWO_BEDROOM', floor: 2, monthlyRent: 13000, status: 'OCCUPIED', bedrooms: 2, bathrooms: 1, sizeSqm: 65 },
    { id: 'u4', unitNumber: 'A202', type: 'THREE_BEDROOM', floor: 2, monthlyRent: 16500, status: 'OCCUPIED', bedrooms: 3, bathrooms: 2, sizeSqm: 90 },
    { id: 'u5', unitNumber: 'A205', type: 'TWO_BEDROOM', floor: 2, monthlyRent: 14000, status: 'VACANT', bedrooms: 2, bathrooms: 1, sizeSqm: 68 },
    { id: 'u6', unitNumber: 'A308', type: 'STUDIO', floor: 3, monthlyRent: 7500, status: 'OCCUPIED', bedrooms: 0, bathrooms: 1, sizeSqm: 30 },
  ],
  'prop-2': [
    { id: 'u7', unitNumber: 'RG-1', type: 'TWO_BEDROOM', floor: 0, monthlyRent: 11000, status: 'OCCUPIED', bedrooms: 2, bathrooms: 1, sizeSqm: 75 },
    { id: 'u8', unitNumber: 'RG-3', type: 'TWO_BEDROOM', floor: 0, monthlyRent: 9800, status: 'OCCUPIED', bedrooms: 2, bathrooms: 1, sizeSqm: 72 },
    { id: 'u9', unitNumber: 'RG-7', type: 'THREE_BEDROOM', floor: 0, monthlyRent: 14500, status: 'VACANT', bedrooms: 3, bathrooms: 2, sizeSqm: 110 },
  ],
  'prop-3': [
    { id: 'u10', unitNumber: 'SP-1A', type: 'TWO_BEDROOM', floor: 1, monthlyRent: 22000, status: 'OCCUPIED', bedrooms: 2, bathrooms: 2, sizeSqm: 85 },
    { id: 'u11', unitNumber: 'SP-3B', type: 'THREE_BEDROOM', floor: 3, monthlyRent: 18000, status: 'VACANT', bedrooms: 3, bathrooms: 2, sizeSqm: 105 },
  ],
  'prop-4': [
    { id: 'u12', unitNumber: 'UR-5', type: 'TWO_BEDROOM', floor: 5, monthlyRent: 15500, status: 'OCCUPIED', bedrooms: 2, bathrooms: 2, sizeSqm: 78 },
    { id: 'u13', unitNumber: 'UR-12', type: 'ONE_BEDROOM', floor: 12, monthlyRent: 12000, status: 'VACANT', bedrooms: 1, bathrooms: 1, sizeSqm: 50 },
  ],
};

export default function PropertyDetailPage() {
  const params = useParams();
  const [property, setProperty] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getProperty(params.id as string);
        setProperty(res.data);
        const unitsRes = await api.getUnits({ propertyId: params.id as string });
        setUnits(unitsRes.data?.length ? unitsRes.data : DEMO_UNITS[params.id as string] || []);
      } catch {
        setUnits(DEMO_UNITS[params.id as string] || []);
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <p className="text-gray-500">Loading...</p>
        </main>
      </div>
    );
  }

  const occupied = units.filter(u => u.status === 'OCCUPIED').length;
  const vacant = units.filter(u => u.status === 'VACANT').length;
  const totalRent = units.reduce((sum, u) => sum + (u.monthlyRent || 0), 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <Link href="/properties" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Properties
        </Link>

        {property && (
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="h-7 w-7 text-primary-600" />
              {property.name}
            </h1>
            <p className="text-gray-500 flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {property.addressLine1}, {property.suburb}, {property.city}, {property.province}
            </p>
            {property.description && (
              <p className="text-gray-600 mt-2">{property.description}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Units</p>
            <p className="text-2xl font-bold text-gray-900">{units.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Occupied</p>
            <p className="text-2xl font-bold text-green-600">{occupied}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Vacant</p>
            <p className="text-2xl font-bold text-amber-600">{vacant}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Monthly Revenue</p>
            <p className="text-2xl font-bold text-gray-900">R {totalRent.toLocaleString()}</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">Units</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bed/Bath</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {units.map((unit) => (
                <tr key={unit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{unit.unitNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {unit.type?.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {unit.bedrooms} bed / {unit.bathrooms} bath
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {unit.sizeSqm} m²
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    R {unit.monthlyRent?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      unit.status === 'OCCUPIED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {unit.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
