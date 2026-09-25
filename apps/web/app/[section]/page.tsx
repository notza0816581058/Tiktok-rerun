import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { sections } from '@/lib/data';
import CyberShell from '@/components/CyberShell';
export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const user = await currentUser(); if (!user) redirect('/login');
  const { section } = await params; if (!sections.some(item => item[0] === section)) notFound();
  return <CyberShell section={section as Parameters<typeof CyberShell>[0]['section']} username={user} />;
}
