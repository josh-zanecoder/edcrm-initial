'use client';

import { useState, useEffect } from 'react';
import { CreateSalespersonInput } from '@/types/salesperson';
import { formatPhoneNumber, unformatPhoneNumber } from '@/utils/formatters';
import toast from 'react-hot-toast';

interface AddSalespersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSalespersonAdded?: () => void;
}

export default function AddSalespersonModal({ isOpen, onClose, onSalespersonAdded }: AddSalespersonModalProps) {
  const [formData, setFormData] = useState<CreateSalespersonInput>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: 'Default@123',
    role: 'salesperson',
    twilio_number: '', // Add this field
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateSalespersonInput>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShowModal(true), 10);
    } else {
      setShowModal(false);
    }
  }, [isOpen]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'phone' | 'twilio_number') => {
    const { value } = e.target;
    const formattedValue = formatPhoneNumber(value);
    
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Use phone formatter for phone fields
    if (name === 'phone' || name === 'twilio_number') {
      handlePhoneChange(e, name as 'phone' | 'twilio_number');
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof CreateSalespersonInput]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    // Clear API error when user makes changes
    if (apiError) {
      setApiError(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateSalespersonInput> = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    const phoneRegex = /^\+?1?\s*\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!phoneRegex.test(unformatPhoneNumber(formData.phone))) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (formData.twilio_number && !phoneRegex.test(unformatPhoneNumber(formData.twilio_number))) {
      newErrors.twilio_number = 'Invalid Twilio number format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    
    if (!validateForm()) {
      // Show validation errors in toast only during submission
      if (errors.phone) {
        toast.error('Please enter a valid phone number');
      }
      if (errors.twilio_number) {
        toast.error('Please enter a valid Twilio number');
      }
      toast.error('Please fix the form errors before submitting');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Creating new salesperson...');

    try {
      const response = await fetch('/api/admin-salespersons/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          phone: unformatPhoneNumber(formData.phone),
          twilio_number: formData.twilio_number ? unformatPhoneNumber(formData.twilio_number) : null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create salesperson');
      }

      toast.success('Salesperson created successfully!', {
        id: loadingToast,
      });

      if (onSalespersonAdded) {
        onSalespersonAdded();
      }

      onClose();
    } catch (error) {
      console.error('Error creating salesperson:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create salesperson', {
        id: loadingToast,
      });
      setApiError(error instanceof Error ? error.message : 'Failed to create salesperson');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 backdrop-blur-sm transition-opacity duration-300 ${
          showModal ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center">
        <div 
          className={`relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all duration-300 w-full max-w-lg mx-auto ${
            showModal ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          {/* Close button */}
          <button
            type="button"
            className="absolute right-2 top-2 sm:right-4 sm:top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none"
            onClick={onClose}
          >
            <svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="p-4 sm:p-6">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-xl sm:text-2xl font-bold leading-6 text-gray-900 mb-4 sm:mb-6">
                  Add New Salesperson
                </h3>
                
                {apiError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm font-medium text-red-600">{apiError}</p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="first_name" className="block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          id="first_name"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleChange}
                          className={`block w-full rounded-md border-2 shadow-sm text-sm sm:text-base transition-colors duration-200 px-3 py-2.5 sm:px-4 sm:py-3 placeholder:text-gray-400 text-gray-900 ${
                            errors.first_name 
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          }`}
                          placeholder="Enter first name"
                        />
                        {errors.first_name && (
                          <p className="mt-1.5 text-sm font-medium text-red-600">{errors.first_name}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="last_name" className="block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          id="last_name"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleChange}
                          className={`block w-full rounded-md border-2 shadow-sm text-sm sm:text-base transition-colors duration-200 px-3 py-2.5 sm:px-4 sm:py-3 placeholder:text-gray-400 text-gray-900 ${
                            errors.last_name 
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          }`}
                          placeholder="Enter last name"
                        />
                        {errors.last_name && (
                          <p className="mt-1.5 text-sm font-medium text-red-600">{errors.last_name}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`block w-full rounded-md border-2 shadow-sm text-sm sm:text-base transition-colors duration-200 px-3 py-2.5 sm:px-4 sm:py-3 placeholder:text-gray-400 text-gray-900 ${
                          errors.email 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        placeholder="Enter email address"
                      />
                      {errors.email && (
                        <p className="mt-1.5 text-sm font-medium text-red-600">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={`block w-full rounded-md border-2 shadow-sm text-sm sm:text-base transition-colors duration-200 px-3 py-2.5 sm:px-4 sm:py-3 placeholder:text-gray-400 text-gray-900 ${
                          errors.phone 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                        placeholder="(555) 123-4567"
                      />
                      {errors.phone && (
                        <p className="mt-1.5 text-sm font-medium text-red-600">{errors.phone}</p>
                      )}
                    </div>

                    {/* Add this new field before the note about default password */}
                    <div>
                      <label htmlFor="twilio_number" className="block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                        Twilio Number (Optional)
                      </label>
                      <input
                        type="tel"
                        id="twilio_number"
                        name="twilio_number"
                        value={formData.twilio_number}
                        onChange={handleChange}
                        className="block w-full rounded-md border-2 border-gray-300 shadow-sm text-sm sm:text-base transition-colors duration-200 px-3 py-2.5 sm:px-4 sm:py-3 placeholder:text-gray-400 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="+1 (555) 123-4567"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Format: +1XXXXXXXXXX (include country code)
                      </p>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 rounded-md">
                      <p className="text-sm text-blue-700">
                        <span className="font-semibold">Note:</span> New salespersons will receive a default password of <code className="bg-blue-100 px-1 py-0.5 rounded">Default@123</code>. They should use this password for their first login.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border-2 border-transparent bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding...
                        </>
                      ) : (
                        'Add Salesperson'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}