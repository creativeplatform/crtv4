"use client";

import NonLoggedInView from '@/components/home-page/NonLoggedInView';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <NonLoggedInView />
    </main>
  );
}
