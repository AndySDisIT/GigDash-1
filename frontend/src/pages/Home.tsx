import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-white mb-6">
            Welcome to GigDash
          </h1>
          <p className="text-xl text-primary-100 mb-12 max-w-2xl mx-auto">
            The ultimate gig aggregator platform. Discover opportunities from multiple platforms,
            manage your applications, track payments, and optimize your routes—all in one place.
          </p>
          <div className="flex justify-center space-x-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-primary-50 transition"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-primary-50 transition"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="bg-primary-600 text-white border-2 border-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-primary-700 transition"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6 text-white">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Discover Opportunities</h3>
            <p className="text-primary-100">
              Browse gigs from DoorDash, Amazon Flex, Mystery Shopping, and 10+ more platforms in one place.
            </p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6 text-white">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-2">Track Payments</h3>
            <p className="text-primary-100">
              Manage payment schedules from each platform and never miss an expected payment.
            </p>
          </div>
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6 text-white">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold mb-2">Optimize Routes</h3>
            <p className="text-primary-100">
              Smart route planning to help you complete more jobs efficiently and maximize earnings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
