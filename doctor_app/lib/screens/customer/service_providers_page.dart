import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../models/user_model.dart';
import '../../models/service_model.dart';
import 'create_appointment_page.dart';

class ServiceProvidersPage extends StatefulWidget {
  const ServiceProvidersPage({super.key});

  @override
  State<ServiceProvidersPage> createState() => _ServiceProvidersPageState();
}

class _ServiceProvidersPageState extends State<ServiceProvidersPage> {
  bool _isLoading = true;
  String? _error;
  List<UserModel> _providers = [];
  Map<String, List<ServiceModel>> _providerServices = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      // Hizmet sağlayıcıları yükle
      final providersSnapshot = await FirebaseFirestore.instance
          .collection('users')
          .where('role', isEqualTo: 'serviceProvider')
          .get();

      final providers = providersSnapshot.docs
          .map((doc) => UserModel.fromMap(doc.data()))
          .toList();

      // Her sağlayıcının hizmetlerini yükle
      final providerServices = <String, List<ServiceModel>>{};
      for (final provider in providers) {
        final servicesSnapshot = await FirebaseFirestore.instance
            .collection('services')
            .where('providerId', isEqualTo: provider.id)
            .where('isActive', isEqualTo: true)
            .get();

        providerServices[provider.id] = servicesSnapshot.docs
            .map((doc) => ServiceModel.fromMap(doc.data()))
            .toList();
      }

      if (mounted) {
        setState(() {
          _providers = providers;
          _providerServices = providerServices;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Hizmet sağlayıcıları yüklenemedi: $e';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Hizmet Sağlayıcılar'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _providers.isEmpty
                  ? const Center(child: Text('Henüz hizmet sağlayıcı bulunmuyor.'))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _providers.length,
                      itemBuilder: (context, index) {
                        final provider = _providers[index];
                        final services = _providerServices[provider.id] ?? [];

                        return Card(
                          margin: const EdgeInsets.only(bottom: 16),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const CircleAvatar(
                                      child: Icon(Icons.business),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            provider.businessName ?? provider.name,
                                            style: Theme.of(context).textTheme.titleMedium,
                                          ),
                                          if (provider.businessName != null) ...[
                                            const SizedBox(height: 4),
                                            Text(
                                              provider.name,
                                              style: Theme.of(context).textTheme.bodyMedium,
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    ElevatedButton(
                                      onPressed: () {
                                        Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder: (_) => const CreateAppointmentPage(),
                                          ),
                                        );
                                      },
                                      child: const Text('Randevu Al'),
                                    ),
                                  ],
                                ),
                                if (provider.address != null) ...[
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      const Icon(Icons.location_on, size: 16),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          provider.address!,
                                          style: Theme.of(context).textTheme.bodyMedium,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                                if (services.isNotEmpty) ...[
                                  const SizedBox(height: 16),
                                  Text(
                                    'Hizmetler',
                                    style: Theme.of(context).textTheme.titleSmall,
                                  ),
                                  const SizedBox(height: 8),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: services.map((service) {
                                      return Chip(
                                        label: Text(
                                          '${service.name} (${service.price} TL)',
                                        ),
                                      );
                                    }).toList(),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        );
                      },
                    ),
    );
  }
} 