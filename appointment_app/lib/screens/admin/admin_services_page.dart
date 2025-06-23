import 'package:flutter/material.dart';
import 'package:appointment_app/services/api_service.dart';
import 'dart:async';

class AdminServicesPage extends StatefulWidget {
  const AdminServicesPage({super.key});

  @override
  State<AdminServicesPage> createState() => _AdminServicesPageState();
}

class _AdminServicesPageState extends State<AdminServicesPage>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  List<Map<String, dynamic>> services = [];
  List<Map<String, dynamic>> filteredServices = [];
  bool isLoading = true;
  String searchQuery = '';
  Timer? _searchTimer;

  final List<Map<String, dynamic>> serviceCategories = [
    {
      'id': 'beauty',
      'name': 'Güzellik & Bakım',
      'icon': Icons.face,
      'color': Colors.pink
    },
    {
      'id': 'health',
      'name': 'Sağlık & Wellness',
      'icon': Icons.local_hospital,
      'color': Colors.green
    },
    {
      'id': 'fitness',
      'name': 'Fitness & Spor',
      'icon': Icons.fitness_center,
      'color': Colors.orange
    },
    {
      'id': 'education',
      'name': 'Eğitim & Danışmanlık',
      'icon': Icons.school,
      'color': Colors.blue
    },
    {
      'id': 'business',
      'name': 'İş & Hizmet',
      'icon': Icons.business,
      'color': Colors.purple
    },
    {
      'id': 'other',
      'name': 'Diğer',
      'icon': Icons.category,
      'color': Colors.grey
    },
  ];

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOut,
    ));

    _loadServices();
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _searchTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadServices() async {
    setState(() => isLoading = true);
    try {
      final response = await ApiService.getServices();
      if (response.containsKey('services')) {
        setState(() {
          services = List<Map<String, dynamic>>.from(response['services']);
          _applyFilters();
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Hizmetler yüklenirken hata: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _applyFilters() {
    filteredServices = services.where((service) {
      final matchesSearch = searchQuery.isEmpty ||
          service['name']?.toLowerCase().contains(searchQuery.toLowerCase()) ==
              true ||
          service['description']
                  ?.toLowerCase()
                  .contains(searchQuery.toLowerCase()) ==
              true;

      return matchesSearch;
    }).toList();

    // Sort by name
    filteredServices.sort((a, b) {
      final nameA = a['name']?.toString() ?? '';
      final nameB = b['name']?.toString() ?? '';
      return nameA.compareTo(nameB);
    });
  }

  void _onSearchChanged(String query) {
    _searchTimer?.cancel();
    _searchTimer = Timer(const Duration(milliseconds: 300), () {
      setState(() {
        searchQuery = query;
        _applyFilters();
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF1a1a2e),
              Color(0xFF16213e),
              Color(0xFF0f3460),
            ],
          ),
        ),
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: Column(
              children: [
                // Header
                _buildHeader(),

                // Search and Categories
                _buildSearchAndCategories(),

                // Services List
                Expanded(
                  child: isLoading
                      ? _buildLoadingState()
                      : filteredServices.isEmpty
                          ? _buildEmptyState()
                          : _buildServicesList(),
                ),
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateServiceDialog(),
        backgroundColor: Colors.blue,
        icon: const Icon(Icons.add),
        label: const Text('Yeni Hizmet'),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.arrow_back, color: Colors.white),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Hizmet Yönetimi',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  '${filteredServices.length} hizmet listeleniyor',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withOpacity(0.7),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.miscellaneous_services,
              color: Colors.white,
              size: 24,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndCategories() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: Column(
        children: [
          // Search Bar
          Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: TextField(
              onChanged: _onSearchChanged,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Hizmet ara...',
                hintStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                prefixIcon:
                    Icon(Icons.search, color: Colors.white.withOpacity(0.7)),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: Colors.transparent,
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Categories
          Container(
            height: 100,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: serviceCategories.length,
              itemBuilder: (context, index) {
                final category = serviceCategories[index];
                return _buildCategoryCard(category);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryCard(Map<String, dynamic> category) {
    return Container(
      width: 80,
      margin: const EdgeInsets.only(right: 12),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: category['color'].withOpacity(0.2),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: category['color'].withOpacity(0.3),
                width: 1,
              ),
            ),
            child: Icon(
              category['icon'],
              color: category['color'],
              size: 24,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            category['name'],
            style: const TextStyle(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: Colors.white),
          SizedBox(height: 16),
          Text(
            'Hizmetler yükleniyor...',
            style: TextStyle(color: Colors.white, fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.room_service_outlined,
              size: 64,
              color: Colors.white70,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Hizmet bulunamadı',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            searchQuery.isNotEmpty
                ? 'Arama kriterinize uygun hizmet yok'
                : 'Henüz hiç hizmet eklenmemiş',
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withOpacity(0.7),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildServicesList() {
    return GridView.builder(
      padding: const EdgeInsets.all(20),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: MediaQuery.of(context).size.width > 800 ? 3 : 2,
        childAspectRatio: 0.8,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: filteredServices.length,
      itemBuilder: (context, index) {
        final service = filteredServices[index];
        return _buildServiceCard(service);
      },
    );
  }

  Widget _buildServiceCard(Map<String, dynamic> service) {
    final price = double.tryParse(service['price']?.toString() ?? '0') ?? 0.0;
    final duration = service['duration'] ?? 30;

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white.withOpacity(0.1),
            Colors.white.withOpacity(0.05),
          ],
        ),
        border: Border.all(
          color: Colors.white.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Service Header
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.room_service,
                    color: Colors.blue,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    service['name'] ?? 'Hizmet',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),

          // Service Details
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    service['description'] ?? 'Açıklama yok',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white.withOpacity(0.7),
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 12),

                  // Duration and Price
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.timer,
                                size: 14, color: Colors.orange),
                            const SizedBox(width: 4),
                            Text(
                              '$duration dk',
                              style: const TextStyle(
                                color: Colors.orange,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.attach_money,
                                size: 14, color: Colors.green),
                            const SizedBox(width: 4),
                            Text(
                              '₺${price.toStringAsFixed(0)}',
                              style: const TextStyle(
                                color: Colors.green,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Action Buttons
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _showEditServiceDialog(service),
                    icon: const Icon(Icons.edit, size: 14),
                    label: const Text('Düzenle'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () => _showDeleteConfirmation(service),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    padding:
                        const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                  ),
                  child: const Icon(Icons.delete, size: 16),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showCreateServiceDialog() {
    _showServiceDialog();
  }

  void _showEditServiceDialog(Map<String, dynamic> service) {
    _showServiceDialog(service: service);
  }

  void _showServiceDialog({Map<String, dynamic>? service}) {
    final isEditing = service != null;
    final nameController = TextEditingController(text: service?['name'] ?? '');
    final descriptionController =
        TextEditingController(text: service?['description'] ?? '');
    final priceController =
        TextEditingController(text: service?['price']?.toString() ?? '');
    final durationController =
        TextEditingController(text: service?['duration']?.toString() ?? '30');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isEditing ? 'Hizmet Düzenle' : 'Yeni Hizmet Ekle'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(
                  labelText: 'Hizmet Adı',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Açıklama',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: priceController,
                      decoration: const InputDecoration(
                        labelText: 'Fiyat (₺)',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextField(
                      controller: durationController,
                      decoration: const InputDecoration(
                        labelText: 'Süre (dk)',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () => _saveService(
              service: service,
              name: nameController.text,
              description: descriptionController.text,
              price: double.tryParse(priceController.text) ?? 0.0,
              duration: int.tryParse(durationController.text) ?? 30,
            ),
            child: Text(isEditing ? 'Güncelle' : 'Kaydet'),
          ),
        ],
      ),
    );
  }

  Future<void> _saveService({
    Map<String, dynamic>? service,
    required String name,
    required String description,
    required double price,
    required int duration,
  }) async {
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Hizmet adı gerekli'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    Navigator.pop(context);

    try {
      if (service != null) {
        // Update existing service
        await ApiService.updateService(
          serviceId: service['id'],
          name: name,
          description: description,
          duration: duration,
          price: price,
        );
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Hizmet güncellendi'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        // Create new service
        await ApiService.createService(
          name: name,
          description: description,
          duration: duration,
          price: price,
          providerId: 'prov-001', // This should be dynamic
        );
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Yeni hizmet eklendi'),
            backgroundColor: Colors.green,
          ),
        );
      }

      await _loadServices();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Hata: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showDeleteConfirmation(Map<String, dynamic> service) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hizmeti Sil'),
        content: Text(
            '${service['name']} hizmetini silmek istediğinizden emin misiniz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () => _deleteService(service),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Sil'),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteService(Map<String, dynamic> service) async {
    Navigator.pop(context);

    try {
      await ApiService.deleteService(service['id']);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Hizmet silindi'),
          backgroundColor: Colors.green,
        ),
      );
      await _loadServices();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Silme hatası: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
