'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  UserGroupIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Reminder {
  _id: string;
  title: string;
  dueDate: string;
  type: string;
  prospectId: string;
}

interface Activity {
  _id: string;
  title: string;
  createdAt: string;
  type: string;
  prospectId: string;
}

interface DashboardStats {
  totalProspects: number;
  pendingReminders: number;
  upcomingReminders: Reminder[];
  recentActivities: Activity[];
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalProspects: 0,
    pendingReminders: 0,
    upcomingReminders: [],
    recentActivities: [],
  });

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/salesperson/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const data = await response.json();
      setStats(prev => ({
        ...prev,
        ...data.stats,
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'salesperson')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) return null;

  const isDueSoon = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    return diff < 24 * 60 * 60 * 1000; // less than 24 hours
  };

  return (
    <div className="space-y-6 p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <UserGroupIcon className="h-12 w-12 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Prospects</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalProspects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center">
            <ClockIcon className="h-12 w-12 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingReminders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/salesperson/prospects')}
            className="px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            View All Prospects
          </button>
          <button
            onClick={() => router.push('/salesperson/prospects')}
            className="px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            Add New Prospect
          </button>
          
        </div>
      </div>

      {/* Reminders & Activities Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Reminders */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Upcoming Reminders</h2>
            <button className="text-sm text-blue-600 hover:text-blue-500">View all</button>
          </div>
          {stats.upcomingReminders.length === 0 ? (
            <p className="text-sm text-gray-500">No upcoming reminders.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {stats.upcomingReminders.map(reminder => (
                <li
                  key={reminder._id}
                  className="py-4 flex items-start justify-between hover:bg-gray-50 px-4 rounded-md transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{reminder.title}</p>
                    <p className="text-xs text-gray-500">{reminder.type}</p>
                    <time className="text-xs text-gray-400" dateTime={reminder.dueDate}>
                      {new Date(reminder.dueDate).toLocaleString()}
                    </time>
                  </div>
                  {isDueSoon(reminder.dueDate) && (
                    <span className="ml-4 inline-flex items-center text-xs font-medium bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                      Due Soon
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Activities</h2>
            <button className="text-sm text-blue-600 hover:text-blue-500">View all</button>
          </div>
          {stats.recentActivities.length === 0 ? (
            <p className="text-sm text-gray-500">No recent activities.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {stats.recentActivities.map(activity => (
                <li
                  key={activity._id}
                  className="py-4 px-4 flex justify-between hover:bg-gray-50 rounded-md transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.type}</p>
                    <time
                      className="text-xs text-gray-400"
                      dateTime={activity.createdAt}
                    >
                      {new Date(activity.createdAt).toLocaleString()}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
