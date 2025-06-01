import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../models/user_model.dart';

class AdminUsersPage extends StatefulWidget {
  const AdminUsersPage({super.key});

  @override
  State<AdminUsersPage> createState() => _AdminUsersPageState();
}

class _AdminUsersPageState extends State<AdminUsersPage> {
  bool _isLoading = true;
  String? _error;
  List<UserModel> _users = [];
  String _selectedRole = 'all';

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  Future<void> _loadUsers() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      Query query = FirebaseFirestore.instance.collection('users');

      // Rol filtresi
      if (_selectedRole != null && _selectedRole != 'all') {
        query = query.where('role', isEqualTo: _selectedRole);
      }

      final snapshot = await query.get();
      final users = snapshot.docs.map((doc) {
        try {
          return UserModel.fromMap(doc.data() as Map<String, dynamic>);
        } catch (e) {
          print('Kullanıcı dönüştürme hatası: $e');
          return null;
        }
      }).where((user) => user != null).cast<UserModel>().toList();

      setState(() {
        _users = users;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Kullanıcılar yüklenemedi: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _updateUserRole(String userId, String newRole) async {
    try {
      await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .update({'role': newRole});
      await _loadUsers();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Kullanıcı rolü güncellendi')),
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

  Future<void> _deleteUser(String userId) async {
    try {
      await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .delete();
      await _loadUsers();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Kullanıcı silindi')),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kullanıcı Yönetimi'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: DropdownButtonFormField<String>(
              value: _selectedRole,
              decoration: const InputDecoration(
                labelText: 'Rol Filtresi',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(value: 'all', child: Text('Tümü')),
                DropdownMenuItem(value: 'customer', child: Text('Müşteri')),
                DropdownMenuItem(value: 'serviceProvider', child: Text('Hizmet Sağlayıcı')),
                DropdownMenuItem(value: 'admin', child: Text('Admin')),
              ],
              onChanged: (value) {
                if (value != null) {
                  setState(() {
                    _selectedRole = value;
                  });
                  _loadUsers();
                }
              },
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(child: Text(_error!))
                    : _users.isEmpty
                        ? const Center(child: Text('Kullanıcı bulunamadı'))
                        : ListView.builder(
                            itemCount: _users.length,
                            itemBuilder: (context, index) {
                              final user = _users[index];
                              return Card(
                                margin: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 8,
                                ),
                                child: ListTile(
                                  title: Text(user.name),
                                  subtitle: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(user.email),
                                      if (user.phone != null) Text(user.phone!),
                                      if (user.businessName != null)
                                        Text('İşletme: ${user.businessName}'),
                                    ],
                                  ),
                                  trailing: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      DropdownButton<String>(
                                        value: user.role.toString().split('.').last,
                                        items: const [
                                          DropdownMenuItem(
                                            value: 'customer',
                                            child: Text('Müşteri'),
                                          ),
                                          DropdownMenuItem(
                                            value: 'serviceProvider',
                                            child: Text('Hizmet Sağlayıcı'),
                                          ),
                                          DropdownMenuItem(
                                            value: 'admin',
                                            child: Text('Admin'),
                                          ),
                                        ],
                                        onChanged: (value) {
                                          if (value != null) {
                                            _updateUserRole(user.id, value);
                                          }
                                        },
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.delete),
                                        onPressed: () {
                                          showDialog(
                                            context: context,
                                            builder: (context) => AlertDialog(
                                              title: const Text('Kullanıcıyı Sil'),
                                              content: const Text(
                                                'Bu kullanıcıyı silmek istediğinizden emin misiniz?',
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
                                                    _deleteUser(user.id);
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
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
} 