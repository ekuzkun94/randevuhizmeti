import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../models/user_model.dart';
import '../../models/service_model.dart';
import '../../models/working_hours_model.dart';

class AdminProvidersPage extends StatefulWidget {
  const AdminProvidersPage({super.key});

  @override
  State<AdminProvidersPage> createState() => _AdminProvidersPageState();
}

class _AdminProvidersPageState extends State<AdminProvidersPage> {
  bool _isLoading = true;
  String? _error;
  List<UserModel> _providers = [];
  Map<String, List<ServiceModel>> _providerServices = {};
  Map<String, List<WorkingHoursModel>> _providerWorkingHours = {};
  String? _selectedService;

  @override
  void initState() {
    super.initState();
    _loadProviders();
  }

  Future<void> _loadProviders() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      Query query = FirebaseFirestore.instance.collection('users')
          .where('role', isEqualTo: 'serviceProvider');

      // Hizmet filtresi
      if (_selectedService != null && _selectedService != 'all') {
        final servicesSnapshot = await FirebaseFirestore.instance
            .collection('services')
            .where('providerId', isEqualTo: _selectedService)
            .get();

        final providerIds = servicesSnapshot.docs
            .map((doc) => doc.data()['providerId'] as String)
            .toSet();

        if (providerIds.isNotEmpty) {
          query = query.where(FieldPath.documentId, whereIn: providerIds.toList());
        }
      }

      final snapshot = await query.get();
      final providers = snapshot.docs.map((doc) {
        try {
          return UserModel.fromMap(doc.data() as Map<String, dynamic>);
        } catch (e) {
          print('Hizmet sağlayıcı dönüştürme hatası: $e');
          return null;
        }
      }).where((provider) => provider != null).cast<UserModel>().toList();

      // Her sağlayıcının hizmetlerini ve çalışma saatlerini yükle
      final providerServices = <String, List<ServiceModel>>{};
      final providerWorkingHours = <String, List<WorkingHoursModel>>{};

      for (final provider in providers) {
        // Hizmetleri yükle
        final servicesSnapshot = await FirebaseFirestore.instance
            .collection('services')
            .where('providerId', isEqualTo: provider.id)
            .get();

        providerServices[provider.id] = servicesSnapshot.docs
            .map((doc) => ServiceModel.fromMap(doc.data() as Map<String, dynamic>))
            .toList();

        // Çalışma saatlerini yükle
        final workingHoursSnapshot = await FirebaseFirestore.instance
            .collection('workingHours')
            .where('providerId', isEqualTo: provider.id)
            .get();

        providerWorkingHours[provider.id] = workingHoursSnapshot.docs
            .map((doc) => WorkingHoursModel.fromMap(doc.data() as Map<String, dynamic>))
            .toList();
      }

      setState(() {
        _providers = providers;
        _providerServices = providerServices;
        _providerWorkingHours = providerWorkingHours;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Hizmet sağlayıcılar yüklenemedi: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _addService(String providerId) async {
    final nameController = TextEditingController();
    final descriptionController = TextEditingController();
    final priceController = TextEditingController();
    final durationController = TextEditingController();

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Yeni Hizmet Ekle'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Hizmet Adı'),
              ),
              TextField(
                controller: descriptionController,
                decoration: const InputDecoration(labelText: 'Açıklama'),
                maxLines: 3,
              ),
              TextField(
                controller: priceController,
                decoration: const InputDecoration(labelText: 'Fiyat (TL)'),
                keyboardType: TextInputType.number,
              ),
              TextField(
                controller: durationController,
                decoration: const InputDecoration(labelText: 'Süre (dakika)'),
                keyboardType: TextInputType.number,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('İptal'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Ekle'),
          ),
        ],
      ),
    );

    if (result == true) {
      try {
        final service = ServiceModel(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          name: nameController.text,
          description: descriptionController.text,
          price: double.parse(priceController.text),
          duration: int.parse(durationController.text),
          isActive: true,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        await FirebaseFirestore.instance
            .collection('services')
            .doc(service.id)
            .set(service.toMap());

        await _loadProviders();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Hizmet eklendi')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Hata: $e')),
          );
        }
      }
    }
  }

  Future<void> _updateService(ServiceModel service) async {
    final nameController = TextEditingController(text: service.name);
    final descriptionController = TextEditingController(text: service.description);
    final priceController = TextEditingController(text: service.price.toString());
    final durationController = TextEditingController(text: service.duration.toString());

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hizmeti Düzenle'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Hizmet Adı'),
              ),
              TextField(
                controller: descriptionController,
                decoration: const InputDecoration(labelText: 'Açıklama'),
                maxLines: 3,
              ),
              TextField(
                controller: priceController,
                decoration: const InputDecoration(labelText: 'Fiyat (TL)'),
                keyboardType: TextInputType.number,
              ),
              TextField(
                controller: durationController,
                decoration: const InputDecoration(labelText: 'Süre (dakika)'),
                keyboardType: TextInputType.number,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('İptal'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Güncelle'),
          ),
        ],
      ),
    );

    if (result == true) {
      try {
        final updatedService = service.copyWith(
          name: nameController.text,
          description: descriptionController.text,
          price: double.parse(priceController.text),
          duration: int.parse(durationController.text),
          updatedAt: DateTime.now(),
        );

        await FirebaseFirestore.instance
            .collection('services')
            .doc(service.id)
            .update(updatedService.toMap());

        await _loadProviders();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Hizmet güncellendi')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Hata: $e')),
          );
        }
      }
    }
  }

  Future<void> _deleteService(String serviceId) async {
    try {
      await FirebaseFirestore.instance
          .collection('services')
          .doc(serviceId)
          .delete();

      await _loadProviders();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Hizmet silindi')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Hata: $e')),
        );
      }
    }
  }

  Future<void> _updateWorkingHours(String providerId) async {
    final workingHours = _providerWorkingHours[providerId] ?? [];
    final days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    final timeControllers = List.generate(
      days.length,
      (index) => {
        'start': TextEditingController(
          text: workingHours
              .firstWhere(
                (wh) => wh.dayOfWeek == index,
                orElse: () => WorkingHoursModel(
                  id: '',
                  providerId: providerId,
                  dayOfWeek: index,
                  startTime: '09:00',
                  endTime: '17:00',
                  isActive: true,
                  createdAt: DateTime.now(),
                  updatedAt: DateTime.now(),
                ),
              )
              .startTime,
        ),
        'end': TextEditingController(
          text: workingHours
              .firstWhere(
                (wh) => wh.dayOfWeek == index,
                orElse: () => WorkingHoursModel(
                  id: '',
                  providerId: providerId,
                  dayOfWeek: index,
                  startTime: '09:00',
                  endTime: '17:00',
                  isActive: true,
                  createdAt: DateTime.now(),
                  updatedAt: DateTime.now(),
                ),
              )
              .endTime,
        ),
      },
    );

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Çalışma Saatlerini Düzenle'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(
              days.length,
              (index) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 8.0),
                child: Row(
                  children: [
                    SizedBox(
                      width: 100,
                      child: Text(days[index]),
                    ),
                    Expanded(
                      child: TextField(
                        controller: timeControllers[index]['start'],
                        decoration: const InputDecoration(
                          labelText: 'Başlangıç',
                          hintText: '09:00',
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextField(
                        controller: timeControllers[index]['end'],
                        decoration: const InputDecoration(
                          labelText: 'Bitiş',
                          hintText: '17:00',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('İptal'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Kaydet'),
          ),
        ],
      ),
    );

    if (result == true) {
      try {
        final batch = FirebaseFirestore.instance.batch();
        final workingHoursRef = FirebaseFirestore.instance.collection('workingHours');

        // Mevcut çalışma saatlerini sil
        for (final wh in workingHours) {
          batch.delete(workingHoursRef.doc(wh.id));
        }

        // Yeni çalışma saatlerini ekle
        for (var i = 0; i < days.length; i++) {
          final wh = WorkingHoursModel(
            id: DateTime.now().millisecondsSinceEpoch.toString() + '_$i',
            providerId: providerId,
            dayOfWeek: i,
            startTime: timeControllers[i]['start']!.text,
            endTime: timeControllers[i]['end']!.text,
            isActive: true,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          );
          batch.set(workingHoursRef.doc(wh.id), wh.toMap());
        }

        await batch.commit();
        await _loadProviders();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Çalışma saatleri güncellendi')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Hata: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Hizmet Sağlayıcı Yönetimi'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _providers.isEmpty
                  ? const Center(child: Text('Hizmet sağlayıcı bulunamadı'))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _providers.length,
                      itemBuilder: (context, index) {
                        final provider = _providers[index];
                        final services = _providerServices[provider.id] ?? [];
                        final workingHours = _providerWorkingHours[provider.id] ?? [];

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
                                    IconButton(
                                      icon: const Icon(Icons.access_time),
                                      onPressed: () => _updateWorkingHours(provider.id),
                                      tooltip: 'Çalışma Saatlerini Düzenle',
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.add),
                                      onPressed: () => _addService(provider.id),
                                      tooltip: 'Hizmet Ekle',
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
                                  ListView.builder(
                                    shrinkWrap: true,
                                    physics: const NeverScrollableScrollPhysics(),
                                    itemCount: services.length,
                                    itemBuilder: (context, index) {
                                      final service = services[index];
                                      return ListTile(
                                        title: Text(service.name),
                                        subtitle: Text(
                                          '${service.description}\n'
                                          'Fiyat: ${service.price} TL\n'
                                          'Süre: ${service.duration} dakika',
                                        ),
                                        trailing: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            IconButton(
                                              icon: const Icon(Icons.edit),
                                              onPressed: () => _updateService(service),
                                            ),
                                            IconButton(
                                              icon: const Icon(Icons.delete),
                                              onPressed: () {
                                                showDialog(
                                                  context: context,
                                                  builder: (context) => AlertDialog(
                                                    title: const Text('Hizmeti Sil'),
                                                    content: const Text(
                                                      'Bu hizmeti silmek istediğinizden emin misiniz?',
                                                    ),
                                                    actions: [
                                                      TextButton(
                                                        onPressed: () {
                                                          Navigator.pop(context);
                                                        },
                                                        child: const Text('İptal'),
                                                      ),
                                                      TextButton(
                                                        onPressed: () {
                                                          Navigator.pop(context);
                                                          _deleteService(service.id);
                                                        },
                                                        child: const Text('Sil'),
                                                      ),
                                                    ],
                                                  ),
                                                );
                                              },
                                            ),
                                          ],
                                        ),
                                      );
                                    },
                                  ),
                                ],
                                if (workingHours.isNotEmpty) ...[
                                  const SizedBox(height: 16),
                                  Text(
                                    'Çalışma Saatleri',
                                    style: Theme.of(context).textTheme.titleSmall,
                                  ),
                                  const SizedBox(height: 8),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: workingHours.map((wh) {
                                      final days = [
                                        'Pazartesi',
                                        'Salı',
                                        'Çarşamba',
                                        'Perşembe',
                                        'Cuma',
                                        'Cumartesi',
                                        'Pazar'
                                      ];
                                      return Chip(
                                        label: Text(
                                          '${days[wh.dayOfWeek]}: ${wh.startTime} - ${wh.endTime}',
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