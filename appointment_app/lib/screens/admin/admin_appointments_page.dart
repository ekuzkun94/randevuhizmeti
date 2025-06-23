import 'package:flutter/material.dart';
import 'package:appointment_app/services/api_service.dart';
import 'dart:async';

class AdminAppointmentsPage extends StatefulWidget {
  const AdminAppointmentsPage({super.key});

  @override
  State<AdminAppointmentsPage> createState() => _AdminAppointmentsPageState();
}

class _AdminAppointmentsPageState extends State<AdminAppointmentsPage>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  List<Map<String, dynamic>> appointments = [];
  List<Map<String, dynamic>> filteredAppointments = [];
  bool isLoading = true;
  String selectedFilter = 'all';
  String searchQuery = '';
  Timer? _searchTimer;

  final Map<String, String> statusColors = {
    'pending': '#FFA726', // Orange
    'confirmed': '#4CAF50', // Green
    'completed': '#2196F3', // Blue
    'cancelled': '#F44336', // Red
    'in_progress': '#9C27B0', // Purple
  };

  final Map<String, String> statusTranslations = {
    'pending': 'Beklemede',
    'confirmed': 'Onaylandı',
    'completed': 'Tamamlandı',
    'cancelled': 'İptal Edildi',
    'in_progress': 'Devam Ediyor',
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

    _loadAppointments();
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _searchTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadAppointments() async {
    setState(() => isLoading = true);
    try {
      final response = await ApiService.getAppointments();
      if (response.containsKey('appointments')) {
        setState(() {
          appointments = List<Map<String, dynamic>>.from(
            response['appointments'].map((apt) => {
                  ...apt,
                  'approval_level': apt['approval_level'] ?? 0,
                  'approvers': apt['approvers'] ?? [],
                  'approval_status': apt['approval_status'] ?? 'pending',
                }),
          );
          _applyFilters();
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() => isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Randevular yüklenirken hata: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _applyFilters() {
    filteredAppointments = appointments.where((apt) {
      final matchesFilter = selectedFilter == 'all' ||
          apt['status'] == selectedFilter ||
          apt['approval_status'] == selectedFilter;

      final matchesSearch = searchQuery.isEmpty ||
          apt['customer_name']
                  ?.toLowerCase()
                  .contains(searchQuery.toLowerCase()) ==
              true ||
          apt['service_name']
                  ?.toLowerCase()
                  .contains(searchQuery.toLowerCase()) ==
              true ||
          apt['provider_name']
                  ?.toLowerCase()
                  .contains(searchQuery.toLowerCase()) ==
              true;

      return matchesFilter && matchesSearch;
    }).toList();

    // Sort by appointment date (newest first)
    filteredAppointments.sort((a, b) {
      final dateA =
          DateTime.tryParse(a['appointment_date'] ?? '') ?? DateTime.now();
      final dateB =
          DateTime.tryParse(b['appointment_date'] ?? '') ?? DateTime.now();
      return dateB.compareTo(dateA);
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

  Future<void> _updateAppointmentStatus(
      String appointmentId, String newStatus) async {
    try {
      await ApiService.updateAppointmentStatus(appointmentId, newStatus);
      await _loadAppointments();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                'Randevu durumu güncellendi: ${statusTranslations[newStatus]}'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Güncelleme hatası: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _showApprovalDialog(Map<String, dynamic> appointment) async {
    return showDialog(
      context: context,
      builder: (context) => ApprovalDialog(
        appointment: appointment,
        onApprove: (level, approvers) =>
            _processApproval(appointment['id'], level, approvers),
      ),
    );
  }

  Future<void> _processApproval(
      String appointmentId, int level, List<String> approvers) async {
    // Implementation for approval process
    try {
      // This would be implemented in the API
      await _loadAppointments();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Onay seviyesi güncellendi: $level'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Onay güncellenemedi: $e'),
            backgroundColor: Colors.red,
          ),
        );
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

                // Filters and Search
                _buildFiltersAndSearch(),

                // Appointments List
                Expanded(
                  child: isLoading
                      ? _buildLoadingState()
                      : filteredAppointments.isEmpty
                          ? _buildEmptyState()
                          : _buildAppointmentsList(),
                ),
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateAppointmentDialog(),
        backgroundColor: Colors.blue,
        icon: const Icon(Icons.add),
        label: const Text('Yeni Randevu'),
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
                  'Randevu Yönetimi',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  '${filteredAppointments.length} randevu listeleniyor',
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
              Icons.event_note,
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
                hintText: 'Müşteri, hizmet veya sağlayıcı ara...',
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
                _buildFilterChip('pending', 'Beklemede', Icons.hourglass_empty),
                _buildFilterChip('confirmed', 'Onaylandı', Icons.check_circle),
                _buildFilterChip(
                    'in_progress', 'Devam Ediyor', Icons.play_circle),
                _buildFilterChip('completed', 'Tamamlandı', Icons.done_all),
                _buildFilterChip('cancelled', 'İptal', Icons.cancel),
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
            'Randevular yükleniyor...',
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
              Icons.event_busy,
              size: 64,
              color: Colors.white70,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Randevu bulunamadı',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            searchQuery.isNotEmpty
                ? 'Arama kriterinize uygun randevu yok'
                : 'Henüz hiç randevu oluşturulmamış',
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withOpacity(0.7),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppointmentsList() {
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: filteredAppointments.length,
      itemBuilder: (context, index) {
        final appointment = filteredAppointments[index];
        return _buildAppointmentCard(appointment);
      },
    );
  }

  Widget _buildAppointmentCard(Map<String, dynamic> appointment) {
    final statusColor = Color(int.parse(
      statusColors[appointment['status']]?.replaceFirst('#', '0xFF') ??
          '0xFF9E9E9E',
    ));

    final approvalLevel = appointment['approval_level'] ?? 0;
    final approvalStatus = appointment['approval_status'] ?? 'pending';

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
      child: ExpansionTile(
        tilePadding: const EdgeInsets.all(20),
        childrenPadding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: statusColor.withOpacity(0.2),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            _getStatusIcon(appointment['status']),
            color: statusColor,
            size: 24,
          ),
        ),
        title: Text(
          appointment['customer_name'] ?? 'Bilinmeyen Müşteri',
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
              appointment['service_name'] ?? 'Hizmet bilgisi yok',
              style: TextStyle(
                fontSize: 14,
                color: Colors.white.withOpacity(0.8),
              ),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.calendar_today,
                    size: 14, color: Colors.white.withOpacity(0.6)),
                const SizedBox(width: 4),
                Text(
                  '${appointment['appointment_date']} ${appointment['appointment_time']}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                statusTranslations[appointment['status']] ??
                    appointment['status'],
                style: TextStyle(
                  fontSize: 10,
                  color: statusColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            if (approvalLevel > 0) ...[
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${approvalLevel} Onay',
                  style: const TextStyle(
                    fontSize: 8,
                    color: Colors.orange,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
        children: [
          _buildAppointmentDetails(appointment),
        ],
      ),
    );
  }

  Widget _buildAppointmentDetails(Map<String, dynamic> appointment) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Details
          _buildDetailRow(
              'Müşteri', appointment['customer_name'], Icons.person),
          _buildDetailRow(
              'Hizmet', appointment['service_name'], Icons.room_service),
          _buildDetailRow(
              'Sağlayıcı', appointment['provider_name'], Icons.business),
          _buildDetailRow(
              'Tarih & Saat',
              '${appointment['appointment_date']} ${appointment['appointment_time']}',
              Icons.schedule),
          _buildDetailRow(
              'Süre', '${appointment['duration'] ?? 30} dakika', Icons.timer),
          _buildDetailRow(
              'Fiyat', '₺${appointment['price'] ?? 0}', Icons.attach_money),
          if (appointment['notes']?.isNotEmpty == true)
            _buildDetailRow('Not', appointment['notes'], Icons.note),

          const SizedBox(height: 16),

          // Approval Section
          _buildApprovalSection(appointment),

          const SizedBox(height: 16),

          // Action Buttons
          _buildActionButtons(appointment),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, dynamic value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.white.withOpacity(0.6)),
          const SizedBox(width: 8),
          Text(
            '$label: ',
            style: TextStyle(
              fontSize: 14,
              color: Colors.white.withOpacity(0.6),
            ),
          ),
          Expanded(
            child: Text(
              value?.toString() ?? 'Bilgi yok',
              style: const TextStyle(
                fontSize: 14,
                color: Colors.white,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildApprovalSection(Map<String, dynamic> appointment) {
    final approvalLevel = appointment['approval_level'] ?? 0;
    final approvers = List<String>.from(appointment['approvers'] ?? []);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.orange.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.orange.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.approval, color: Colors.orange, size: 16),
              const SizedBox(width: 8),
              Text(
                'Onay Durumu',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.orange,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Onay Seviyesi: $approvalLevel',
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
          if (approvers.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              'Onaycılar: ${approvers.join(', ')}',
              style: const TextStyle(color: Colors.white, fontSize: 12),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildActionButtons(Map<String, dynamic> appointment) {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () => _showApprovalDialog(appointment),
            icon: const Icon(Icons.approval, size: 16),
            label: const Text('Onay Yönet'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () => _showStatusDialog(appointment),
            icon: const Icon(Icons.edit, size: 16),
            label: const Text('Durum'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ),
      ],
    );
  }

  IconData _getStatusIcon(String? status) {
    switch (status) {
      case 'pending':
        return Icons.hourglass_empty;
      case 'confirmed':
        return Icons.check_circle;
      case 'completed':
        return Icons.done_all;
      case 'cancelled':
        return Icons.cancel;
      case 'in_progress':
        return Icons.play_circle;
      default:
        return Icons.help_outline;
    }
  }

  void _showStatusDialog(Map<String, dynamic> appointment) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Randevu Durumu Güncelle'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: statusTranslations.entries.map((entry) {
            return ListTile(
              title: Text(entry.value),
              leading: Icon(_getStatusIcon(entry.key)),
              onTap: () {
                Navigator.pop(context);
                _updateAppointmentStatus(appointment['id'], entry.key);
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  void _showCreateAppointmentDialog() {
    // Implementation for creating new appointments
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Yeni randevu oluşturma özelliği yakında eklenecek!'),
        backgroundColor: Colors.blue,
      ),
    );
  }
}

class ApprovalDialog extends StatefulWidget {
  final Map<String, dynamic> appointment;
  final Function(int level, List<String> approvers) onApprove;

  const ApprovalDialog({
    super.key,
    required this.appointment,
    required this.onApprove,
  });

  @override
  State<ApprovalDialog> createState() => _ApprovalDialogState();
}

class _ApprovalDialogState extends State<ApprovalDialog> {
  int selectedLevel = 1;
  List<String> selectedApprovers = [];

  final List<String> availableApprovers = [
    'Admin User',
    'Manager 1',
    'Manager 2',
    'Supervisor',
  ];

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Onay Seviyesi Belirle'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Approval Level Selection
            const Text('Onay Seviyesi:'),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [1, 2, 3].map((level) {
                return ChoiceChip(
                  label: Text('$level Onay'),
                  selected: selectedLevel == level,
                  onSelected: (selected) {
                    if (selected) {
                      setState(() => selectedLevel = level);
                    }
                  },
                );
              }).toList(),
            ),

            const SizedBox(height: 16),

            // Approvers Selection
            const Text('Onaycıları Seçin:'),
            const SizedBox(height: 8),
            ...availableApprovers.map((approver) {
              return CheckboxListTile(
                title: Text(approver),
                value: selectedApprovers.contains(approver),
                onChanged: (bool? value) {
                  setState(() {
                    if (value == true) {
                      selectedApprovers.add(approver);
                    } else {
                      selectedApprovers.remove(approver);
                    }
                  });
                },
              );
            }).toList(),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('İptal'),
        ),
        ElevatedButton(
          onPressed: selectedApprovers.isNotEmpty
              ? () {
                  Navigator.pop(context);
                  widget.onApprove(selectedLevel, selectedApprovers);
                }
              : null,
          child: const Text('Kaydet'),
        ),
      ],
    );
  }
}
