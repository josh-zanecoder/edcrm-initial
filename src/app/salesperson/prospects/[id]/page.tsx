import { redirect } from 'next/navigation';

export default async function ProspectPage({ params }: { params: { id: string } }) {
  redirect(`/salesperson/prospects/${params.id}/details`);
  return null;
} 