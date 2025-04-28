

export const formatAddress = (address: { city: string; state: string; zip: string } | undefined | null): string => {
  if (!address) return '';
  return `${address.city}, ${address.state} ${address.zip}`.trim();
}; 