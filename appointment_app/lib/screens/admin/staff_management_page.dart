import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';

class StaffManagementPage extends StatefulWidget {
  const StaffManagementPage({super.key});

  @override
  State<StaffManagementPage> createState() => _StaffManagementPageState();
}

class _StaffManagementPageState extends State<StaffManagementPage>
    with TickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> staffList = [];
  List<Map<String, dynamic>> shiftList = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  Future<void> _loadData() async {
    await Future.wait([
      _loadStaff(),
      _loadShifts(),
    ]);
    setState(() {
      isLoading = false;
    });
  }

  Future<void> _loadStaff() async {
    try {
      final response = await http.get(
        Uri.parse('http://localhost:5001/staff'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          staffList = List<Map<String, dynamic>>.from(data['staff'] ?? []);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Personel verisi yüklenemedi: $e')),
        );
      }
    }
  }

  Future<void> _loadShifts() async {
    try {
      final response = await http.get(
        Uri.parse('http://localhost:5001/shifts'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          shiftList = List<Map<String, dynamic>>.from(data['shifts'] ?? []);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Vardiya verisi yüklenemedi: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final languageProvider = Provider.of<LanguageProvider>(context);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(languageProvider.translate('staff_management') ??
            'Personel Yönetimi'),
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
      body: isLoading
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
      child: ListView.builder(
        padding: const EdgeInsets.all(16.0),
        itemCount: staffList.length,
        itemBuilder: (context, index) {
          final staff = staffList[index];
          return _buildStaffCard(staff);
        },
      ),
    );
  }

  Widget _buildStaffCard(Map<String, dynamic> staff) {
    return Card(
      elevation: 4,
      margin: const EdgeInsets.only(bottom: 16.0),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Theme.of(context).primaryColor,
          child: Text(
            (staff['user_name'] ?? 'U')[0].toUpperCase(),
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold),
          ),
        ),
        title: Text(
          staff['user_name'] ?? 'İsimsiz',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Pozisyon: ${staff['position'] ?? 'Belirtilmemiş'}'),
            Text('Bölüm: ${staff['department'] ?? 'Belirtilmemiş'}'),
            Text('Email: ${staff['user_email'] ?? 'Belirtilmemiş'}'),
            if (staff['salary'] != null) Text('Maaş: ₺${staff['salary']}'),
          ],
        ),
        trailing: PopupMenuButton(
          itemBuilder: (context) => [
            const PopupMenuItem(
              value: 'edit',
              child: Row(
                children: [
                  Icon(Icons.edit),
                  SizedBox(width: 8),
                  Text('Düzenle'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'shifts',
              child: Row(
                children: [
                  Icon(Icons.schedule),
                  SizedBox(width: 8),
                  Text('Vardiyalar'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'delete',
              child: Row(
                children: [
                  Icon(Icons.delete, color: Colors.red),
                  SizedBox(width: 8),
                  Text('Sil', style: TextStyle(color: Colors.red)),
                ],
              ),
            ),
          ],
          onSelected: (value) {
            switch (value) {
              case 'edit':
                _showEditStaffDialog(staff);
                break;
              case 'shifts':
                _showStaffShifts(staff);
                break;
              case 'delete':
                _deleteStaff(staff['id']);
                break;
            }
          },
        ),
        isThreeLine: true,
      ),
    );
  }

  Widget _buildShiftsTab() {
    return RefreshIndicator(
      onRefresh: _loadShifts,
      child: ListView.builder(
        padding: const EdgeInsets.all(16.0),
        itemCount: shiftList.length,
        itemBuilder: (context, index) {
          final shift = shiftList[index];
          return _buildShiftCard(shift);
        },
      ),
    );
  }

  Widget _buildShiftCard(Map<String, dynamic> shift) {
    return Card(
      elevation: 4,
      margin: const EdgeInsets.only(bottom: 16.0),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: _getShiftStatusColor(shift['status']),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            _getShiftStatusIcon(shift['status']),
            color: Colors.white,
          ),
        ),
        title: Text(
          shift['staff_name'] ?? 'İsimsiz Personel',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Tarih: ${shift['shift_date'] ?? 'Belirtilmemiş'}'),
            Text('Saat: ${shift['start_time']} - ${shift['end_time']}'),
            Text('Tip: ${_getShiftTypeLabel(shift['shift_type'])}'),
            Text('Durum: ${_getShiftStatusLabel(shift['status'])}'),
            if (shift['notes']?.isNotEmpty == true)
              Text('Not: ${shift['notes']}'),
          ],
        ),
        trailing: PopupMenuButton(
          itemBuilder: (context) => [
            const PopupMenuItem(
              value: 'edit',
              child: Row(
                children: [
                  Icon(Icons.edit),
                  SizedBox(width: 8),
                  Text('Düzenle'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'start',
              child: Row(
                children: [
                  Icon(Icons.play_arrow, color: Colors.green),
                  SizedBox(width: 8),
                  Text('Başlat'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'complete',
              child: Row(
                children: [
                  Icon(Icons.check, color: Colors.blue),
                  SizedBox(width: 8),
                  Text('Tamamla'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'cancel',
              child: Row(
                children: [
                  Icon(Icons.cancel, color: Colors.red),
                  SizedBox(width: 8),
                  Text('İptal Et'),
                ],
              ),
            ),
          ],
          onSelected: (value) {
            _handleShiftAction(shift, value as String);
          },
        ),
        isThreeLine: true,
      ),
    );
  }

  void _showAddDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(_tabController.index == 0
            ? 'Yeni Personel Ekle'
            : 'Yeni Vardiya Oluştur'),
        content: _tabController.index == 0
            ? _buildAddStaffForm()
            : _buildAddShiftForm(),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () {
              // TODO: Form submit logic
              Navigator.of(context).pop();
            },
            child: const Text('Kaydet'),
          ),
        ],
      ),
    );
  }

  Widget _buildAddStaffForm() {
    return SizedBox(
      width: 300,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const TextField(
            decoration: InputDecoration(
              labelText: 'Ad Soyad',
              prefixIcon: Icon(Icons.person),
            ),
          ),
          const SizedBox(height: 16),
          const TextField(
            decoration: InputDecoration(
              labelText: 'Email',
              prefixIcon: Icon(Icons.email),
            ),
          ),
          const SizedBox(height: 16),
          const TextField(
            decoration: InputDecoration(
              labelText: 'Pozisyon',
              prefixIcon: Icon(Icons.work),
            ),
          ),
          const SizedBox(height: 16),
          const TextField(
            decoration: InputDecoration(
              labelText: 'Bölüm',
              prefixIcon: Icon(Icons.business),
            ),
          ),
          const SizedBox(height: 16),
          const TextField(
            decoration: InputDecoration(
              labelText: 'Maaş',
              prefixIcon: Icon(Icons.money),
            ),
            keyboardType: TextInputType.number,
          ),
        ],
      ),
    );
  }

  Widget _buildAddShiftForm() {
    return SizedBox(
      width: 300,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          DropdownButtonFormField<String>(
            decoration: const InputDecoration(
              labelText: 'Personel',
              prefixIcon: Icon(Icons.person),
            ),
            items: staffList.map<DropdownMenuItem<String>>((staff) {
              return DropdownMenuItem<String>(
                value: staff['id'],
                child: Text(staff['user_name'] ?? 'İsimsiz'),
              );
            }).toList(),
            onChanged: (value) {
              // TODO: Handle selection
            },
          ),
          const SizedBox(height: 16),
          const TextField(
            decoration: InputDecoration(
              labelText: 'Tarih (YYYY-MM-DD)',
              prefixIcon: Icon(Icons.calendar_today),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: const TextField(
                  decoration: InputDecoration(
                    labelText: 'Başlama (HH:MM)',
                    prefixIcon: Icon(Icons.access_time),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: const TextField(
                  decoration: InputDecoration(
                    labelText: 'Bitiş (HH:MM)',
                    prefixIcon: Icon(Icons.access_time_filled),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            decoration: const InputDecoration(
              labelText: 'Vardiya Tipi',
              prefixIcon: Icon(Icons.category),
            ),
            items: const [
              DropdownMenuItem(value: 'regular', child: Text('Normal')),
              DropdownMenuItem(value: 'overtime', child: Text('Mesai')),
              DropdownMenuItem(value: 'holiday', child: Text('Tatil')),
            ],
            onChanged: (value) {
              // TODO: Handle selection
            },
          ),
        ],
      ),
    );
  }

  void _showEditStaffDialog(Map<String, dynamic> staff) {
    // TODO: Implement edit staff dialog
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Düzenleme özelliği yakında eklenecek')),
    );
  }

  void _showStaffShifts(Map<String, dynamic> staff) {
    // TODO: Show staff specific shifts
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${staff['user_name']} vardiyaları gösteriliyor')),
    );
  }

  void _deleteStaff(String staffId) {
    // TODO: Implement delete staff
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Silme özelliği yakında eklenecek')),
    );
  }

  void _handleShiftAction(Map<String, dynamic> shift, String action) {
    // TODO: Implement shift status updates
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Vardiya $action işlemi yakında eklenecek')),
    );
  }

  String _getShiftTypeLabel(String? type) {
    switch (type) {
      case 'regular':
        return 'Normal';
      case 'overtime':
        return 'Mesai';
      case 'holiday':
        return 'Tatil';
      default:
        return type ?? 'Belirtilmemiş';
    }
  }

  String _getShiftStatusLabel(String? status) {
    switch (status) {
      case 'scheduled':
        return 'Planlandı';
      case 'started':
        return 'Başladı';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal';
      default:
        return status ?? 'Belirtilmemiş';
    }
  }

  IconData _getShiftStatusIcon(String? status) {
    switch (status) {
      case 'scheduled':
        return Icons.schedule;
      case 'started':
        return Icons.play_arrow;
      case 'completed':
        return Icons.check_circle;
      case 'cancelled':
        return Icons.cancel;
      default:
        return Icons.help;
    }
  }

  Color _getShiftStatusColor(String? status) {
    switch (status) {
      case 'scheduled':
        return Colors.orange;
      case 'started':
        return Colors.green;
      case 'completed':
        return Colors.blue;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
}
