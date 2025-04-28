'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface LayoutProps {
  children: React.ReactElement;
  params: Promise<{ id: string }>;
}

export default function ProspectLayout({ 
  children,
  params
}: LayoutProps) {
  const pathname = usePathname();
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;

  const tabs = [
    { name: 'Details', href: `/salesperson/prospects/${id}/details` },
    { name: 'Members', href: `/salesperson/prospects/${id}/members` },
    { name: 'Reminders', href: `/salesperson/prospects/${id}/reminders` },
    { name: 'Activities', href: `/salesperson/prospects/${id}/activities` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end mb-8">
          <Link
            href="/salesperson/prospects"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Prospects
          </Link>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-8">
              {tabs.map((tab) => (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={classNames(
                    'py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                    pathname === tab.href
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  {tab.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 