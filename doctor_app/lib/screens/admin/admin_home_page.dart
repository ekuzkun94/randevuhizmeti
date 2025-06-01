import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../auth/login_page.dart';
import 'admin_demo_page.dart';
import 'admin_users_page.dart';
import 'admin_providers_page.dart';
import 'admin_appointments_page.dart';
import 'admin_settings_page.dart';

class AdminHomePage extends StatelessWidget {
  const AdminHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Paneli'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await authProvider.signOut();
              if (!context.mounted) return;
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => const LoginPage()),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Hoş Geldiniz, ${user?.name ?? ""}!',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 24),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              children: [
                _buildMenuCard(
                  context,
                  Icons.people,
                  'Kullanıcı Yönetimi',
                  () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const AdminUsersPage(),
                      ),
                    );
                  },
                ),
                _buildMenuCard(
                  context,
                  Icons.business,
                  'Hizmet Sağlayıcı Yönetimi',
                  () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const AdminProvidersPage(),
                      ),
                    );
                  },
                ),
                _buildMenuCard(
                  context,
                  Icons.calendar_today,
                  'Randevu Yönetimi',
                  () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const AdminAppointmentsPage(),
                      ),
                    );
                  },
                ),
                _buildMenuCard(
                  context,
                  Icons.settings,
                  'Sistem Ayarları',
                  () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const AdminSettingsPage(),
                      ),
                    );
                  },
                ),
                _buildMenuCard(
                  context,
                  Icons.add_circle,
                  'Demo Veri Ekle',
                  () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const AdminDemoPage(),
                      ),
                    );
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuCard(
    BuildContext context,
    IconData icon,
    String title,
    VoidCallback onTap,
  ) {
    return Card(
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 48,
                color: Theme.of(context).primaryColor,
              ),
              const SizedBox(height: 8),
              Text(
                title,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ],
          ),
        ),
      ),
    );
  }
} 