import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:appointment_app/providers/language_provider.dart';


class AdminUsersPage extends StatefulWidget {
  const AdminUsersPage({super.key});

  @override
  State<AdminUsersPage> createState() => _AdminUsersPageState();
}

class _AdminUsersPageState extends State<AdminUsersPage> {
  List<Map<String, dynamic>> _users = [];
  bool _isLoading = true;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Fallback veriler kullan
      setState(() {
        _users = [
          {
            'id': 'admin-001',
            'name': 'Admin User',
            'email': 'admin@example.com',
            'role_id': '1',
          },
          {
            'id': 'provider-001',
            'name': 'Dr. Ahmet Yılmaz',
            'email': 'ahmet@example.com',
            'role_id': '2',
          },
          {
            'id': 'customer-001',
            'name': 'Mehmet Kaya',
            'email': 'mehmet@example.com',
            'role_id': '3',
          },
        ];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Veri yükleme hatası: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  List<Map<String, dynamic>> get _filteredUsers {
    if (_searchQuery.isEmpty) return _users;
    
    return _users.where((user) {
      final name = user['name'].toString().toLowerCase();
      final email = user['email'].toString().toLowerCase();
      final query = _searchQuery.toLowerCase();
      return name.contains(query) || email.contains(query);
    }).toList();
  }

  String _getLocalizedRoleName(String roleId, LanguageProvider languageProvider) {
    switch (roleId) {
      case '1': return languageProvider.translate('admin');
      case '2': return languageProvider.translate('provider');
      case '3': return languageProvider.translate('customer');
      default: return languageProvider.translate('unknown_role', fallback: 'Bilinmeyen');
    }
  }

  Color _getRoleColor(String roleId) {
    switch (roleId) {
      case '1': return Colors.red;
      case '2': return Colors.green;
      case '3': return Colors.blue;
      default: return Colors.grey;
    }
  }

  Future<void> _deleteUser(String userId, String userName) async {
    final languageProvider = Provider.of<LanguageProvider>(context, listen: false);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(languageProvider.translate('delete_user', fallback: 'Kullanıcı Sil')),
        content: Text('$userName ${languageProvider.translate('confirm_delete', fallback: 'kullanıcısını silmek istediğinizden emin misiniz?')}'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(languageProvider.translate('cancel', fallback: 'İptal')),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: Text(languageProvider.translate('delete', fallback: 'Sil')),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        // Simulated delete
        setState(() {
          _users.removeWhere((user) => user['id'] == userId);
        });
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(languageProvider.translate('user_deleted', fallback: 'Kullanıcı başarıyla silindi')),
              backgroundColor: Colors.green,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Silme hatası: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Consumer<LanguageProvider>(
          builder: (context, languageProvider, child) {
            return Text(languageProvider.translate('user_management', fallback: 'Kullanıcı Yönetimi'));
          },
        ),
        backgroundColor: const Color(0xFF667eea),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            onPressed: _loadData,
            icon: const Icon(Icons.refresh),
            tooltip: 'Yenile',
          ),
          IconButton(
            icon: const Icon(Icons.home),
            tooltip: 'Ana Sayfaya Dön',
            onPressed: () => context.go('/'),
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
        child: Column(
          children: [
            // Arama ve Ekle butonu
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  Expanded(
                    child: Consumer<LanguageProvider>(
                      builder: (context, languageProvider, child) {
                        return TextField(
                          decoration: InputDecoration(
                            hintText: languageProvider.translate('search_user', fallback: 'Kullanıcı ara...'),
                            prefixIcon: const Icon(Icons.search),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            filled: true,
                            fillColor: Colors.white,
                          ),
                          onChanged: (value) {
                            setState(() {
                              _searchQuery = value;
                            });
                          },
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Consumer<LanguageProvider>(
                    builder: (context, languageProvider, child) {
                      return ElevatedButton.icon(
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Kullanıcı ekleme yakında!')),
                          );
                        },
                        icon: const Icon(Icons.add),
                        label: Text(languageProvider.translate('new_user', fallback: 'Yeni Kullanıcı')),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFF667eea),
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
            
            // Kullanıcı listesi
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(color: Colors.white),
                    )
                  : _filteredUsers.isEmpty
                      ? Center(
                          child: Consumer<LanguageProvider>(
                            builder: (context, languageProvider, child) {
                              return Text(
                                languageProvider.translate('no_users_found', fallback: 'Kullanıcı bulunamadı'),
                                style: const TextStyle(color: Colors.white, fontSize: 18),
                              );
                            },
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _filteredUsers.length,
                          itemBuilder: (context, index) {
                            final user = _filteredUsers[index];
                            final roleColor = _getRoleColor(user['role_id']);

                            return Consumer<LanguageProvider>(
                              builder: (context, languageProvider, child) {
                                final roleName = _getLocalizedRoleName(user['role_id'], languageProvider);
                                
                                return Card(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  child: ListTile(
                                    leading: CircleAvatar(
                                      backgroundColor: roleColor,
                                      child: Text(
                                        user['name'][0].toUpperCase(),
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    title: Text(
                                      user['name'],
                                      style: const TextStyle(fontWeight: FontWeight.bold),
                                    ),
                                    subtitle: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(user['email']),
                                        const SizedBox(height: 4),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: roleColor.withValues(alpha: 0.1),
                                            borderRadius: BorderRadius.circular(12),
                                            border: Border.all(color: roleColor.withValues(alpha: 0.3)),
                                          ),
                                          child: Text(
                                            roleName,
                                            style: TextStyle(
                                              color: roleColor,
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    trailing: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        IconButton(
                                          onPressed: () {
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              const SnackBar(content: Text('Kullanıcı düzenleme yakında!')),
                                            );
                                          },
                                          icon: const Icon(Icons.edit),
                                          color: Colors.blue,
                                        ),
                                        if (user['role_id'] != '1') // Admin silinemesin
                                          IconButton(
                                            onPressed: () => _deleteUser(user['id'], user['name']),
                                            icon: const Icon(Icons.delete),
                                            color: Colors.red,
                                          ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
} 