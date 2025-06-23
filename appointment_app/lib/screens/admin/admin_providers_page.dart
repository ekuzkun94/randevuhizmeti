import 'package:flutter/material.dart';
import 'package:appointment_app/services/api_service.dart';
import 'dart:async';

class AdminProvidersPage extends StatefulWidget {
  const AdminProvidersPage({super.key});

  @override
  State<AdminProvidersPage> createState() => _AdminProvidersPageState();
}

class _AdminProvidersPageState extends State<AdminProvidersPage>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  List<Map<String, dynamic>> providers = [];
  List<Map<String, dynamic>> filteredProviders = [];
  bool isLoading = true;
  String searchQuery = '';
  String selectedFilter = 'all';
  Timer? _searchTimer;

  final Map<String, String> statusColors = {
    'active': '#4CAF50', // Green
    'inactive': '#9E9E9E', // Grey
    'pending': '#FFA726', // Orange
    'suspended': '#F44336', // Red
  };

  final Map<String, String> statusTranslations = {
    'active': 'Aktif',
    'inactive': 'Pasif',
    'pending': 'Beklemede',
    'suspended': 'Askıya Alındı',
  };

  final List<Map<String, dynamic>> providerCategories = [
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

    _loadProviders();
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _searchTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadProviders() async {
    setState(() => isLoading = true);
    try {
      final response = await ApiService.getProviders();
      if (response.containsKey('providers')) {
        setState(() {
          providers = List<Map<String, dynamic>>.from(response['providers']);
          _applyFilters();
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Sağlayıcılar yüklenirken hata: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _applyFilters() {
    filteredProviders = providers.where((provider) {
      final matchesFilter =
          selectedFilter == 'all' || provider['status'] == selectedFilter;

      final matchesSearch = searchQuery.isEmpty ||
          provider['name']?.toLowerCase().contains(searchQuery.toLowerCase()) ==
              true ||
          provider['email']
                  ?.toLowerCase()
                  .contains(searchQuery.toLowerCase()) ==
              true ||
          provider['specialization']
                  ?.toLowerCase()
                  .contains(searchQuery.toLowerCase()) ==
              true;

      return matchesFilter && matchesSearch;
    }).toList();

    // Sort by name
    filteredProviders.sort((a, b) {
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

                // Filters and Search
                _buildFiltersAndSearch(),

                // Providers List
                Expanded(
                  child: isLoading
                      ? _buildLoadingState()
                      : filteredProviders.isEmpty
                          ? _buildEmptyState()
                          : _buildProvidersList(),
                ),
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateProviderDialog(),
        backgroundColor: Colors.blue,
        icon: const Icon(Icons.add),
        label: const Text('Yeni Sağlayıcı'),
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
                  'Hizmet Sağlayıcıları',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  '${filteredProviders.length} sağlayıcı listeleniyor',
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
              Icons.business,
              color: Colors.white,
              size: 24,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFiltersAndSearch() {
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
                hintText: 'Sağlayıcı ara...',
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

          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('all', 'Tümü', Icons.apps),
                _buildFilterChip('active', 'Aktif', Icons.check_circle),
                _buildFilterChip('pending', 'Beklemede', Icons.hourglass_empty),
                _buildFilterChip('inactive', 'Pasif', Icons.pause_circle),
                _buildFilterChip('suspended', 'Askıda', Icons.block),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label, IconData icon) {
    final isSelected = selectedFilter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        selected: isSelected,
        label: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16),
            const SizedBox(width: 4),
            Text(label),
          ],
        ),
        onSelected: (selected) {
          setState(() {
            selectedFilter = value;
            _applyFilters();
          });
        },
        backgroundColor: Colors.white.withOpacity(0.1),
        selectedColor: Colors.blue,
        labelStyle: TextStyle(
          color: isSelected ? Colors.white : Colors.white.withOpacity(0.8),
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
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
            'Sağlayıcılar yükleniyor...',
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
              Icons.business_outlined,
              size: 64,
              color: Colors.white70,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Sağlayıcı bulunamadı',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            searchQuery.isNotEmpty
                ? 'Arama kriterinize uygun sağlayıcı yok'
                : 'Henüz hiç sağlayıcı eklenmemiş',
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withOpacity(0.7),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProvidersList() {
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: filteredProviders.length,
      itemBuilder: (context, index) {
        final provider = filteredProviders[index];
        return _buildProviderCard(provider);
      },
    );
  }

  Widget _buildProviderCard(Map<String, dynamic> provider) {
    final statusColor = Color(int.parse(
      statusColors[provider['status']]?.replaceFirst('#', '0xFF') ??
          '0xFF9E9E9E',
    ));

    final rating =
        double.tryParse(provider['rating']?.toString() ?? '0') ?? 0.0;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
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
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                Icons.business,
                color: statusColor,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    provider['name'] ?? 'Bilinmeyen Sağlayıcı',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    provider['email'] ?? 'Email yok',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white.withOpacity(0.8),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          statusTranslations[provider['status']] ??
                              provider['status'],
                          style: TextStyle(
                            fontSize: 10,
                            color: statusColor,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      if (rating > 0) ...[
                        Icon(Icons.star, size: 12, color: Colors.amber),
                        const SizedBox(width: 2),
                        Text(
                          rating.toStringAsFixed(1),
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.amber,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            Column(
              children: [
                ElevatedButton.icon(
                  onPressed: () => _showEditProviderDialog(provider),
                  icon: const Icon(Icons.edit, size: 16),
                  label: const Text('Düzenle'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                ),
                const SizedBox(height: 8),
                ElevatedButton.icon(
                  onPressed: () => _showStatusDialog(provider),
                  icon: const Icon(Icons.settings, size: 16),
                  label: const Text('Durum'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                    foregroundColor: Colors.white,
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showCreateProviderDialog() {
    _showProviderDialog();
  }

  void _showEditProviderDialog(Map<String, dynamic> provider) {
    _showProviderDialog(provider: provider);
  }

  void _showProviderDialog({Map<String, dynamic>? provider}) {
    final isEditing = provider != null;
    final nameController = TextEditingController(text: provider?['name'] ?? '');
    final emailController =
        TextEditingController(text: provider?['email'] ?? '');
    final phoneController =
        TextEditingController(text: provider?['phone'] ?? '');
    final specializationController =
        TextEditingController(text: provider?['specialization'] ?? '');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isEditing ? 'Sağlayıcı Düzenle' : 'Yeni Sağlayıcı Ekle'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(
                  labelText: 'İsim',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: emailController,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: phoneController,
                decoration: const InputDecoration(
                  labelText: 'Telefon',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: specializationController,
                decoration: const InputDecoration(
                  labelText: 'Uzmanlık Alanı',
                  border: OutlineInputBorder(),
                ),
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
            onPressed: () => _saveProvider(
              provider: provider,
              name: nameController.text,
              email: emailController.text,
              phone: phoneController.text,
              specialization: specializationController.text,
            ),
            child: Text(isEditing ? 'Güncelle' : 'Kaydet'),
          ),
        ],
      ),
    );
  }

  void _showStatusDialog(Map<String, dynamic> provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sağlayıcı Durumu Güncelle'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: statusTranslations.entries.map((entry) {
            return ListTile(
              title: Text(entry.value),
              leading: Icon(_getStatusIcon(entry.key)),
              onTap: () {
                Navigator.pop(context);
                _updateProviderStatus(provider['id'], entry.key);
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'active':
        return Icons.check_circle;
      case 'inactive':
        return Icons.pause_circle;
      case 'pending':
        return Icons.hourglass_empty;
      case 'suspended':
        return Icons.block;
      default:
        return Icons.help_outline;
    }
  }

  Future<void> _saveProvider({
    Map<String, dynamic>? provider,
    required String name,
    required String email,
    required String phone,
    required String specialization,
  }) async {
    if (name.isEmpty || email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('İsim ve email gerekli'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    Navigator.pop(context);

    try {
      if (provider != null) {
        // Update existing provider
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Sağlayıcı güncellendi'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        // Create new provider
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Yeni sağlayıcı eklendi'),
            backgroundColor: Colors.green,
          ),
        );
      }

      await _loadProviders();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Hata: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _updateProviderStatus(
      String providerId, String newStatus) async {
    try {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              'Sağlayıcı durumu güncellendi: ${statusTranslations[newStatus]}'),
          backgroundColor: Colors.green,
        ),
      );
      await _loadProviders();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Güncelleme hatası: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
