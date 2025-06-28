import 'package:flutter/material.dart';
import 'package:provider/provider.dart' as provider_package;
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../providers/language_provider.dart';
import 'dart:async';
import 'package:appointment_app/models/staff_model.dart';
import 'package:appointment_app/models/provider_model.dart' as provider_model;
import 'package:appointment_app/models/staff_service_model.dart';
import 'package:appointment_app/services/api_service.dart';
import 'package:appointment_app/widgets/modern_cards.dart';
import 'package:appointment_app/widgets/modern_buttons.dart';
import 'package:appointment_app/widgets/modern_inputs.dart';
import 'package:appointment_app/router.dart';

class StaffManagementPage extends StatefulWidget {
  const StaffManagementPage({super.key});

  @override
  State<StaffManagementPage> createState() => _StaffManagementPageState();
}

class _StaffManagementPageState extends State<StaffManagementPage>
    with TickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;

  List<Staff> _staffList = [];
  List<provider_model.Provider> _providers = [];
  List<Map<String, dynamic>> _services = [];
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Load providers first
      final providersResponse = await ApiService.getProviders();
      final providers = providersResponse
          .map((json) => provider_model.Provider.fromJson(json))
          .toList();

      // Load staff
      final staffData = await ApiService.getStaff();
      final staff = staffData.map((json) => Staff.fromJson(json)).toList();

      // Load services
      final servicesResponse = await ApiService.getServices();
      final services = servicesResponse
          .map<Map<String, dynamic>>(
              (service) => Map<String, dynamic>.from(service))
          .toList();

      setState(() {
        _providers = providers;
        _staffList = staff;
        _services = services;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      _showErrorSnackBar('Veri yüklenirken hata oluştu: $e');
    }
  }

  Future<void> _loadStaff() async {
    await _loadData();
  }

  Future<void> _loadShifts() async {
    // TODO: Implement shift loading
    setState(() {
      _isLoading = false;
    });
  }

  List<Staff> get _filteredStaff {
    return _staffList.where((staff) {
      final matchesSearch = _searchQuery.isEmpty ||
          staff.fullName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          staff.position.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesSearch;
    }).toList();
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final languageProvider =
        provider_package.Provider.of<LanguageProvider>(context);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(languageProvider.translate('staff_management')),
        backgroundColor: theme.primaryColor,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(text: 'Personel', icon: Icon(Icons.people)),
            Tab(text: 'Vardiyalar', icon: Icon(Icons.schedule)),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildStaffTab(),
                _buildShiftsTab(),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddDialog(),
        backgroundColor: theme.primaryColor,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildStaffTab() {
    return RefreshIndicator(
      onRefresh: _loadStaff,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: const InputDecoration(
                labelText: 'Personel Ara',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
              },
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: _filteredStaff.length,
              itemBuilder: (context, index) {
                final staff = _filteredStaff[index];
                final provider = _providers.firstWhere(
                  (p) => p.id == staff.providerId,
                  orElse: () => provider_model.Provider(
                    id: '',
                    businessName: 'Bilinmeyen İşletme',
                    specialization: '',
                    experienceYears: 0,
                    city: '',
                    address: '',
                    isActive: true,
                    createdAt: DateTime.now(),
                    updatedAt: DateTime.now(),
                  ),
                );
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor:
                          staff.isAvailable ? Colors.green : Colors.grey,
                      child: Text(
                        staff.firstName[0],
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    title: Text(
                      staff.fullName,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(staff.position),
                        Text(provider.businessName),
                      ],
                    ),
                    trailing: PopupMenuButton<String>(
                      onSelected: (value) => _handleStaffAction(value, staff),
                      itemBuilder: (context) => [
                        const PopupMenuItem(
                          value: 'edit',
                          child: Row(
                            children: [
                              Icon(Icons.edit, color: Colors.blue),
                              SizedBox(width: 8),
                              Text('Düzenle'),
                            ],
                          ),
                        ),
                        const PopupMenuItem(
                          value: 'delete',
                          child: Row(
                            children: [
                              Icon(Icons.delete, color: Colors.red),
                              SizedBox(width: 8),
                              Text('Sil'),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShiftsTab() {
    return RefreshIndicator(
      onRefresh: _loadShifts,
      child: const Center(
        child: Text('Vardiya yönetimi yakında eklenecek'),
      ),
    );
  }

  void _showAddDialog() {
    showDialog(
      context: context,
      builder: (context) => const _AddStaffDialog(),
    );
  }

  void _handleStaffAction(String action, Staff staff) {
    switch (action) {
      case 'edit':
        _showEditDialog(staff);
        break;
      case 'delete':
        _showDeleteConfirmation(staff);
        break;
    }
  }

  void _showEditDialog(Staff staff) {
    showDialog(
      context: context,
      builder: (context) => _EditStaffDialog(staff: staff),
    );
  }

  void _showDeleteConfirmation(Staff staff) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Personel Sil'),
        content: Text(
            '${staff.fullName} adlı personeli silmek istediğinizden emin misiniz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('İptal'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await _deleteStaff(staff.id);
            },
            child: const Text('Sil', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteStaff(String staffId) async {
    try {
      await ApiService.deleteStaff(staffId);
      _showSuccessSnackBar('Personel başarıyla silindi');
      await _loadStaff();
    } catch (e) {
      _showErrorSnackBar('Personel silinirken hata oluştu: $e');
    }
  }
}

class _AddStaffDialog extends StatefulWidget {
  const _AddStaffDialog();

  @override
  State<_AddStaffDialog> createState() => _AddStaffDialogState();
}

class _AddStaffDialogState extends State<_AddStaffDialog> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _positionController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  String? _selectedProviderId;
  List<provider_model.Provider> _providers = [];

  @override
  void initState() {
    super.initState();
    _loadProviders();
  }

  Future<void> _loadProviders() async {
    try {
      final providersResponse = await ApiService.getProviders();
      final providers = providersResponse
          .map((json) => provider_model.Provider.fromJson(json))
          .toList();
      setState(() {
        _providers = providers;
      });
    } catch (e) {
      // Handle error
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Yeni Personel Ekle'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: _selectedProviderId,
                decoration: const InputDecoration(
                  labelText: 'İşletme',
                  border: OutlineInputBorder(),
                ),
                items: _providers
                    .map((provider) => DropdownMenuItem<String>(
                          value: provider.id,
                          child: Text(provider.businessName),
                        ))
                    .toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedProviderId = value;
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Lütfen bir işletme seçin';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _firstNameController,
                decoration: const InputDecoration(
                  labelText: 'Ad',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Lütfen ad girin';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _lastNameController,
                decoration: const InputDecoration(
                  labelText: 'Soyad',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Lütfen soyad girin';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _positionController,
                decoration: const InputDecoration(
                  labelText: 'Pozisyon',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Lütfen pozisyon girin';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(
                  labelText: 'E-posta',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Lütfen e-posta girin';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(
                  labelText: 'Telefon',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Lütfen telefon girin';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('İptal'),
        ),
        ElevatedButton(
          onPressed: _saveStaff,
          child: const Text('Kaydet'),
        ),
      ],
    );
  }

  Future<void> _saveStaff() async {
    if (_formKey.currentState!.validate()) {
      try {
        await ApiService.createStaff(
          providerId: _selectedProviderId!,
          firstName: _firstNameController.text,
          lastName: _lastNameController.text,
          position: _positionController.text,
          email: _emailController.text,
          phone: _phoneController.text,
        );
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Personel başarıyla eklendi'),
            backgroundColor: Colors.green,
          ),
        );
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Personel eklenirken hata oluştu: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}

class _EditStaffDialog extends StatefulWidget {
  final Staff staff;

  const _EditStaffDialog({required this.staff});

  @override
  State<_EditStaffDialog> createState() => _EditStaffDialogState();
}

class _EditStaffDialogState extends State<_EditStaffDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _firstNameController;
  late final TextEditingController _lastNameController;
  late final TextEditingController _positionController;
  late final TextEditingController _emailController;
  late final TextEditingController _phoneController;
  String? _selectedProviderId;
  List<provider_model.Provider> _providers = [];

  @override
  void initState() {
    super.initState();
    _firstNameController = TextEditingController(text: widget.staff.firstName);
    _lastNameController = TextEditingController(text: widget.staff.lastName);
    _positionController = TextEditingController(text: widget.staff.position);
    _emailController = TextEditingController(text: widget.staff.email);
    _phoneController = TextEditingController(text: widget.staff.phone);
    _selectedProviderId = widget.staff.providerId;
    _loadProviders();
  }

  Future<void> _loadProviders() async {
    try {
      final providersResponse = await ApiService.getProviders();
      final providers = providersResponse
          .map((json) => provider_model.Provider.fromJson(json))
          .toList();
      setState(() {
        _providers = providers;
      });
    } catch (e) {
      // Handle error
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Personel Düzenle'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: _selectedProviderId,
                decoration: const InputDecoration(
                  labelText: 'İşletme',
                  border: OutlineInputBorder(),
                ),
                items: _providers
                    .map((provider) => DropdownMenuItem<String>(
                          value: provider.id,
                          child: Text(provider.businessName),
                        ))
                    .toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedProviderId = value;
                  });
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Lütfen bir işletme seçin';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _firstNameController,
                decoration: const InputDecoration(
                  labelText: 'Ad',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Lütfen ad girin';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _lastNameController,
                decoration: const InputDecoration(
                  labelText: 'Soyad',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Lütfen soyad girin';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _positionController,
                decoration: const InputDecoration(
                  labelText: 'Pozisyon',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Lütfen pozisyon girin';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(
                  labelText: 'E-posta',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Lütfen e-posta girin';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(
                  labelText: 'Telefon',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Lütfen telefon girin';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('İptal'),
        ),
        ElevatedButton(
          onPressed: _updateStaff,
          child: const Text('Güncelle'),
        ),
      ],
    );
  }

  Future<void> _updateStaff() async {
    if (_formKey.currentState!.validate()) {
      try {
        await ApiService.updateStaff(
          staffId: widget.staff.id,
          firstName: _firstNameController.text,
          lastName: _lastNameController.text,
          position: _positionController.text,
          email: _emailController.text,
          phone: _phoneController.text,
        );
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Personel başarıyla güncellendi'),
            backgroundColor: Colors.green,
          ),
        );
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Personel güncellenirken hata oluştu: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
