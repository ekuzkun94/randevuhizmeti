import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'dart:async';

class AdminRolesPage extends StatefulWidget {
  const AdminRolesPage({super.key});

  @override
  State<AdminRolesPage> createState() => _AdminRolesPageState();
}

class _AdminRolesPageState extends State<AdminRolesPage>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  List<Map<String, dynamic>> roles = [];
  List<Map<String, dynamic>> users = [];
  bool isLoading = true;
  int selectedTabIndex = 0;

  final List<Map<String, dynamic>> defaultRoles = [
    {
      'id': 'admin',
      'name': 'Admin',
      'description': 'Tam yetkili yönetici',
      'color': Colors.red,
      'icon': Icons.admin_panel_settings,
      'permissions': {
        'users': {'read': true, 'write': true, 'delete': true},
        'appointments': {'read': true, 'write': true, 'delete': true},
        'services': {'read': true, 'write': true, 'delete': true},
        'staff': {'read': true, 'write': true, 'delete': true},
        'analytics': {'read': true, 'write': true, 'delete': false},
        'settings': {'read': true, 'write': true, 'delete': false},
      },
    },
    {
      'id': 'manager',
      'name': 'Yönetici',
      'description': 'Departman yöneticisi',
      'color': Colors.orange,
      'icon': Icons.business_center,
      'permissions': {
        'users': {'read': true, 'write': true, 'delete': false},
        'appointments': {'read': true, 'write': true, 'delete': false},
        'services': {'read': true, 'write': true, 'delete': false},
        'staff': {'read': true, 'write': true, 'delete': false},
        'analytics': {'read': true, 'write': false, 'delete': false},
        'settings': {'read': true, 'write': false, 'delete': false},
      },
    },
    {
      'id': 'provider',
      'name': 'Hizmet Sağlayıcı',
      'description': 'Hizmet veren personel',
      'color': Colors.blue,
      'icon': Icons.work,
      'permissions': {
        'users': {'read': false, 'write': false, 'delete': false},
        'appointments': {'read': true, 'write': true, 'delete': false},
        'services': {'read': true, 'write': false, 'delete': false},
        'staff': {'read': false, 'write': false, 'delete': false},
        'analytics': {'read': false, 'write': false, 'delete': false},
        'settings': {'read': false, 'write': false, 'delete': false},
      },
    },
    {
      'id': 'customer',
      'name': 'Müşteri',
      'description': 'Hizmet alan kullanıcı',
      'color': Colors.green,
      'icon': Icons.person,
      'permissions': {
        'users': {'read': false, 'write': false, 'delete': false},
        'appointments': {'read': true, 'write': true, 'delete': false},
        'services': {'read': true, 'write': false, 'delete': false},
        'staff': {'read': false, 'write': false, 'delete': false},
        'analytics': {'read': false, 'write': false, 'delete': false},
        'settings': {'read': false, 'write': false, 'delete': false},
      },
    },
  ];

  final List<String> permissionModules = [
    'users',
    'appointments',
    'services',
    'staff',
    'analytics',
    'settings',
  ];

  final Map<String, String> moduleTranslations = {
    'users': 'Kullanıcılar',
    'appointments': 'Randevular',
    'services': 'Hizmetler',
    'staff': 'Personel',
    'analytics': 'Analitik',
    'settings': 'Ayarlar',
  };

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

    _loadData();
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => isLoading = true);
    try {
      // Load roles and users from API
      roles = List<Map<String, dynamic>>.from(defaultRoles);

      // Load users (mock data for now)
      users = [
        {
          'id': '1',
          'name': 'Admin User',
          'email': 'admin@example.com',
          'role': 'admin'
        },
        {
          'id': '2',
          'name': 'Manager User',
          'email': 'manager@example.com',
          'role': 'manager'
        },
        {
          'id': '3',
          'name': 'Provider User',
          'email': 'provider@example.com',
          'role': 'provider'
        },
        {
          'id': '4',
          'name': 'Customer User',
          'email': 'customer@example.com',
          'role': 'customer'
        },
      ];

      setState(() => isLoading = false);
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Veri yüklenirken hata: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _logout() async {
    // Çıkış onay dialogu göster
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1a1a2e),
        title: const Text(
          'Çıkış Yap',
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          'Oturumu kapatmak istediğinizden emin misiniz?',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('İptal', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
            ),
            child: const Text('Çıkış Yap'),
          ),
        ],
      ),
    );

    if (shouldLogout == true) {
      // Kullanıcı oturumunu kapat
      if (context.mounted) {
        context.go('/login');
      }
    }
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

                // Tab Bar
                _buildTabBar(),

                // Content
                Expanded(
                  child: isLoading
                      ? _buildLoadingState()
                      : selectedTabIndex == 0
                          ? _buildRolesTab()
                          : _buildUsersTab(),
                ),
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => selectedTabIndex == 0
            ? _showCreateRoleDialog()
            : _showUserRoleDialog(),
        backgroundColor: Colors.blue,
        icon: Icon(selectedTabIndex == 0 ? Icons.add : Icons.edit),
        label: Text(selectedTabIndex == 0 ? 'Yeni Rol' : 'Rol Ata'),
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
                  'Rol & İzin Yönetimi',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  selectedTabIndex == 0
                      ? '${roles.length} rol tanımlı'
                      : '${users.length} kullanıcı listeleniyor',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.admin_panel_settings,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          IconButton(
            onPressed: _logout,
            icon: const Icon(Icons.logout_rounded),
            color: Colors.redAccent,
            tooltip: 'Çıkış Yap',
            style: IconButton.styleFrom(
              backgroundColor: Colors.white.withValues(alpha: 0.1),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => selectedTabIndex = 0),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
                decoration: BoxDecoration(
                  color:
                      selectedTabIndex == 0 ? Colors.blue : Colors.transparent,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.group,
                      color:
                          selectedTabIndex == 0 ? Colors.white : Colors.white70,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Roller',
                      style: TextStyle(
                        fontSize: 18,
                        color: selectedTabIndex == 0
                            ? Colors.white
                            : Colors.white70,
                        fontWeight: selectedTabIndex == 0
                            ? FontWeight.w900
                            : FontWeight.w600,
                        shadows: selectedTabIndex == 0
                            ? [
                                Shadow(
                                  offset: const Offset(0, 1),
                                  blurRadius: 2,
                                  color: Colors.black.withValues(alpha: 0.5),
                                ),
                              ]
                            : null,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => selectedTabIndex = 1),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
                decoration: BoxDecoration(
                  color:
                      selectedTabIndex == 1 ? Colors.blue : Colors.transparent,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.people,
                      color:
                          selectedTabIndex == 1 ? Colors.white : Colors.white70,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Kullanıcılar',
                      style: TextStyle(
                        fontSize: 18,
                        color: selectedTabIndex == 1
                            ? Colors.white
                            : Colors.white70,
                        fontWeight: selectedTabIndex == 1
                            ? FontWeight.w900
                            : FontWeight.w600,
                        shadows: selectedTabIndex == 1
                            ? [
                                Shadow(
                                  offset: const Offset(0, 1),
                                  blurRadius: 2,
                                  color: Colors.black.withValues(alpha: 0.5),
                                ),
                              ]
                            : null,
                      ),
                    ),
                  ],
                ),
              ),
            ),
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
            'Yükleniyor...',
            style: TextStyle(color: Colors.white, fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildRolesTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: roles.length,
      itemBuilder: (context, index) {
        final role = roles[index];
        return _buildRoleCard(role);
      },
    );
  }

  Widget _buildUsersTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: users.length,
      itemBuilder: (context, index) {
        final user = users[index];
        return _buildUserCard(user);
      },
    );
  }

  Widget _buildRoleCard(Map<String, dynamic> role) {
    final permissions =
        Map<String, Map<String, bool>>.from(role['permissions']);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white.withValues(alpha: 0.1),
            Colors.white.withValues(alpha: 0.05),
          ],
        ),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.2),
          width: 1,
        ),
      ),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.all(20),
        childrenPadding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: role['color'].withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            role['icon'],
            color: role['color'],
            size: 24,
          ),
        ),
        title: Text(
          role['name'],
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              role['description'],
              style: TextStyle(
                fontSize: 14,
                color: Colors.white.withValues(alpha: 0.8),
              ),
            ),
            const SizedBox(height: 8),
            _buildPermissionSummary(permissions),
          ],
        ),
        children: [
          _buildPermissionDetails(role, permissions),
        ],
      ),
    );
  }

  Widget _buildPermissionSummary(Map<String, Map<String, bool>> permissions) {
    final totalPermissions = permissions.values
        .map((p) => p.values.where((v) => v).length)
        .fold<int>(0, (a, b) => a + b);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.blue.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        '$totalPermissions izin aktif',
        style: const TextStyle(
          fontSize: 12,
          color: Colors.blue,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildPermissionDetails(
      Map<String, dynamic> role, Map<String, Map<String, bool>> permissions) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'İzin Detayları',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          ...permissionModules.map((module) {
            final modulePerms = permissions[module] ?? {};
            return _buildModulePermissions(module, modulePerms);
          }).toList(),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _showEditRoleDialog(role),
                  icon: const Icon(Icons.edit, size: 16),
                  label: const Text('Düzenle'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed:
                    role['id'] != 'admin' ? () => _deleteRole(role) : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                ),
                child: const Icon(Icons.delete, size: 16),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildModulePermissions(String module, Map<String, bool> permissions) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            moduleTranslations[module] ?? module,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildPermissionChip(
                  'Okuma', permissions['read'] ?? false, Colors.green),
              const SizedBox(width: 8),
              _buildPermissionChip(
                  'Yazma', permissions['write'] ?? false, Colors.orange),
              const SizedBox(width: 8),
              _buildPermissionChip(
                  'Silme', permissions['delete'] ?? false, Colors.red),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPermissionChip(String label, bool hasPermission, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: hasPermission
            ? color.withValues(alpha: 0.2)
            : Colors.grey.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            hasPermission ? Icons.check : Icons.close,
            size: 12,
            color: hasPermission ? color : Colors.grey,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              color: hasPermission ? color : Colors.grey,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserCard(Map<String, dynamic> user) {
    final userRole = user['role'] ?? 'customer';
    final role = roles.firstWhere(
      (r) => r['id'] == userRole,
      orElse: () => roles.last,
    );

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white.withValues(alpha: 0.1),
            Colors.white.withValues(alpha: 0.05),
          ],
        ),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.2),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: role['color'].withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              role['icon'],
              color: role['color'],
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user['name'] ?? 'İsimsiz Kullanıcı',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  user['email'] ?? '',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withValues(alpha: 0.8),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: role['color'].withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    role['name'],
                    style: TextStyle(
                      fontSize: 12,
                      color: role['color'],
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton.icon(
            onPressed: () => _showChangeUserRoleDialog(user),
            icon: const Icon(Icons.edit, size: 16),
            label: const Text('Rol'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  void _showCreateRoleDialog() {
    _showRoleDialog();
  }

  void _showEditRoleDialog(Map<String, dynamic> role) {
    _showRoleDialog(role: role);
  }

  void _showRoleDialog({Map<String, dynamic>? role}) {
    final isEditing = role != null;
    final nameController = TextEditingController(text: role?['name'] ?? '');
    final descriptionController =
        TextEditingController(text: role?['description'] ?? '');

    Map<String, Map<String, bool>> tempPermissions = {};
    if (isEditing) {
      tempPermissions =
          Map<String, Map<String, bool>>.from(role['permissions']);
    } else {
      for (String module in permissionModules) {
        tempPermissions[module] = {
          'read': false,
          'write': false,
          'delete': false
        };
      }
    }

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(isEditing ? 'Rol Düzenle' : 'Yeni Rol Oluştur'),
          content: SizedBox(
            width: 400,
            height: 500,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: nameController,
                    decoration: const InputDecoration(
                      labelText: 'Rol Adı',
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
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'İzinler',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  ...permissionModules.map((module) {
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              moduleTranslations[module] ?? module,
                              style:
                                  const TextStyle(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: CheckboxListTile(
                                    title: const Text('Okuma',
                                        style: TextStyle(fontSize: 12)),
                                    value: tempPermissions[module]?['read'] ??
                                        false,
                                    onChanged: (value) {
                                      setDialogState(() {
                                        tempPermissions[module]!['read'] =
                                            value ?? false;
                                      });
                                    },
                                    dense: true,
                                    contentPadding: EdgeInsets.zero,
                                  ),
                                ),
                                Expanded(
                                  child: CheckboxListTile(
                                    title: const Text('Yazma',
                                        style: TextStyle(fontSize: 12)),
                                    value: tempPermissions[module]?['write'] ??
                                        false,
                                    onChanged: (value) {
                                      setDialogState(() {
                                        tempPermissions[module]!['write'] =
                                            value ?? false;
                                      });
                                    },
                                    dense: true,
                                    contentPadding: EdgeInsets.zero,
                                  ),
                                ),
                                Expanded(
                                  child: CheckboxListTile(
                                    title: const Text('Silme',
                                        style: TextStyle(fontSize: 12)),
                                    value: tempPermissions[module]?['delete'] ??
                                        false,
                                    onChanged: (value) {
                                      setDialogState(() {
                                        tempPermissions[module]!['delete'] =
                                            value ?? false;
                                      });
                                    },
                                    dense: true,
                                    contentPadding: EdgeInsets.zero,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('İptal'),
            ),
            ElevatedButton(
              onPressed: () => _saveRole(
                role: role,
                name: nameController.text,
                description: descriptionController.text,
                permissions: tempPermissions,
              ),
              child: Text(isEditing ? 'Güncelle' : 'Kaydet'),
            ),
          ],
        ),
      ),
    );
  }

  void _showUserRoleDialog() {
    // Implementation for assigning roles to users
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Kullanıcı rol atama özelliği yakında eklenecek!'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  void _showChangeUserRoleDialog(Map<String, dynamic> user) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('${user['name']} - Rol Değiştir'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: roles.map((role) {
            return ListTile(
              leading: Icon(role['icon'], color: role['color']),
              title: Text(role['name']),
              subtitle: Text(role['description']),
              onTap: () {
                Navigator.pop(context);
                _changeUserRole(user, role);
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  Future<void> _saveRole({
    Map<String, dynamic>? role,
    required String name,
    required String description,
    required Map<String, Map<String, bool>> permissions,
  }) async {
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Rol adı gerekli'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    Navigator.pop(context);

    final newRole = {
      'id': role?['id'] ?? name.toLowerCase().replaceAll(' ', '_'),
      'name': name,
      'description': description,
      'color': role?['color'] ?? Colors.purple,
      'icon': role?['icon'] ?? Icons.group,
      'permissions': permissions,
    };

    setState(() {
      if (role != null) {
        final index = roles.indexWhere((r) => r['id'] == role['id']);
        if (index != -1) {
          roles[index] = newRole;
        }
      } else {
        roles.add(newRole);
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content:
            Text(role != null ? 'Rol güncellendi' : 'Yeni rol oluşturuldu'),
        backgroundColor: Colors.green,
      ),
    );
  }

  Future<void> _deleteRole(Map<String, dynamic> role) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Rol Sil'),
        content:
            Text('${role['name']} rolünü silmek istediğinizden emin misiniz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Sil'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() {
        roles.removeWhere((r) => r['id'] == role['id']);
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Rol silindi'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  Future<void> _changeUserRole(
      Map<String, dynamic> user, Map<String, dynamic> role) async {
    try {
      // Update user role via API
      setState(() {
        final index = users.indexWhere((u) => u['id'] == user['id']);
        if (index != -1) {
          users[index]['role'] = role['id'];
        }
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              '${user['name']} kullanıcısının rolü ${role['name']} olarak güncellendi'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Rol güncelleme hatası: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
