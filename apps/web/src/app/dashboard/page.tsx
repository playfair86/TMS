'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  DoorOpen,
  Users,
  FileText,
  ScrollText,
  UserPlus,
  TrendingUp,
  Home,
} from 'lucide-react';
import { api } from '@/lib/api';

interface Stats {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  totalLeads: number;
  activeApplications: number;
  activeLeases: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDashboardStats(), api.getPipelineStats()])
      .then(([statsRes, pipelineRes]) => {
        setStats(statsRes.data);
        setPipeline(pipelineRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const statCards = stats
    ? [
        {
          name: 'Total Properties',
          value: stats.totalProperties,
          icon: Building2,
          color: 'text-blue-600 bg-blue-50',
        },
        {
          name: 'Total Units',
          value: stats.totalUnits,
          icon: Home,
          color: 'text-indigo-600 bg-indigo-50',
        },
        {
          name: 'Occupied Units',
          value: stats.occupiedUnits,
          icon: DoorOpen,
          color: 'text-green-600 bg-green-50',
        },
        {
          name: 'Vacant Units',
          value: stats.vacantUnits,
          icon: DoorOpen,
          color: 'text-orange-600 bg-orange-50',
        },
        {
          name: 'Occupancy Rate',
          value: `${stats.occupancyRate.toFixed(1)}%`,
          icon: TrendingUp,
          color: 'text-emerald-600 bg-emerald-50',
        },
        {
          name: 'Active Leads',
          value: stats.totalLeads,
          icon: UserPlus,
          color: 'text-purple-600 bg-purple-50',
        },
        {
          name: 'Active Applications',
          value: stats.activeApplications,
          icon: FileText,
          color: 'text-cyan-600 bg-cyan-50',
        },
        {
          name: 'Active Leases',
          value: stats.activeLeases,
          icon: ScrollText,
          color: 'text-teal-600 bg-teal-50',
        },
      ]
    : [];

  const pipelineStages = [
    { key: 'NEW', label: 'New', color: 'bg-gray-100 text-gray-800' },
    { key: 'CONTACTED', label: 'Contacted', color: 'bg-blue-100 text-blue-800' },
    { key: 'QUALIFIED', label: 'Qualified', color: 'bg-indigo-100 text-indigo-800' },
    { key: 'APPLIED', label: 'Applied', color: 'bg-purple-100 text-purple-800' },
    { key: 'SCREENED', label: 'Screened', color: 'bg-yellow-100 text-yellow-800' },
    { key: 'APPROVED', label: 'Approved', color: 'bg-green-100 text-green-800' },
    { key: 'LEASE_SIGNED', label: 'Lease Signed', color: 'bg-emerald-100 text-emerald-800' },
    { key: 'MOVED_IN', label: 'Moved In', color: 'bg-teal-100 text-teal-800' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your property portfolio</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lead Pipeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Lead Pipeline
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {pipelineStages.map((stage) => (
            <div
              key={stage.key}
              className="flex-1 min-w-[120px] rounded-lg border border-gray-200 p-4 text-center"
            >
              <div className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${stage.color} mb-2`}>
                {stage.label}
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {pipeline[stage.key] || 0}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
