import { Gig } from '../types';
import { formatDate } from '../utils/date';

interface GigCardProps {
  gig: Gig;
  onEdit: (gig: Gig) => void;
  onDelete: (id: string) => void;
}

export const GigCard = ({ gig, onEdit, onDelete }: GigCardProps) => {
  const statusColors = {
    UPCOMING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {gig.title}
          </h3>
          <p className="text-gray-600 mb-2">📍 {gig.venue}</p>
          <p className="text-gray-600 mb-2">📅 {formatDate(gig.date)}</p>
          {gig.payment && (
            <p className="text-gray-600 mb-2">💰 ${gig.payment}</p>
          )}
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            statusColors[gig.status]
          }`}
        >
          {gig.status}
        </span>
      </div>
      {gig.description && (
        <p className="text-gray-700 mb-4">{gig.description}</p>
      )}
      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(gig)}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(gig.id)}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  );
};
