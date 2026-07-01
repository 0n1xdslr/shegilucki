'use client';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        // Registrar login exitoso una sola vez por sesión/pestaña
        const loginLogged = sessionStorage.getItem('login_logged');
        if (!loginLogged && session.user.email) {
          await supabase.rpc('register_login_success', { user_email: session.user.email });
          sessionStorage.setItem('login_logged', 'true');
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUserProfile({
            ...profile,
            email: session.user.email,
          });
        } else {
          setUserProfile({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || 'Usuario',
            role: 'viewer',
          });
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router]);

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      {loading ? (
        <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-900">
           <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-red-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="flex h-screen overflow-hidden">
          {/* SIDEBAR */}
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} userProfile={userProfile} />

          {/* CONTENT AREA */}
          <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900">
            {/* HEADER */}
            <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} userProfile={userProfile} />

            {/* MAIN CONTENT */}
            <main>
              <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                {children}
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
