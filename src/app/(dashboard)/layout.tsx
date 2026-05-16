import { Sidebar } from "@/components/sidebar";

import { getSession } from "@/lib/auth-utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  return (
    <>
      <Sidebar 
        role={session?.user?.role} 
        name={session?.user?.name || session?.user?.username} 
        permissions={session?.user?.permissions}
      />
      <main className="lg:pl-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

    </>
  );
}
