import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase URL or Key is missing from environment variables');
      return NextResponse.next({
        request,
      });
    }

    let supabaseResponse = NextResponse.next({
      request,
    });

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const isPublicRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/auth/callback');

    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // --- SINGLE DEVICE SESSION CHECK ---
    if (user && session && !isPublicRoute) {
      let sessionId: string | undefined;
      try {
        const jwt = session.access_token;
        const payloadBase64 = jwt.split('.')[1];
        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const payloadJson = atob(base64);
        const payload = JSON.parse(payloadJson);
        sessionId = payload.session_id;
      } catch (e) {
        console.error('Error decoding session JWT:', e);
      }

      const userId = user.id;

      if (sessionId) {
        // Check if the current session matches the active one in the database
        const { data: activeSession } = await supabase
          .from('user_sessions')
          .select('session_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (activeSession && activeSession.session_id !== sessionId) {
          // Conflict! Another device has logged in. Force logout.
          await supabase.auth.signOut();
          
          const url = request.nextUrl.clone();
          url.pathname = '/login';
          url.searchParams.set('error', 'session_conflict');
          return NextResponse.redirect(url);
        } else if (!activeSession) {
          // Register current session as active
          await supabase
            .from('user_sessions')
            .upsert({ user_id: userId, session_id: sessionId, updated_at: new Date().toISOString() });
        }
      }
    }

    if (user && request.nextUrl.pathname === '/login') {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }
    
    if (user && request.nextUrl.pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (error) {
    console.error('Unhandled exception in middleware updateSession:', error);
    return NextResponse.next({
      request,
    });
  }
}
