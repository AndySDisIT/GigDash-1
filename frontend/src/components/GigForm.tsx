import { useForm } from 'react-hook-form';
import { Gig, CreateGigData } from '../types';
import { formatDateForInput } from '../utils/date';

interface GigFormProps {
  gig?: Gig;
  onSubmit: (data: CreateGigData) => void;
  onCancel: () => void;
}

export const GigForm = ({ gig, onSubmit, onCancel }: GigFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateGigData>({
    defaultValues: gig
      ? {
          title: gig.title,
          description: gig.description || '',
          venue: gig.venue,
          date: formatDateForInput(gig.date),
          payment: gig.payment || undefined,
          status: gig.status,
        }
      : {
          status: 'UPCOMING',
        },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          {...register('title', { required: 'Title is required' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Venue *
        </label>
        <input
          type="text"
          {...register('venue', { required: 'Venue is required' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {errors.venue && (
          <p className="text-red-500 text-sm mt-1">{errors.venue.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date *
        </label>
        <input
          type="datetime-local"
          {...register('date', { required: 'Date is required' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {errors.date && (
          <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Payment ($)
        </label>
        <input
          type="number"
          step="0.01"
          {...register('payment', { valueAsNumber: true })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          {...register('status')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="UPCOMING">Upcoming</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="flex space-x-2">
        <button
          type="submit"
          className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md font-medium"
        >
          {gig ? 'Update' : 'Create'} Gig
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
