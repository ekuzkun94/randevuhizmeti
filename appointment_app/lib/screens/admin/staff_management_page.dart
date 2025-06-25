import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../../providers/language_provider.dart';
import 'dart:async';

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

  // Form controllers for staff
  final _staffNameController = TextEditingController();
  final _staffEmailController = TextEditingController();
  final _staffPositionController = TextEditingController();
  final _staffDepartmentController = TextEditingController();
  final _staffSalaryController = TextEditingController();

  // Form controllers for shifts
  final _shiftDateController = TextEditingController();
  final _shiftStartTimeController = TextEditingController();
  final _shiftEndTimeController = TextEditingController();
  String? _selectedStaffId;
  String? _selectedShiftType;

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
            _handleShiftAction(shift, value);
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
              if (_tabController.index == 0) {
                _submitStaffForm();
              } else {
                _submitShiftForm();
              }
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
          TextField(
            controller: _staffNameController,
            decoration: const InputDecoration(
              labelText: 'Ad Soyad',
              prefixIcon: Icon(Icons.person),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _staffEmailController,
            decoration: const InputDecoration(
              labelText: 'Email',
              prefixIcon: Icon(Icons.email),
            ),
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _staffPositionController,
            decoration: const InputDecoration(
              labelText: 'Pozisyon',
              prefixIcon: Icon(Icons.work),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _staffDepartmentController,
            decoration: const InputDecoration(
              labelText: 'Bölüm',
              prefixIcon: Icon(Icons.business),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _staffSalaryController,
            decoration: const InputDecoration(
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
            value: _selectedStaffId,
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
              setState(() {
                _selectedStaffId = value;
              });
            },
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _shiftDateController,
            decoration: const InputDecoration(
              labelText: 'Tarih (YYYY-MM-DD)',
              prefixIcon: Icon(Icons.calendar_today),
              hintText: '2024-01-01',
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _shiftStartTimeController,
                  decoration: const InputDecoration(
                    labelText: 'Başlama (HH:MM)',
                    prefixIcon: Icon(Icons.access_time),
                    hintText: '09:00',
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: TextField(
                  controller: _shiftEndTimeController,
                  decoration: const InputDecoration(
                    labelText: 'Bitiş (HH:MM)',
                    prefixIcon: Icon(Icons.access_time_filled),
                    hintText: '18:00',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            value: _selectedShiftType,
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
              setState(() {
                _selectedShiftType = value;
              });
            },
          ),
        ],
      ),
    );
  }

  void _showEditStaffDialog(Map<String, dynamic> staff) {
    // Mevcut bilgileri form'a yükle
    _staffNameController.text = staff['user_name'] ?? '';
    _staffEmailController.text = staff['user_email'] ?? '';
    _staffPositionController.text = staff['position'] ?? '';
    _staffDepartmentController.text = staff['department'] ?? '';
    _staffSalaryController.text = staff['salary']?.toString() ?? '';

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Personel Düzenle'),
        content: _buildAddStaffForm(),
        actions: [
          TextButton(
            onPressed: () {
              _clearStaffForm();
              Navigator.of(context).pop();
            },
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () => _updateStaff(staff['id']),
            child: const Text('Güncelle'),
          ),
        ],
      ),
    );
  }

  void _showStaffShifts(Map<String, dynamic> staff) {
    // Personele özel vardiyaları filtrele
    final staffShifts = shiftList
        .where((shift) => shift['user_id'] == staff['user_id'])
        .toList();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('${staff['user_name']} - Vardiyalar'),
        content: SizedBox(
          width: 400,
          height: 300,
          child: staffShifts.isEmpty
              ? const Center(child: Text('Bu personele ait vardiya bulunamadı'))
              : ListView.builder(
                  itemCount: staffShifts.length,
                  itemBuilder: (context, index) {
                    final shift = staffShifts[index];
                    return Card(
                      child: ListTile(
                        leading: Icon(
                          _getShiftStatusIcon(shift['status']),
                          color: _getShiftStatusColor(shift['status']),
                        ),
                        title: Text('${shift['shift_date']}'),
                        subtitle: Text(
                          '${shift['start_time']} - ${shift['end_time']}\n'
                          '${_getShiftTypeLabel(shift['shift_type'])} - ${_getShiftStatusLabel(shift['status'])}',
                        ),
                        isThreeLine: true,
                      ),
                    );
                  },
                ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Kapat'),
          ),
        ],
      ),
    );
  }

  void _deleteStaff(String staffId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Personeli Sil'),
        content: const Text(
            'Bu personeli silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await _performDeleteStaff(staffId);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Sil', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _handleShiftAction(Map<String, dynamic> shift, String action) {
    String newStatus;
    String actionMessage;

    switch (action) {
      case 'start':
        newStatus = 'started';
        actionMessage = 'başlatıldı';
        break;
      case 'complete':
        newStatus = 'completed';
        actionMessage = 'tamamlandı';
        break;
      case 'cancel':
        newStatus = 'cancelled';
        actionMessage = 'iptal edildi';
        break;
      case 'edit':
        _showEditShiftDialog(shift);
        return;
      default:
        return;
    }

    _updateShiftStatus(shift['id'], newStatus, actionMessage);
  }

  // Form submission metodları
  Future<void> _submitStaffForm() async {
    if (_staffNameController.text.isEmpty ||
        _staffEmailController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ad Soyad ve Email alanları zorunludur')),
      );
      return;
    }

    try {
      final response = await http.post(
        Uri.parse('http://localhost:5001/staff'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'user_name': _staffNameController.text,
          'user_email': _staffEmailController.text,
          'position': _staffPositionController.text,
          'department': _staffDepartmentController.text,
          'salary': _staffSalaryController.text.isNotEmpty
              ? double.tryParse(_staffSalaryController.text)
              : null,
        }),
      );

      if (response.statusCode == 201) {
        _clearStaffForm();
        Navigator.of(context).pop();
        await _loadStaff();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Personel başarıyla eklendi')),
        );
      } else {
        final errorData = json.decode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content:
                  Text('Hata: ${errorData['error'] ?? 'Bilinmeyen hata'}')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Bağlantı hatası: $e')),
      );
    }
  }

  Future<void> _submitShiftForm() async {
    if (_selectedStaffId == null ||
        _shiftDateController.text.isEmpty ||
        _shiftStartTimeController.text.isEmpty ||
        _shiftEndTimeController.text.isEmpty ||
        _selectedShiftType == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tüm alanlar zorunludur')),
      );
      return;
    }

    try {
      final response = await http.post(
        Uri.parse('http://localhost:5001/shifts'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'user_id': _selectedStaffId,
          'shift_date': _shiftDateController.text,
          'start_time': _shiftStartTimeController.text,
          'end_time': _shiftEndTimeController.text,
          'shift_type': _selectedShiftType,
          'status': 'scheduled',
        }),
      );

      if (response.statusCode == 201) {
        _clearShiftForm();
        Navigator.of(context).pop();
        await _loadShifts();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Vardiya başarıyla oluşturuldu')),
        );
      } else {
        final errorData = json.decode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content:
                  Text('Hata: ${errorData['error'] ?? 'Bilinmeyen hata'}')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Bağlantı hatası: $e')),
      );
    }
  }

  Future<void> _updateStaff(String staffId) async {
    try {
      final response = await http.put(
        Uri.parse('http://localhost:5001/staff/$staffId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'user_name': _staffNameController.text,
          'user_email': _staffEmailController.text,
          'position': _staffPositionController.text,
          'department': _staffDepartmentController.text,
          'salary': _staffSalaryController.text.isNotEmpty
              ? double.tryParse(_staffSalaryController.text)
              : null,
        }),
      );

      if (response.statusCode == 200) {
        _clearStaffForm();
        Navigator.of(context).pop();
        await _loadStaff();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Personel başarıyla güncellendi')),
        );
      } else {
        final errorData = json.decode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content:
                  Text('Hata: ${errorData['error'] ?? 'Bilinmeyen hata'}')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Bağlantı hatası: $e')),
      );
    }
  }

  Future<void> _performDeleteStaff(String staffId) async {
    try {
      final response = await http.delete(
        Uri.parse('http://localhost:5001/staff/$staffId'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        await _loadStaff();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Personel başarıyla silindi')),
        );
      } else {
        final errorData = json.decode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content:
                  Text('Hata: ${errorData['error'] ?? 'Bilinmeyen hata'}')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Bağlantı hatası: $e')),
      );
    }
  }

  Future<void> _updateShiftStatus(
      String shiftId, String newStatus, String actionMessage) async {
    try {
      final response = await http.put(
        Uri.parse('http://localhost:5001/shifts/$shiftId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'status': newStatus}),
      );

      if (response.statusCode == 200) {
        await _loadShifts();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Vardiya $actionMessage')),
        );
      } else {
        final errorData = json.decode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content:
                  Text('Hata: ${errorData['error'] ?? 'Bilinmeyen hata'}')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Bağlantı hatası: $e')),
      );
    }
  }

  void _showEditShiftDialog(Map<String, dynamic> shift) {
    // Form'u mevcut verilerle doldur
    _selectedStaffId = shift['user_id'];
    _shiftDateController.text = shift['shift_date'] ?? '';
    _shiftStartTimeController.text = shift['start_time'] ?? '';
    _shiftEndTimeController.text = shift['end_time'] ?? '';
    _selectedShiftType = shift['shift_type'];

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Vardiya Düzenle'),
        content: _buildAddShiftForm(),
        actions: [
          TextButton(
            onPressed: () {
              _clearShiftForm();
              Navigator.of(context).pop();
            },
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () => _updateShift(shift['id']),
            child: const Text('Güncelle'),
          ),
        ],
      ),
    );
  }

  Future<void> _updateShift(String shiftId) async {
    try {
      final response = await http.put(
        Uri.parse('http://localhost:5001/shifts/$shiftId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'user_id': _selectedStaffId,
          'shift_date': _shiftDateController.text,
          'start_time': _shiftStartTimeController.text,
          'end_time': _shiftEndTimeController.text,
          'shift_type': _selectedShiftType,
        }),
      );

      if (response.statusCode == 200) {
        _clearShiftForm();
        Navigator.of(context).pop();
        await _loadShifts();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Vardiya başarıyla güncellendi')),
        );
      } else {
        final errorData = json.decode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content:
                  Text('Hata: ${errorData['error'] ?? 'Bilinmeyen hata'}')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Bağlantı hatası: $e')),
      );
    }
  }

  // Form temizleme metodları
  void _clearStaffForm() {
    _staffNameController.clear();
    _staffEmailController.clear();
    _staffPositionController.clear();
    _staffDepartmentController.clear();
    _staffSalaryController.clear();
  }

  void _clearShiftForm() {
    _shiftDateController.clear();
    _shiftStartTimeController.clear();
    _shiftEndTimeController.clear();
    setState(() {
      _selectedStaffId = null;
      _selectedShiftType = null;
    });
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
    _staffNameController.dispose();
    _staffEmailController.dispose();
    _staffPositionController.dispose();
    _staffDepartmentController.dispose();
    _staffSalaryController.dispose();
    _shiftDateController.dispose();
    _shiftStartTimeController.dispose();
    _shiftEndTimeController.dispose();
    super.dispose();
  }
}
