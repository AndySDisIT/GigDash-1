import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { JobOpportunity } from '../types';
import { opportunitiesApi } from '../api/opportunities';
import { platformsApi } from '../api/platforms';
import { getErrorMessage } from '../utils/error';
import { formatDate } from '../utils/date';

export const Marketplace = () => {
  const [opportunities, setOpportunities] = useState<JobOpportunity[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [minPay, setMinPay] = useState('');
  const [maxPay, setMaxPay] = useState('');
  const [effortLevel, setEffortLevel] = useState('');
  const [platformId, setPlatformId] = useState('');

  useEffect(() => {
    fetchPlatforms();
    fetchOpportunities();
  }, []);

  const fetchPlatforms = async () => {
    try {
      const data = await platformsApi.getAll();
      setPlatforms(data);
    } catch (err: unknown) {
      console.error('Error fetching platforms:', err);
    }
  };

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const filters = {
        category: category || undefined,
        location: location || undefined,
        minPay: minPay ? parseFloat(minPay) : undefined,
        maxPay: maxPay ? parseFloat(maxPay) : undefined,
        effortLevel: effortLevel || undefined,
        platformId: platformId || undefined,
      };
      const data = await opportunitiesApi.getAll(filters);
      setOpportunities(data);
      setError('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch opportunities'));
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (id: string) => {
    try {
      await opportunitiesApi.apply(id);
      alert('Application submitted successfully!');
      fetchOpportunities(); // Refresh list
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to apply'));
    }
  };

  const effortColors = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800',
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Job Marketplace
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Categories</option>
                <option value="MYSTERY_SHOP">Mystery Shop</option>
                <option value="SECRET_SHOP">Secret Shop</option>
                <option value="DELIVERY">Delivery</option>
                <option value="MERCHANDISING">Merchandising</option>
                <option value="INVENTORY">Inventory</option>
                <option value="TASK">Task</option>
                <option value="SHIFT">Shift</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or ZIP"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platform
              </label>
              <select
                value={platformId}
                onChange={(e) => setPlatformId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Platforms</option>
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Pay ($)
              </label>
              <input
                type="number"
                value={minPay}
                onChange={(e) => setMinPay(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Pay ($)
              </label>
              <input
                type="number"
                value={maxPay}
                onChange={(e) => setMaxPay(e.target.value)}
                placeholder="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Effort Level
              </label>
              <select
                value={effortLevel}
                onChange={(e) => setEffortLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Any</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={fetchOpportunities}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Opportunities List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading opportunities...</p>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 text-lg">
              No opportunities found. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {opp.title}
                  </h3>
                  {opp.effortLevel && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        effortColors[opp.effortLevel as keyof typeof effortColors]
                      }`}
                    >
                      {opp.effortLevel}
                    </span>
                  )}
                </div>

                <div className="mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {opp.platform.name}
                  </span>
                </div>

                {opp.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {opp.description}
                  </p>
                )}

                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  {opp.location && <p>📍 {opp.location}</p>}
                  {opp.payRate && (
                    <p>💰 ${opp.payRate} {opp.payType && `(${opp.payType})`}</p>
                  )}
                  {opp.duration && <p>⏱️ {opp.duration}</p>}
                  <p>📅 Posted {formatDate(opp.postedAt)}</p>
                </div>

                <button
                  onClick={() => handleApply(opp.id)}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md font-medium"
                >
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
