'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Prospect } from '@/types/prospect';
import AddProspectModal from '@/components/salesperson/AddProspectModal';
import { formatAddress, formatPhoneNumber, formatWebsite } from '@/utils/formatters';
import { useCallStore } from '@/store/useCallStore';
import { useDebouncedCallback } from 'use-debounce';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Utility function to remove special characters from phone number
const unformatPhoneNumber = (phone: string) => {
  return phone.replace(/[^\d+]/g, '');
};

export default function ProspectsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isLoadingProspects, setIsLoadingProspects] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { makeCall, isCalling } = useCallStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Define callbacks using useCallback
  const handleRowClick = useCallback((prospectId: string) => {
    router.push(`/salesperson/prospects/${prospectId}/details`);
  }, [router]);

  const debouncedSearch = useDebouncedCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, 300);

  // Move all useEffects here
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'salesperson')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchProspects = async () => {
      try {
        setIsLoadingProspects(true);
        const searchParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: '5',
        });

        if (searchQuery) {
          searchParams.append('search', searchQuery);
        }

        const response = await fetch(`/api/prospects?${searchParams.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch prospects');
        }
        const data = await response.json();
        setProspects(data.prospects);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
      } catch (error) {
        console.error('Error fetching prospects:', error);
      } finally {
        setIsLoadingProspects(false);
      }
    };

    if (user) {
      fetchProspects();
    }
  }, [user, currentPage, searchQuery]);

  const handleAddProspect = async (newProspect: Omit<Prospect, 'id' | 'createdAt' | 'updatedAt' | 'addedBy' | 'assignedTo'>) => {
    try {
      const response = await fetch('/api/prospects/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProspect),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to create prospect');
      }

      const createdProspect = await response.json();
      setProspects(prev => [...prev, createdProspect]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating prospect:', error);
      // TODO: Show error notification
      alert(error instanceof Error ? error.message : 'Failed to create prospect');
    }
  };

  const handleMakeCall = (prospect: Prospect) => {
    makeCall({
      To: `+1${unformatPhoneNumber(prospect.phone)}`,
      CallerId: `+1${unformatPhoneNumber(user?.twilioNumber || '')}`,
      UserId: user?.uid ?? '',
      ProspectId: prospect.id,
    });
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render null state
  if (!user) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-gray-100 text-gray-800';
      case 'Contacted':
        return 'bg-blue-100 text-blue-800';
      case 'Qualified':
        return 'bg-green-100 text-green-800';
      case 'Proposal':
        return 'bg-purple-100 text-purple-800';
      case 'Negotiation':
        return 'bg-yellow-100 text-yellow-800';
      case 'Closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Prospects</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Prospect
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
            placeholder="Search prospects by name, email, phone, or location..."
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoadingProspects ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      College Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Website
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      BPPE
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Contact
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prospects.map((prospect) => (
                    <tr 
                      key={prospect.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td 
                        className="px-6 py-4 whitespace-nowrap group"
                        onClick={() => handleRowClick(prospect.id)}
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {prospect.collegeName}
                        </div>
                        <div className="text-sm text-gray-500">{prospect.email}</div>
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={() => handleRowClick(prospect.id)}
                      >
                        <div className="text-sm text-gray-900">{prospect.collegeTypes.join(', ')}</div>
                      </td>
                      {/* Phone number cell - keep separate for calling functionality */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          className="text-sm cursor-pointer text-gray-900 hover:text-blue-600 focus:outline-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMakeCall(prospect);
                          }}
                          disabled={isCalling}
                        >
                          {formatPhoneNumber(prospect.phone)}
                        </button>
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={() => handleRowClick(prospect.id)}
                      >
                        <div className="text-sm text-gray-900">{formatAddress(prospect.address)}</div>
                        <div className="text-sm text-gray-500">{prospect.county} County</div>
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={() => handleRowClick(prospect.id)}
                      >
                        <a 
                          href={prospect.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {formatWebsite(prospect.website)}
                        </a>
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={() => handleRowClick(prospect.id)}
                      >
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          prospect.bppeApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {prospect.bppeApproved ? 'Approved' : 'Not Approved'}
                        </span>
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={() => handleRowClick(prospect.id)}
                      >
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(prospect.status)}`}>
                          {prospect.status}
                        </span>
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={() => handleRowClick(prospect.id)}
                      >
                        <div className="text-sm text-gray-500">{prospect.assignedTo.email}</div>
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                        onClick={() => handleRowClick(prospect.id)}
                      >
                        {new Date(prospect.lastContact).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                
              </table>
              {!isLoadingProspects && prospects.length === 0 && (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No prospects found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search terms or clear the search to see all prospects.
          </p>
        </div>
      )}
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {prospects.map((prospect) => (
              <div key={prospect.id} className="bg-white shadow rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <button
                      onClick={() => router.push(`/salesperson/prospects/${prospect.id}/details`)}
                      className="text-lg font-medium text-gray-900 hover:text-blue-600 text-left"
                    >
                      {prospect.collegeName}
                    </button>
                    <p className="text-sm text-gray-500">{prospect.collegeTypes.join(', ')}</p>
                  </div>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(prospect.status)}`}>
                    {prospect.status}
                  </span>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm">
                    <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <button 
                      className="hover:text-blue-600"
                      onClick={() => handleMakeCall(prospect)}
                      disabled={isCalling}
                    >
                      {unformatPhoneNumber(prospect.phone)}
                    </button>
                  </div>
                  <div className="flex items-center text-sm">
                    <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {prospect.email}
                  </div>
                  <div className="flex items-center text-sm">
                    <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {formatAddress(prospect.address)}
                  </div>
                  <div className="flex items-center text-sm">
                    <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 009-9" />
                    </svg>
                    <a 
                      href={prospect.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {formatWebsite(prospect.website)}
                    </a>
                  </div>
                  <div className="flex items-center text-sm">
                    <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Assigned to {prospect.assignedTo.email}
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    prospect.bppeApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {prospect.bppeApproved ? 'BPPE Approved' : 'Not BPPE Approved'}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {/* TODO: Implement view prospect */}}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => {/* TODO: Implement edit prospect */}}
                      className="text-indigo-600 hover:text-indigo-900 text-sm"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <AddProspectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddProspect}
      />

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
              currentPage === 1 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
            className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
              currentPage === totalPages 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{((currentPage - 1) * 5) + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * 5, totalCount)}
              </span>{' '}
              of <span className="font-medium">{totalCount}</span> results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  currentPage === 1 ? 'cursor-not-allowed' : 'hover:text-gray-500'
                }`}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    currentPage === i + 1
                      ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  currentPage === totalPages ? 'cursor-not-allowed' : 'hover:text-gray-500'
                }`}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}