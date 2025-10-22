import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if needed
    const { data: { session } } = await supabase.auth.getSession();

    // Role-based routing for location check-in system
    const { pathname } = request.nextUrl;
    
    // Define role-based route patterns
    const lecturerRoutes = ['/location-management', '/session-management'];
    const studentRoutes = ['/check-in'];
    const adminRoutes = ['/admin/locations', '/admin/sessions', '/admin/attendance'];

    // Check if the current path requires role-based access
    const isLecturerRoute = lecturerRoutes.some(route => pathname.startsWith(route));
    const isStudentRoute = studentRoutes.some(route => pathname.startsWith(route));
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

    if (session && (isLecturerRoute || isStudentRoute || isAdminRoute)) {
        try {
            // Get user role from database
            const { data: userData, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Error fetching user role:', error);
                return response;
            }

            const userRole = userData?.role;

            // Redirect based on role and route
            if (isLecturerRoute && userRole !== 'lecturer' && userRole !== 'admin') {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }

            if (isStudentRoute && userRole !== 'student') {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }

            if (isAdminRoute && userRole !== 'admin') {
                return NextResponse.redirect(new URL('/dashboard', request.url));
            }

        } catch (error) {
            console.error('Error in role-based routing:', error);
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
