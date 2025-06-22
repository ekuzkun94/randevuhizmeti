import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:appointment_app/screens/auth/login_page.dart';
import 'package:appointment_app/screens/auth/register_page.dart';
import 'package:appointment_app/screens/admin/admin_home_page.dart';
import 'package:appointment_app/screens/admin/admin_appointments_page.dart';
import 'package:appointment_app/screens/admin/admin_users_page.dart';
import 'package:appointment_app/screens/admin/admin_services_page.dart';
import 'package:appointment_app/screens/admin/admin_roles_page.dart';
import 'package:appointment_app/screens/admin/admin_dashboard_page.dart';
import 'package:appointment_app/screens/provider/provider_home_page.dart';
import 'package:appointment_app/screens/provider/provider_appointments_page.dart';
import 'package:appointment_app/screens/provider/provider_services_page.dart';
import 'package:appointment_app/screens/provider/provider_schedule_page.dart';
import 'package:appointment_app/screens/provider/provider_dashboard_page.dart';
import 'package:appointment_app/screens/customer/customer_home_page.dart';
import 'package:appointment_app/screens/customer/customer_dashboard_page.dart';
import 'package:appointment_app/screens/customer/create_appointment_page.dart';
import 'package:appointment_app/screens/customer/my_appointments_page.dart';
import 'package:appointment_app/screens/customer/providers_page.dart';
import 'package:appointment_app/screens/guest/guest_booking_page.dart';
import 'package:appointment_app/screens/home_page.dart';
import 'package:appointment_app/providers/auth_provider.dart';
import 'package:provider/provider.dart';

final GoRouter router = GoRouter(
  initialLocation: '/',
  redirect: (context, state) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    // If still loading, stay on current route
    if (authProvider.isLoading) {
      return null;
    }
    
    // Ana sayfa, login, register ve guest-booking sayfalarına herkese erişim izni ver
    final publicPaths = ['/', '/login', '/register', '/guest-booking'];
    if (publicPaths.contains(state.matchedLocation)) {
      return null;
    }
    
    // If not authenticated, redirect to login
    if (authProvider.currentUser == null) {
      return '/login';
    }
    
    // If authenticated, check role-based access
    final user = authProvider.currentUser!;
    final currentPath = state.matchedLocation;
    
    // Admin routes - only admin can access
    if (currentPath.startsWith('/admin') && user.roleId != '1') {
      return '/login';
    }
    
    // Provider routes - only provider can access
    if (currentPath.startsWith('/provider') && user.roleId != '2') {
      return '/login';
    }
    
    // Customer routes - only customer can access
    if (currentPath.startsWith('/customer') && user.roleId != '3') {
      return '/login';
    }
    
    // Allow access to role-based paths
    return null;
  },
  routes: [
    // Public routes
    GoRoute(
      path: '/',
      builder: (context, state) => const HomePage(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginPage(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterPage(),
    ),
    GoRoute(
      path: '/guest-booking',
      builder: (context, state) => const GuestBookingPage(),
    ),
    
    // Admin routes
    GoRoute(
      path: '/admin',
      builder: (context, state) => const AdminHomePage(),
      routes: [
        GoRoute(
          path: 'dashboard',
          builder: (context, state) => const AdminDashboardPage(),
        ),
        GoRoute(
          path: 'appointments',
          builder: (context, state) => const AdminAppointmentsPage(),
        ),
        GoRoute(
          path: 'users',
          builder: (context, state) => const AdminUsersPage(),
        ),
        GoRoute(
          path: 'services',
          builder: (context, state) => const AdminServicesPage(),
        ),
        GoRoute(
          path: 'roles',
          builder: (context, state) => const AdminRolesPage(),
        ),
      ],
    ),
    
    // Provider routes
    GoRoute(
      path: '/provider',
      builder: (context, state) => const ProviderHomePage(),
      routes: [
        GoRoute(
          path: 'dashboard',
          builder: (context, state) => const ProviderDashboardPage(),
        ),
        GoRoute(
          path: 'appointments',
          builder: (context, state) => const ProviderAppointmentsPage(),
        ),
        GoRoute(
          path: 'services',
          builder: (context, state) => const ProviderServicesPage(),
        ),
        GoRoute(
          path: 'schedule',
          builder: (context, state) => const ProviderSchedulePage(),
        ),
      ],
    ),
    
    // Customer routes
    GoRoute(
      path: '/customer',
      builder: (context, state) => const CustomerHomePage(),
      routes: [
        GoRoute(
          path: 'dashboard',
          builder: (context, state) => const CustomerDashboardPage(),
        ),
        GoRoute(
          path: 'create-appointment',
          builder: (context, state) {
            // Query parametrelerini al
            final providerId = state.uri.queryParameters['providerId'];
            final providerName = state.uri.queryParameters['providerName'];
            final serviceCategory = state.uri.queryParameters['serviceCategory'];
            
            return CreateAppointmentPage(
              preSelectedProviderId: providerId,
              preSelectedProviderName: providerName,
              preSelectedServiceCategory: serviceCategory,
            );
          },
        ),
        GoRoute(
          path: 'my-appointments',
          builder: (context, state) => const MyAppointmentsPage(),
        ),
        GoRoute(
          path: 'providers',
          builder: (context, state) => const ProvidersPage(),
        ),
      ],
    ),
  ],
  errorBuilder: (context, state) => _ErrorPage(error: state.error),
);

class _ErrorPage extends StatelessWidget {
  final Exception? error;
  
  const _ErrorPage({this.error});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Hata'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              'Sayfa bulunamadı',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            if (error != null) ...[
              const SizedBox(height: 8),
              Text(
                error.toString(),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/'),
              child: const Text('Ana Sayfaya Dön'),
            ),
          ],
        ),
      ),
    );
  }
}

// Navigation helper class
class AppNavigation {
  static void goToLogin(BuildContext context) {
    context.go('/login');
  }
  
  static void goToHome(BuildContext context) {
    context.go('/');
  }
  
  // Admin navigation
  static void goToAdminHome(BuildContext context) {
    context.go('/admin');
  }
  
  static void goToAdminDashboard(BuildContext context) {
    context.go('/admin/dashboard');
  }
  
  static void goToAdminAppointments(BuildContext context) {
    context.go('/admin/appointments');
  }
  
  static void goToAdminUsers(BuildContext context) {
    context.go('/admin/users');
  }
  
  static void goToAdminServices(BuildContext context) {
    context.go('/admin/services');
  }
  
  static void goToAdminRoles(BuildContext context) {
    context.go('/admin/roles');
  }
  
  // Provider navigation
  static void goToProviderHome(BuildContext context) {
    context.go('/provider');
  }
  
  static void goToProviderDashboard(BuildContext context) {
    context.go('/provider/dashboard');
  }
  
  static void goToProviderAppointments(BuildContext context) {
    context.go('/provider/appointments');
  }
  
  static void goToProviderServices(BuildContext context) {
    context.go('/provider/services');
  }
  
  static void goToProviderSchedule(BuildContext context) {
    context.go('/provider/schedule');
  }
  
  // Customer navigation
  static void goToCustomerHome(BuildContext context) {
    context.go('/customer');
  }
  
  static void goToCustomerDashboard(BuildContext context) {
    context.go('/customer/dashboard');
  }
  
  static void goToCreateAppointment(BuildContext context, {
    String? providerId,
    String? providerName,
    String? serviceCategory,
  }) {
    String path = '/customer/create-appointment';
    
    if (providerId != null && providerName != null && serviceCategory != null) {
      path += '?providerId=$providerId&'
              'providerName=${Uri.encodeComponent(providerName)}&'
              'serviceCategory=${Uri.encodeComponent(serviceCategory)}';
    }
    
    context.go(path);
  }
  
  static void goToMyAppointments(BuildContext context) {
    context.go('/customer/my-appointments');
  }
  
  static void goToProviders(BuildContext context) {
    context.go('/customer/providers');
  }
  
  // Guest navigation
  static void goToGuestBooking(BuildContext context) {
    context.go('/guest-booking');
  }
} 