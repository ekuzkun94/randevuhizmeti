import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../models/user_model.dart';
import 'admin/admin_home_page.dart';
import 'customer/customer_home_page.dart';
import 'service_provider/service_provider_home_page.dart';
import 'auth/login_page.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    if (authProvider.isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (!authProvider.isAuthenticated) {
      return const LoginPage();
    }

    final user = authProvider.user;
    if (user == null) {
      return const LoginPage();
    }

    switch (user.role) {
      case UserRole.admin:
        return const AdminHomePage();
      case UserRole.customer:
        return const CustomerHomePage();
      case UserRole.serviceProvider:
        return const ServiceProviderHomePage();
      default:
        return const LoginPage();
    }
  }
} 