import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { GlassCard } from '../components/ui/GlassCard';
import { StatCard, StatGrid } from '../components/ui/StatCard';
import { GigCard } from '../components/GigCard';
import { Gig } from '../types';
import { gigsApi } from '../api/gigs';
import { getErrorMessage } from '../utils/error';

export const DashboardGodTier: React.FC = () => {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    try {
      setLoading(true);
      const data = await gigsApi.getAll();
      setGigs(data);
      setError('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch gigs'));
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const upcomingGigs = gigs.filter(g => g.status === 'UPCOMING');
  const completedGigs = gigs.filter(g => g.status === 'COMPLETED');
  const totalValue = gigs.reduce((sum, gig) => sum + (gig.payment || 0), 0);
  const avgPayment = gigs.length > 0 ? totalValue / gigs.length : 0;
  const completionRate = gigs.length > 0 ? (completedGigs.length / gigs.length) * 100 : 0;
  
  // Get this week's earnings (mock for now)
  const thisWeekEarnings = completedGigs
    .filter(g => {
      const gigDate = new Date(g.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return gigDate >= weekAgo;
    })
    .reduce((sum, gig) => sum + (gig.payment || 0), 0);

  const statsData = [
    {
      title: 'Available Gigs',
      value: upcomingGigs.length,
      change: 12.5,
      trend: 'up' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      iconBg: 'primary' as const,
    },
    {
      title: 'Total Value',
      value: `$${totalValue.toLocaleString()}`,
      change: 8.3,
      trend: 'up' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'success' as const,
    },
    {
      title: 'Avg Payment',
      value: `$${avgPayment.toFixed(0)}`,
      change: 5.2,
      trend: 'up' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      iconBg: 'info' as const,
    },
    {
      title: 'Completion Rate',
      value: `${completionRate.toFixed(1)}%`,
      change: completionRate > 80 ? 2.1 : -1.5,
      trend: completionRate > 80 ? ('up' as const) : ('down' as const),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: completionRate > 80 ? ('success' as const) : ('warning' as const),
    },
    {
      title: 'This Week',
      value: `$${thisWeekEarnings.toLocaleString()}`,
      change: 15.7,
      trend: 'up' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      iconBg: 'success' as const,
    },
    {
      title: 'Completed',
      value: completedGigs.length,
      change: 10.4,
      trend: 'up' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      iconBg: 'primary' as const,
    },
  ];

  return (
    <Layout>
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10 gradient-animated grid-overlay" />

      <div className="relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="glass-card-strong p-6 sticky top-0 z-10 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 text-gradient">
                  GigDash Command Center
                </h1>
                <p className="text-gray-300">
                  Your ultimate gig management dashboard
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-gradient px-6 py-3 text-lg"
              >
                + Create Gig
              </motion.button>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card-strong border-red-500/50 p-4 mb-6"
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-400">{error}</span>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <StatGrid columns={3}>
            {statsData.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <StatCard
                  {...stat}
                  loading={loading}
                  animateValue={!loading}
                />
              </motion.div>
            ))}
          </StatGrid>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Browse Gigs', icon: '🔍', color: 'primary' },
                { label: 'My Routes', icon: '🗺️', color: 'success' },
                { label: 'Payments', icon: '💰', color: 'warning' },
                { label: 'Platforms', icon: '🔗', color: 'info' },
              ].map((action, index) => (
                <motion.button
                  key={action.label}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`glass-card-hover p-4 text-center transition-smooth`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-3xl mb-2">{action.icon}</div>
                  <div className="text-sm text-white font-medium">{action.label}</div>
                </motion.button>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Gigs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Recent Gigs
            </h2>
            <div className="flex space-x-2">
              {['All', 'Upcoming', 'Completed'].map((filter) => (
                <motion.button
                  key={filter}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="glass-card px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-smooth"
                >
                  {filter}
                </motion.button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-white/10 rounded mb-4 w-3/4"></div>
                    <div className="h-4 bg-white/10 rounded mb-2 w-1/2"></div>
                    <div className="h-4 bg-white/10 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : gigs.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-white mb-2">No gigs yet</h3>
              <p className="text-gray-300 mb-6">Create your first gig to get started!</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-gradient px-8 py-3"
              >
                Create First Gig
              </motion.button>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gigs.slice(0, 6).map((gig, index) => (
                <motion.div
                  key={gig.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <GlassCard
                    hover
                    className="p-6"
                    gradient={
                      gig.status === 'UPCOMING' ? 'primary' :
                      gig.status === 'COMPLETED' ? 'success' : 'none'
                    }
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">{gig.title}</h3>
                      <span className={`badge badge-${
                        gig.status === 'UPCOMING' ? 'primary' :
                        gig.status === 'COMPLETED' ? 'success' : 'glass'
                      }`}>
                        {gig.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {gig.venue}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(gig.date).toLocaleDateString()}
                      </div>
                      {gig.payment && (
                        <div className="flex items-center text-green-400 font-semibold">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          ${gig.payment.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};
