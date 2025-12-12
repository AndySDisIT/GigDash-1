import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Platform, UserPlatformAccount } from '../types';
import { platformsApi } from '../api/platforms';
import { getErrorMessage } from '../utils/error';

export const Platforms = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [myPlatforms, setMyPlatforms] = useState<UserPlatformAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allPlatforms, connectedPlatforms] = await Promise.all([
        platformsApi.getAll(),
        platformsApi.getMyPlatforms(),
      ]);
      setPlatforms(allPlatforms);
      setMyPlatforms(connectedPlatforms);
      setError('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch platforms'));
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platformId: string) => {
    const username = prompt('Enter your username for this platform (optional):');
    try {
      await platformsApi.connect({ platformId, username: username || undefined });
      fetchData();
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to connect platform'));
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!window.confirm('Are you sure you want to disconnect this platform?')) return;
    try {
      await platformsApi.disconnect(id);
      fetchData();
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to disconnect platform'));
    }
  };

  const isConnected = (platformId: string) => {
    return myPlatforms.some((mp) => mp.platformId === platformId && mp.status === 'CONNECTED');
  };

  const categoryColors: { [key: string]: string } = {
    MYSTERY_SHOPPING: 'bg-purple-100 text-purple-800',
    DELIVERY: 'bg-blue-100 text-blue-800',
    RIDESHARE: 'bg-green-100 text-green-800',
    MERCHANDISING: 'bg-yellow-100 text-yellow-800',
    TASK_BASED: 'bg-pink-100 text-pink-800',
    INVENTORY: 'bg-indigo-100 text-indigo-800',
    OTHER: 'bg-gray-100 text-gray-800',
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Gig Platforms
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Connected Platforms */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Connected Platforms ({myPlatforms.length})
          </h2>
          {myPlatforms.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-600">
                No platforms connected yet. Connect platforms below to start receiving opportunities!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myPlatforms.map((account) => (
                <div
                  key={account.id}
                  className="bg-white rounded-lg shadow-md p-6 border-2 border-green-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {account.platform.name}
                    </h3>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Connected
                    </span>
                  </div>

                  {account.username && (
                    <p className="text-sm text-gray-600 mb-2">
                      Username: {account.username}
                    </p>
                  )}

                  <button
                    onClick={() => handleDisconnect(account.id)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium mt-3"
                  >
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Platforms */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Available Platforms
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Loading platforms...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {platforms.map((platform) => {
                const connected = isConnected(platform.id);
                return (
                  <div
                    key={platform.id}
                    className={`bg-white rounded-lg shadow-md p-6 ${
                      connected ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {platform.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          categoryColors[platform.category] || categoryColors.OTHER
                        }`}
                      >
                        {platform.category.replace('_', ' ')}
                      </span>
                    </div>

                    {platform.description && (
                      <p className="text-gray-600 text-sm mb-4">
                        {platform.description}
                      </p>
                    )}

                    {platform.signupUrl && !connected && (
                      <a
                        href={platform.signupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 text-sm mb-3 block"
                      >
                        Sign up on their website →
                      </a>
                    )}

                    <button
                      onClick={() => handleConnect(platform.id)}
                      disabled={connected}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                        connected
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-primary-500 hover:bg-primary-600 text-white'
                      }`}
                    >
                      {connected ? 'Already Connected' : 'Connect Platform'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
