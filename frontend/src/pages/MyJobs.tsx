import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { JobApplication } from '../types';
import { opportunitiesApi } from '../api/opportunities';
import { getErrorMessage } from '../utils/error';
import { formatDate } from '../utils/date';

export const MyJobs = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await opportunitiesApi.getMyApplications(filter || undefined);
      setApplications(data);
      setError('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch applications'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await opportunitiesApi.updateApplication(id, { status });
      fetchApplications();
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to update status'));
    }
  };

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          My Job Applications
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === ''
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'PENDING'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('ACCEPTED')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'ACCEPTED'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => setFilter('COMPLETED')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'COMPLETED'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 text-lg">
              No applications found. Check out the marketplace to find opportunities!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {app.opportunity.title}
                    </h3>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {app.opportunity.platform.name}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          statusColors[app.status as keyof typeof statusColors]
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {app.opportunity.location && (
                        <p>📍 {app.opportunity.location}</p>
                      )}
                      {app.opportunity.payRate && (
                        <p>💰 ${app.opportunity.payRate}</p>
                      )}
                      <p>📅 Applied {formatDate(app.appliedAt)}</p>
                      {app.completedAt && (
                        <p>✅ Completed {formatDate(app.completedAt)}</p>
                      )}
                    </div>
                  </div>

                  {app.payment && (
                    <div className="ml-4 bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-sm font-medium text-green-900 mb-1">
                        Payment
                      </p>
                      <p className="text-2xl font-bold text-green-700">
                        ${app.payment.amount}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {app.payment.status}
                      </p>
                      {app.payment.expectedDate && (
                        <p className="text-xs text-gray-600 mt-1">
                          Expected: {formatDate(app.payment.expectedDate)}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {app.notes && (
                  <p className="text-gray-700 mb-4 bg-gray-50 p-3 rounded">
                    {app.notes}
                  </p>
                )}

                <div className="flex space-x-2">
                  {app.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleStatusUpdate(app.id, 'COMPLETED')}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Mark Complete
                    </button>
                  )}
                  {(app.status === 'PENDING' || app.status === 'ACCEPTED') && (
                    <button
                      onClick={() => handleStatusUpdate(app.id, 'CANCELLED')}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
