import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { dashboardService } from '../services/api';
import { FileText, TrendingUp, Clock, AlertCircle } from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, subtitle }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-700">{value}</p>
        {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
      </div>
      <div className="p-3 rounded-full bg-primary-100 text-primary">
        <Icon size={24} />
      </div>
    </div>
  </div>
);

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getStats();
      setStats(response.data);
    } catch (err) {
      setError('Failed to load dashboard stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container-max py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-700">Dashboard</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 border-primary"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={FileText}
              title="Total Invoices"
              value={stats.total_invoices}
              subtitle="All time"
            />
            <StatCard
              icon={TrendingUp}
              title="This Month"
              value={stats.invoices_this_month}
              subtitle={`Total: $${stats.total_amount_month?.toFixed(2)}`}
            />
            <StatCard
              icon={AlertCircle}
              title="Pending"
              value={stats.invoices_pending}
              subtitle="Awaiting processing"
            />
            <StatCard
              icon={Clock}
              title="Last Processed"
              value={
                stats.last_processed_date
                  ? new Date(stats.last_processed_date).toLocaleDateString()
                  : 'N/A'
              }
              subtitle="Invoice date"
            />
          </div>
        ) : null}

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-700">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/invoices/upload"
              className="text-white font-medium py-3 px-6 rounded-lg transition text-center bg-primary hover:opacity-90"
            >
              Upload Invoice
            </a>
            <a
              href="/invoices"
              className="font-medium py-3 px-6 rounded-lg transition text-center bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              View All Invoices
            </a>
            <button className="font-medium py-3 px-6 rounded-lg transition bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Export Report
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
