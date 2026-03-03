'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Plus, MapPin, Home } from 'lucide-react';
import { api } from '@/lib/api';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'APARTMENT_COMPLEX',
    addressLine1: '',
    suburb: '',
    city: '',
    province: 'Gauteng',
    postalCode: '',
    description: '',
  });

  const loadProperties = () => {
    api.getProperties()
      .then((res) => setProperties(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProperties(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProperty(form);
      setShowForm(false);
      setForm({ name: '', type: 'APARTMENT_COMPLEX', addressLine1: '', suburb: '', city: '', province: 'Gauteng', postalCode: '', description: '' });
      loadProperties();
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
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-500 mt-1">{properties.length} properties in your portfolio</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
          <Plus className="h-4 w-4" /> Add Property
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. Sandton Towers" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="APARTMENT_COMPLEX">Apartment Complex</option>
                <option value="TOWNHOUSE_COMPLEX">Townhouse Complex</option>
                <option value="MIXED_USE">Mixed Use</option>
                <option value="STUDENT_RESIDENCE">Student Residence</option>
                <option value="SINGLE_RESIDENTIAL">Single Residential</option>
                <option value="ESTATE">Estate</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input type="text" required value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Suburb</label>
              <input type="text" required value={form.suburb} onChange={(e) => setForm({ ...form, suburb: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input type="text" required value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">Create Property</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((property: any) => (
          <Link key={property.id} href={`/properties/${property.id}`} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary-50 p-2">
                <Building2 className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{property.name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {property.suburb}, {property.city}
                </p>
                <div className="flex items-center gap-3 mt-3 text-sm">
                  <span className="flex items-center gap-1 text-gray-600">
                    <Home className="h-3.5 w-3.5" />
                    {property._count?.units || 0} units
                  </span>
                  <span className="text-xs text-gray-400 capitalize">
                    {property.type.toLowerCase().replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {properties.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No properties yet</p>
            <p className="text-sm">Add your first property to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
