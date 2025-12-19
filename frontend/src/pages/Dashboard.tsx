import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { GigCard } from '../components/GigCard';
import { GigForm } from '../components/GigForm';
import { Gig, CreateGigData } from '../types';
import { gigsApi } from '../api/gigs';
import { getErrorMessage } from '../utils/error';

export const Dashboard = () => {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingGig, setEditingGig] = useState<Gig | undefined>();
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    fetchGigs();
  }, [filter]);

  const fetchGigs = async () => {
    try {
      setLoading(true);
      const filters = filter ? { status: filter } : undefined;
      const data = await gigsApi.getAll(filters);
      setGigs(data);
      setError('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch gigs'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (data: CreateGigData) => {
    try {
      if (editingGig) {
        await gigsApi.update(editingGig.id, data);
      } else {
        await gigsApi.create(data);
      }
      setShowForm(false);
      setEditingGig(undefined);
      fetchGigs();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Operation failed'));
    }
  };

  const handleEdit = (gig: Gig) => {
    setEditingGig(gig);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this gig?')) return;

    try {
      await gigsApi.delete(id);
      fetchGigs();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to delete gig'));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingGig(undefined);
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          My Gigs Dashboard
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
              onClick={() => setFilter('UPCOMING')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'UPCOMING'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Upcoming
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
            <button
              onClick={() => setFilter('CANCELLED')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'CANCELLED'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancelled
            </button>
          </div>
          <button
            onClick={() => {
              setEditingGig(undefined);
              setShowForm(true);
            }}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md font-medium"
          >
            + Add Gig
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingGig ? 'Edit Gig' : 'Create New Gig'}
            </h2>
            <GigForm
              gig={editingGig}
              onSubmit={handleCreateOrUpdate}
              onCancel={handleCancel}
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading gigs...</p>
          </div>
        ) : gigs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600 text-lg">
              No gigs found. Create your first gig!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gigs.map((gig) => (
              <GigCard
                key={gig.id}
                gig={gig}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
