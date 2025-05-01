'use client';

import React, { useState, useEffect } from 'react';
import { Prospect, CollegeType } from '@/types/prospect';
import { formatAddress, formatPhoneNumber } from '@/utils/formatters';
import { useRouter } from 'next/navigation';
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  GlobeAltIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Closed',
];

const COLLEGE_TYPES = Object.values(CollegeType);

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProspectDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProspect, setEditedProspect] = useState<Prospect | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProspect = async () => {
      if (!id) {
        toast.error('Invalid prospect ID');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/prospects/${id}/details`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch prospect');
        }

        const data = await response.json();
        setProspect(data);
        setEditedProspect(data);
      } catch (error) {
        console.error('Error fetching prospect:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to fetch prospect');
        setProspect(null);
        setEditedProspect(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProspect();
    }
  }, [id]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProspect(prospect);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProspect(prospect);
  };

 
  const handleChange = (field: string, value: string) => {
    if (!editedProspect) return;
    
    if (field === 'phone') {
      const formattedPhone = formatPhoneNumber(value);
      setEditedProspect({
        ...editedProspect,
        [field]: formattedPhone
      });
      return;
    }
    
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setEditedProspect({
        ...editedProspect,
        address: {
          ...editedProspect.address,
          [addressField]: value
        }
      });
    } else {
      setEditedProspect({
        ...editedProspect,
        [field]: value
      });
    }
  };

  const handleCollegeTypeToggle = (type: CollegeType) => {
    setEditedProspect(prev => {
      if (!prev) return prev;
      const types = prev.collegeTypes.includes(type)
        ? prev.collegeTypes.filter(t => t !== type)
        : [...prev.collegeTypes, type];
      return { ...prev, collegeTypes: types };
    });
  };

  const isValidPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  const handleSave = async () => {
    if (!prospect || !editedProspect) return;

   

    try {
      setIsSaving(true);
      const response = await fetch(`/api/prospects/${id}/details`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProspect),
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update prospect');
      }

      const updatedProspect = await response.json();
      setProspect(updatedProspect);
      setEditedProspect(updatedProspect);
      setIsEditing(false);
      toast.success('Prospect updated successfully');
    } catch (error) {
      console.error('Error updating prospect:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update prospect');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!prospect || !editedProspect) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Prospect not found</h2>
          <p className="mt-2 text-gray-500">The requested prospect could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BuildingOfficeIcon className="h-7 w-7 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-900">Prospect Details</h1>
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-6 py-2.5 text-base font-medium rounded-xl bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2.5 text-base font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="px-6 py-2.5 text-base font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
              >
                Edit Details
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">College Details</h2>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">College Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProspect.collegeName}
                  onChange={(e) => handleChange('collegeName', e.target.value)}
                  className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter college name"
                />
              ) : (
                <p className="text-base text-gray-900">{prospect.collegeName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={formatPhoneNumber(editedProspect.phone)}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="(XXX) XXX-XXXX"
                      maxLength={14}
                    />
                  </div>
                  <p className="text-sm text-gray-500 ml-1">
                    Please enter phone number in format: (XXX) XXX-XXXX
                  </p>
                </div>
              ) : (
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-base text-gray-900">{formatPhoneNumber(prospect.phone)}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              {isEditing ? (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={editedProspect.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="email@example.com"
                  />
                </div>
              ) : (
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-base text-gray-900">{prospect.email}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
              {isEditing ? (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    value={editedProspect.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>
              ) : (
                <div className="flex items-center">
                  <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <a
                    href={prospect.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {prospect.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="bg-white rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <MapPinIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Location & Status</h2>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={editedProspect.address.city}
                      onChange={(e) => handleChange('address.city', e.target.value)}
                      className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={editedProspect.address.state}
                      onChange={(e) => handleChange('address.state', e.target.value)}
                      className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="ZIP Code"
                    value={editedProspect.address.zip}
                    onChange={(e) => handleChange('address.zip', e.target.value)}
                    className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-base text-gray-900">{formatAddress(prospect.address)}</p>
                    <p className="text-sm text-gray-500 mt-1">{prospect.county} County</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">County</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProspect.county}
                  onChange={(e) => handleChange('county', e.target.value)}
                  className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter county"
                />
              ) : (
                <p className="text-base text-gray-900">{prospect.county}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              {isEditing ? (
                <select
                  value={editedProspect.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-blue-50 text-blue-700">
                    {prospect.status}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">College Types</label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {COLLEGE_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleCollegeTypeToggle(type as CollegeType)}
                      className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                        editedProspect.collegeTypes.includes(type as CollegeType)
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {prospect.collegeTypes?.map((type) => (
                    <span
                      key={type}
                      className="inline-flex px-4 py-2 text-sm font-medium rounded-full bg-blue-50 text-blue-700"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">BPPE Approval</label>
              {isEditing ? (
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editedProspect.bppeApproved}
                    onChange={(e) => handleChange('bppeApproved', e.target.checked.toString())}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-base text-gray-900">BPPE Approved</span>
                </label>
              ) : (
                <div className="flex items-center">
                  {prospect.bppeApproved ? (
                    <>
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-50 text-green-700">
                        Approved
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                      <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-red-50 text-red-700">
                        Not Approved
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}