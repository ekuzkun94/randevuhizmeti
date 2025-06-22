import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';

class ProviderServicesPage extends StatefulWidget {
  const ProviderServicesPage({super.key});

  @override
  State<ProviderServicesPage> createState() => _ProviderServicesPageState();
}

class _ProviderServicesPageState extends State<ProviderServicesPage> {
  List<Map<String, dynamic>> _services = [];
  bool _isLoading = true;

  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  final _durationController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _durationController.dispose();
    super.dispose();
  }

  Future<void> _loadServices() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final currentUser = authProvider.currentUser;
      
      if (currentUser != null && currentUser.id != null) {
        final response = await ApiService.getServicesByProvider(currentUser.id!);
        final List<dynamic> services = response['services'] ?? [];
        
        setState(() {
          _services = services.map((service) => {
            ...service,
            'isActive': true, // API'da bu field yok, varsayılan olarak true
          }).toList().cast<Map<String, dynamic>>();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Hizmetler yüklenirken hata: $e')),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _addOrEditService({Map<String, dynamic>? service}) {
    if (service != null) {
      // Düzenleme modu
      _nameController.text = service['name'];
      _descriptionController.text = service['description'];
      _priceController.text = service['price'].toString();
      _durationController.text = service['duration'].toString();
    } else {
      // Yeni ekleme modu
      _nameController.clear();
      _descriptionController.clear();
      _priceController.clear();
      _durationController.clear();
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(service != null ? 'Hizmeti Düzenle' : 'Yeni Hizmet Ekle'),
        content: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Hizmet Adı',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.medical_services),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Hizmet adı gerekli';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _descriptionController,
                  decoration: const InputDecoration(
                    labelText: 'Açıklama',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.description),
                  ),
                  maxLines: 3,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Açıklama gerekli';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _priceController,
                        decoration: const InputDecoration(
                          labelText: 'Fiyat (₺)',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.attach_money),
                        ),
                        keyboardType: TextInputType.number,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Fiyat gerekli';
                          }
                          if (double.tryParse(value) == null) {
                            return 'Geçerli bir fiyat girin';
                          }
                          return null;
                        },
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        controller: _durationController,
                        decoration: const InputDecoration(
                          labelText: 'Süre (dk)',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.timer),
                        ),
                        keyboardType: TextInputType.number,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Süre gerekli';
                          }
                          if (int.tryParse(value) == null) {
                            return 'Geçerli bir süre girin';
                          }
                          return null;
                        },
                      ),
                    ),
                  ],
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
            onPressed: () async {
              if (_formKey.currentState!.validate()) {
                Navigator.of(context).pop();
                await _saveService(service);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF667eea),
              foregroundColor: Colors.white,
            ),
            child: Text(service != null ? 'Güncelle' : 'Ekle'),
          ),
        ],
      ),
    );
  }

  Future<void> _saveService(Map<String, dynamic>? existingService) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final currentUser = authProvider.currentUser;
      
      if (currentUser == null) return;

      if (existingService != null) {
        // Güncelleme
        await ApiService.updateService(
          serviceId: existingService['id'],
          name: _nameController.text,
          description: _descriptionController.text,
          price: double.parse(_priceController.text),
          duration: int.parse(_durationController.text),
        );
      } else {
        // Yeni ekleme
        await ApiService.createService(
          name: _nameController.text,
          description: _descriptionController.text,
          price: double.parse(_priceController.text),
          duration: int.parse(_durationController.text),
          providerId: currentUser.id!,
        );
      }

      // Listeyi yeniden yükle
      await _loadServices();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(existingService != null ? 'Hizmet güncellendi' : 'Hizmet eklendi'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Hizmet kaydedilirken hata: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _deleteService(Map<String, dynamic> service) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hizmeti Sil'),
        content: Text('${service['name']} hizmetini silmek istediğinizden emin misiniz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();
              
              try {
                await ApiService.deleteService(service['id']);
                await _loadServices();
                
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Hizmet silindi'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Hizmet silinirken hata: $e'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Sil'),
          ),
        ],
      ),
    );
  }



  @override
  Widget build(BuildContext context) {
    return Consumer<LanguageProvider>(
      builder: (context, languageProvider, child) {
        return Scaffold(
          appBar: AppBar(
            title: Text(languageProvider.translate('my_services', fallback: 'Hizmetlerim')),
            backgroundColor: const Color(0xFF667eea),
            foregroundColor: Colors.white,
            actions: [
              IconButton(
                icon: const Icon(Icons.add),
                onPressed: () => _addOrEditService(),
                tooltip: 'Yeni Hizmet Ekle',
              ),
            ],
          ),
          body: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF667eea),
                  Color(0xFF764ba2),
                ],
              ),
            ),
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: Colors.white),
                  )
                : _services.isEmpty
                    ? const Center(
                        child: Card(
                          margin: EdgeInsets.all(24),
                          child: Padding(
                            padding: EdgeInsets.all(32),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.medical_services_outlined,
                                  size: 64,
                                  color: Colors.grey,
                                ),
                                SizedBox(height: 16),
                                Text(
                                  'Henüz hizmet eklenmemiş',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.grey,
                                  ),
                                ),
                                SizedBox(height: 8),
                                Text(
                                  'Yeni hizmet eklemek için + butonuna tıklayın',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _services.length,
                        itemBuilder: (context, index) {
                          final service = _services[index];
                          return _buildServiceCard(service);
                        },
                      ),
          ),
          floatingActionButton: FloatingActionButton(
            onPressed: () => _addOrEditService(),
            backgroundColor: const Color(0xFF667eea),
            foregroundColor: Colors.white,
            child: const Icon(Icons.add),
          ),
        );
      },
    );
  }

  Widget _buildServiceCard(Map<String, dynamic> service) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: const Color(0xFF667eea),
            width: 2,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Başlık
              Text(
                service['name'],
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF667eea),
                ),
              ),
              const SizedBox(height: 12),
              
              // Hizmet bilgileri
              Text(
                service['description'],
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 12),
              
              Row(
                children: [
                  Icon(Icons.attach_money, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    '${service['price']} ₺',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Icon(Icons.timer, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    '${service['duration']} dk',
                    style: const TextStyle(
                      fontSize: 14,
                      color: Colors.black87,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              
              // Aksiyon butonları
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _addOrEditService(service: service),
                      icon: const Icon(Icons.edit, size: 16),
                      label: const Text('Düzenle'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  ElevatedButton(
                    onPressed: () => _deleteService(service),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      minimumSize: const Size(48, 36),
                    ),
                    child: const Icon(Icons.delete, size: 16),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
} 