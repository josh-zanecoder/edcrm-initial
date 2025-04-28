'use client';

import React, { useState, useEffect } from 'react';
import { Reminder, ReminderType, ReminderStatus } from '@/types/reminder';
import AddEditReminderModal from '@/components/salesperson/AddEditReminderModal';
import { 
  BellIcon, 
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

function getStatusColor(status: ReminderStatus) {
  switch (status) {
    case ReminderStatus.SENT:
      return 'bg-green-50 text-green-700';
    case ReminderStatus.CANCELLED:
      return 'bg-red-50 text-red-700';
    default:
      return 'bg-yellow-50 text-yellow-700';
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RemindersPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const fetchReminders = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await fetch(`/api/prospects/${id}/reminders`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch reminders');
      }
      const remindersData = await response.json();
      setReminders(remindersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReminders();
    }
  }, [id]);

  const handleAddReminder = async (reminder: Omit<Reminder, '_id' | 'createdAt' | 'updatedAt' | 'addedBy'>) => {
    try {
      const response = await fetch(`/api/prospects/${id}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reminder,
          dueDate: reminder.dueDate.toISOString()
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add reminder');
      }
      setIsModalOpen(false);
      toast.success('Reminder added successfully');
      await fetchReminders();
    } catch (err) {
      console.error('Error adding reminder:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add reminder');
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      const response = await fetch(`/api/prospects/${id}/reminders/${reminderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete reminder');
      }

      setReminders(prevReminders => prevReminders.filter(reminder => reminder._id !== reminderId));
      toast.success('Reminder removed successfully');
    } catch (err) {
      console.error('Error deleting reminder:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete reminder');
      fetchReminders();
    }
  };

  const handleEditClick = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsEditModalOpen(true);
  };

  const handleEditReminder = async (reminder: Omit<Reminder, '_id' | 'createdAt' | 'updatedAt' | 'addedBy'>) => {
    if (!editingReminder) return;
    try {
      const { prospectId: _prospectId, ...updateData } = reminder;

      const response = await fetch(`/api/prospects/${id}/reminders/${editingReminder._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updateData,
          dueDate: updateData.dueDate.toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update reminder');
      }

      setIsEditModalOpen(false);
      setEditingReminder(null);
      toast.success('Reminder updated successfully');
      await fetchReminders();
    } catch (err) {
      console.error('Error updating reminder:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update reminder');
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Reminders</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={fetchReminders}
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
            <BellIcon className="h-7 w-7 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-900">Reminders</h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 text-base font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
          >
            Add Reminder
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reminders.map((reminder) => (
          <div key={reminder._id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {reminder.title}
                </h3>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reminder.status)} mt-2`}>
                  {reminder.status}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteReminder(reminder._id)}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleEditClick(reminder)}
                  className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-gray-500">
                <ClockIcon className="h-5 w-5 mr-2" />
                <span>Due: {formatDate(reminder.dueDate)}</span>
              </div>
              {reminder.completedAt && (
                <div className="flex items-center text-gray-500">
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" />
                  <span>Completed: {formatDate(reminder.completedAt)}</span>
                </div>
              )}
              <p className="text-gray-600 mt-2">
                {reminder.description}
              </p>
            </div>
          </div>
        ))}

        {reminders.length === 0 && (
          <div className="col-span-full bg-gray-50 rounded-2xl p-12 text-center">
            <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No reminders</h3>
            <p className="mt-1 text-gray-500">Get started by adding a new reminder.</p>
            <div className="mt-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Reminder
              </button>
            </div>
          </div>
        )}
      </div>

      <AddEditReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddReminder}
        prospectId={id}
      />

      <AddEditReminderModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingReminder(null); }}
        onSave={handleEditReminder}
        prospectId={id}
        initialData={editingReminder || undefined}
        mode="edit"
      />
    </div>
  );
} 