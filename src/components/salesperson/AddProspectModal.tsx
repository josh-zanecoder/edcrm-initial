'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { Prospect, CollegeType } from '@/types/prospect';
import toast from 'react-hot-toast';

interface AddProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prospect: Omit<Prospect, 'id' | 'createdAt' | 'updatedAt' | 'addedBy' | 'assignedTo'>) => void;
}

const initialFormState = {
  collegeName: '',
  phone: '',
  email: '',
  address: {
    city: '',
    state: '',
    zip: ''
  },
  county: '',
  website: '',
  collegeTypes: [] as CollegeType[],
  bppeApproved: false,
  status: 'New' as const,
  lastContact: new Date().toISOString().split('T')[0]
};

export default function AddProspectModal({ isOpen, onClose, onSave }: AddProspectModalProps) {
  const [formData, setFormData] = useState(initialFormState);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  const isValidPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number before submitting
    if (!isValidPhoneNumber(formData.phone)) {
      toast.error('Please enter a valid phone number in format (XXX) XXX-XXXX');
      return;
    }
    
    onSave(formData);
    // Reset form to initial state
    setFormData(initialFormState);
    // Close modal
    onClose();
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const number = value.replace(/\D/g, '');
    
    // Only allow up to 10 digits
    const truncated = number.slice(0, 10);
    
    // Format the number as (XXX) XXX-XXXX
    if (truncated.length <= 3) {
      return truncated;
    } else if (truncated.length <= 6) {
      return `(${truncated.slice(0, 3)}) ${truncated.slice(3)}`;
    } else {
      return `(${truncated.slice(0, 3)}) ${truncated.slice(3, 6)}-${truncated.slice(6)}`;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedPhone
      }));
      return;
    }
    
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleTypeToggle = (type: CollegeType) => {
    setFormData(prev => ({
      ...prev,
      collegeTypes: prev.collegeTypes.includes(type)
        ? prev.collegeTypes.filter(t => t !== type)
        : [...prev.collegeTypes, type]
    }));
  };

  // Add useEffect to reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormState);
      setIsTypeDropdownOpen(false);
    }
  }, [isOpen]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gradient-to-b from-white to-gray-50 p-8 text-left align-middle shadow-2xl transition-all">
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    type="button"
                    className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none transition-colors duration-200"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="text-center mb-8">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold text-gray-900"
                  >
                    Add New Prospect
                  </Dialog.Title>
                  <p className="mt-2 text-sm text-gray-500">
                    Fill in the details below to add a new prospect to your list.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="collegeName" className="block text-sm font-medium text-gray-700">
                        College Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="collegeName"
                          id="collegeName"
                          required
                          className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200"
                          value={formData.collegeName}
                          onChange={handleChange}
                          placeholder="Enter college name"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="collegeTypes" className="block text-sm font-medium text-gray-700">
                        College Types
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          className="block w-full rounded-xl border-0 py-3 px-4 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200"
                          onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                        >
                          {formData.collegeTypes.length > 0 
                            ? formData.collegeTypes.join(', ')
                            : 'Select college types...'}
                          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </span>
                        </button>
                        
                        {isTypeDropdownOpen && (
                          <div className="absolute z-10 mt-1 w-full bg-white rounded-xl shadow-lg max-h-60 overflow-auto ring-1 ring-black ring-opacity-5">
                            <div className="p-2 space-y-1">
                              {Object.values(CollegeType).map((type) => (
                                <div
                                  key={type}
                                  className="relative flex items-center px-2 py-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                                  onClick={() => handleTypeToggle(type)}
                                >
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={formData.collegeTypes.includes(type)}
                                    onChange={() => {}}
                                  />
                                  <label className="ml-3 block text-sm font-medium text-gray-700">
                                    {type}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Select all that apply
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          name="phone"
                          id="phone"
                          required
                          maxLength={14}
                          className={`block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ${
                            formData.phone && !isValidPhoneNumber(formData.phone)
                              ? 'ring-red-300 focus:ring-red-500'
                              : 'ring-gray-300 focus:ring-blue-600'
                          } placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-all duration-200`}
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="(555) 123-4567"
                        />
                        {formData.phone && !isValidPhoneNumber(formData.phone) && (
                          <p className="mt-1 text-xs text-red-500">
                            Please enter a valid phone number in format (XXX) XXX-XXXX
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          id="email"
                          required
                          className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="example@college.edu"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">
                        City
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="address.city"
                          id="address.city"
                          required
                          className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200"
                          value={formData.address.city}
                          onChange={handleChange}
                          placeholder="Enter city"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="address.state" className="block text-sm font-medium text-gray-700">
                        State
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="address.state"
                          id="address.state"
                          required
                          className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200"
                          value={formData.address.state}
                          onChange={handleChange}
                          placeholder="Enter state"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="address.zip" className="block text-sm font-medium text-gray-700">
                        ZIP Code
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="address.zip"
                          id="address.zip"
                          required
                          className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200"
                          value={formData.address.zip}
                          onChange={handleChange}
                          placeholder="Enter ZIP code"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="county" className="block text-sm font-medium text-gray-700">
                        County
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="county"
                          id="county"
                          required
                          className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200"
                          value={formData.county}
                          onChange={handleChange}
                          placeholder="Enter county"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                        Website
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          name="website"
                          id="website"
                          required
                          className="block w-full rounded-xl border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all duration-200"
                          value={formData.website}
                          onChange={handleChange}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        name="bppeApproved"
                        id="bppeApproved"
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600 transition-colors duration-200"
                        checked={formData.bppeApproved}
                        onChange={handleChange}
                      />
                      <label htmlFor="bppeApproved" className="text-sm text-gray-700">
                        BPPE Approved
                      </label>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-xl border border-transparent bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                    >
                      Save Prospect
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}