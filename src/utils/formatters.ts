export const formatAddress = (address: { city: string; state: string; zip: string } | undefined | null): string => {
  if (!address) return '';
  return `${address.city}, ${address.state} ${address.zip}`.trim();
}; 


// Add this after the existing unformatPhoneNumber function
export const formatWebsite = (url: string): string => {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
};

export const formatPhoneNumber = (value: string) => {
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

// Utility function to remove formatting from phone numbers
export const unformatPhoneNumber = (phone: string) => {
  return phone.replace(/[^\d+]/g, '').replace(/^\+1/, '');
};


