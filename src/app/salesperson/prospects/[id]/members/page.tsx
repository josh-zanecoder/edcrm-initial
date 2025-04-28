'use client';

import React, { useState, useEffect } from 'react';
import { Member } from '@/types/member';
import AddEditMemberModal from '@/components/salesperson/AddEditMemberModal';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  TrashIcon,
  PencilIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

function displayPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MembersPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const [members, setMembers] = useState<Member[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collegeName, setCollegeName] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const fetchMembers = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Fetch prospect details first to get the college name
      const prospectResponse = await fetch(`/api/prospects/${id}/details`);
      if (!prospectResponse.ok) {
        throw new Error('Failed to fetch prospect details');
      }
      const prospectData = await prospectResponse.json();
      setCollegeName(prospectData.collegeName);

      // Fetch members
      const membersResponse = await fetch(`/api/prospects/${id}/members`);
      if (!membersResponse.ok) {
        const errorData = await membersResponse.json();
        throw new Error(errorData.error || 'Failed to fetch members');
      }
      const membersData = await membersResponse.json();
      setMembers(membersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchMembers();
    }
  }, [id]);

  const handleAddMember = async (member: Omit<Member, '_id' | 'createdAt' | 'updatedAt' | 'addedBy'>) => {
    try {
      const response = await fetch(`/api/prospects/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add member');
      }
      setIsModalOpen(false);
      toast.success('Member added successfully');
      await fetchMembers();
    } catch (err) {
      console.error('Error adding member:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to add member');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/prospects/${id}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete member');
      }

      // Optimistically update the UI
      setMembers(prevMembers => prevMembers.filter(member => member._id !== memberId));
      toast.success('Member removed successfully');
    } catch (err) {
      console.error('Error deleting member:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete member');
      // Refresh the list to ensure consistency
      fetchMembers();
    }
  };

  const handleEditClick = (member: Member) => {
    setEditingMember(member);
    setIsEditModalOpen(true);
  };

  const handleEditMember = async (member: Omit<Member, '_id' | 'createdAt' | 'updatedAt' | 'addedBy'>) => {
    if (!editingMember) return;
    try {
      // Remove prospectId and collegeName from the update data
      const { prospectId: _prospectId, collegeName: _collegeName, ...updateData } = member;

      console.log('Editing member:', {
        memberId: editingMember._id,
        prospectId: id,
        updateData
      });

      const response = await fetch(`/api/prospects/${id}/members/${editingMember._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Update failed:', responseData);
        throw new Error(responseData.error || 'Failed to update member');
      }

      setIsEditModalOpen(false);
      setEditingMember(null);
      toast.success('Member updated successfully');
      await fetchMembers();
    } catch (err) {
      console.error('Error updating member:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update member');
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Members</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={fetchMembers}
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
            <UserIcon className="h-7 w-7 text-blue-600" />
            <h1 className="text-2xl font-semibold text-gray-900">College Staff Members</h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 text-base font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
          >
            Add Member
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div key={member._id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {member.firstName} {member.lastName}
                </h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 mt-2">
                  {member.role}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteMember(member._id)}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleEditClick(member)}
                  className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center text-gray-500">
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                <a href={`mailto:${member.email}`} className="text-blue-600 hover:text-blue-800">
                  {member.email}
                </a>
              </div>
              <div className="flex items-center text-gray-500">
                <PhoneIcon className="h-5 w-5 mr-2" />
                <a href={`tel:${member.phone}`} className="hover:text-gray-700">
                  {displayPhone(member.phone)}
                </a>
              </div>
            </div>
          </div>
        ))}

        {members.length === 0 && (
          <div className="col-span-full bg-gray-50 rounded-2xl p-12 text-center">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No members</h3>
            <p className="mt-1 text-gray-500">Get started by adding a new member.</p>
            <div className="mt-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Member
              </button>
            </div>
          </div>
        )}
      </div>

      <AddEditMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddMember}
        prospectId={id}
        collegeName={collegeName}
      />

      <AddEditMemberModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingMember(null); }}
        onSave={handleEditMember}
        prospectId={id}
        collegeName={collegeName}
        initialData={editingMember || undefined}
        mode="edit"
      />
    </div>
  );
} 