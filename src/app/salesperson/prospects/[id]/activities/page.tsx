'use client';

import React, { useState, useEffect } from 'react';
import { Activity, ActivityStatus } from '@/types/activity';
import AddEditActivityModal from '@/components/salesperson/AddEditActivityModal';
import { 
  CalendarIcon, 
  ClockIcon, 
  CheckCircleIcon,
  TrashIcon,
  PencilIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

function formatDate(date: Date | string) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getStatusColor(status: ActivityStatus) {
  switch (status) {
    case ActivityStatus.COMPLETED:
      return 'bg-green-50 text-green-700';
    case ActivityStatus.IN_PROGRESS:
      return 'bg-blue-50 text-blue-700';
    case ActivityStatus.CANCELLED:
      return 'bg-red-50 text-red-700';
    default:
      return 'bg-yellow-50 text-yellow-700';
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ActivitiesPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const fetchActivities = React.useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await fetch(`/api/prospects/${id}/activities`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch activities');
      }
      const activitiesData = await response.json();
      setActivities(activitiesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchActivities();
    }
  }, [id, fetchActivities]);

  const handleAddActivity = async (activity: Omit<Activity, '_id' | 'createdAt' | 'updatedAt' | 'addedBy'>) => {
    try {
      const response = await fetch(`/api/prospects/${id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...activity,
          dueDate: activity.dueDate.toISOString()
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add activity');
      }
      setIsModalOpen(false);
      toast.success('Activity added successfully');
      await fetchActivities();
    } catch (err) {
      console.error('Error adding activity:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add activity');
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    try {
      const response = await fetch(`/api/prospects/${id}/activities/${activityId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete activity');
      }

      setActivities(prevActivities => prevActivities.filter(activity => activity._id !== activityId));
      toast.success('Activity removed successfully');
    } catch (err) {
      console.error('Error deleting activity:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete activity');
      fetchActivities();
    }
  };

  const handleEditClick = (activity: Activity) => {
    setEditingActivity(activity);
    setIsEditModalOpen(true);
  };

  const handleEditActivity = async (activity: Omit<Activity, '_id' | 'createdAt' | 'updatedAt' | 'addedBy'>) => {
    if (!editingActivity) return;
    try {
      const response = await fetch(`/api/prospects/${id}/activities/${editingActivity._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...activity,
          dueDate: activity.dueDate.toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update activity');
      }

      setIsEditModalOpen(false);
      setEditingActivity(null);
      toast.success('Activity updated successfully');
      await fetchActivities();
    } catch (err) {
      console.error('Error updating activity:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update activity');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <ExclamationCircleIcon className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Activities</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={fetchActivities}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-7 w-7 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-900">Activities</h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 text-base font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
          >
            Add Activity
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity) => (
          <div key={activity._id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {activity.title}
                </h3>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(activity.status)} mt-2`}>
                  {activity.status}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteActivity(activity._id)}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleEditClick(activity)}
                  className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-gray-500">
                <ClockIcon className="h-5 w-5 mr-2" />
                <span>Due: {formatDate(activity.dueDate)}</span>
              </div>
              {activity.completedAt && (
                <div className="flex items-center text-gray-500">
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" />
                  <span>Completed: {formatDate(activity.completedAt)}</span>
                </div>
              )}
              <p className="text-gray-600 mt-2">
                {activity.description}
              </p>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="col-span-full bg-gray-50 rounded-2xl p-12 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No activities</h3>
            <p className="mt-1 text-gray-500">Get started by adding a new activity.</p>
            <div className="mt-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Activity
              </button>
            </div>
          </div>
        )}
      </div>

      <AddEditActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddActivity}
        prospectId={id}
      />

      <AddEditActivityModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingActivity(null); }}
        onSave={handleEditActivity}
        prospectId={id}
        initialData={editingActivity || undefined}
        mode="edit"
      />
    </div>
  );
}
