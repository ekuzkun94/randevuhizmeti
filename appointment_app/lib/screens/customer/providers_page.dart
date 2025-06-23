import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:appointment_app/providers/language_provider.dart';

class ProvidersPage extends StatefulWidget {
  const ProvidersPage({super.key});

  @override
  State<ProvidersPage> createState() => _ProvidersPageState();
}

class _ProvidersPageState extends State<ProvidersPage> {
  final _searchController = TextEditingController();
  String _selectedCategory = 'all';

  // Hizmet sağlayıcıları verileri
  final List<Map<String, dynamic>> _allProviders = [
    {
      'id': 'p1',
      'name': 'Dr. Ahmet Yılmaz',
      'title': 'Genel Pratisyen',
      'category': 'Tıp',
      'rating': 4.8,
      'experience': '10 yıl',
      'specialties': ['Genel Muayene', 'Aile Hekimliği'],
      'location': 'Merkez Klinik',
      'phone': '+90 555 123 4567',
      'email': 'ahmet.yilmaz@klinik.com',
      'workingHours': '09:00 - 17:00',
      'workingDays': 'Pazartesi - Cuma',
      'isAvailable': true,
      'avatar': null,
    },
    {
      'id': 'p2',
      'name': 'Dr. Ayşe Demir',
      'title': 'İç Hastalıkları Uzmanı',
      'category': 'Tıp',
      'rating': 4.9,
      'experience': '12 yıl',
      'specialties': ['Genel Muayene', 'İç Hastalıklar'],
      'location': 'Şehir Hastanesi',
      'phone': '+90 555 234 5678',
      'email': 'ayse.demir@hastane.com',
      'workingHours': '08:00 - 16:00',
      'workingDays': 'Pazartesi - Cumartesi',
      'isAvailable': true,
      'avatar': null,
    },
    {
      'id': 'p3',
      'name': 'Dr. Mehmet Öz',
      'title': 'Genel Pratisyen',
      'category': 'Tıp',
      'rating': 4.7,
      'experience': '8 yıl',
      'specialties': ['Genel Muayene', 'Çocuk Sağlığı'],
      'location': 'Aile Sağlığı Merkezi',
      'phone': '+90 555 345 6789',
      'email': 'mehmet.oz@asm.com',
      'workingHours': '09:00 - 18:00',
      'workingDays': 'Pazartesi - Cuma',
      'isAvailable': false,
      'avatar': null,
    },
    {
      'id': 'p4',
      'name': 'Dr. Mehmet Korkmaz',
      'title': 'Kardiyoloji Uzmanı',
      'category': 'Tıp',
      'rating': 4.9,
      'experience': '15 yıl',
      'specialties': ['Kardiyoloji', 'EKG', 'Ekokardiyografi'],
      'location': 'Kalp Sağlığı Merkezi',
      'phone': '+90 555 456 7890',
      'email': 'mehmet.korkmaz@kalp.com',
      'workingHours': '08:30 - 17:30',
      'workingDays': 'Pazartesi - Cuma',
      'isAvailable': true,
      'avatar': null,
    },
    {
      'id': 'p5',
      'name': 'Dr. Fatma Şahin',
      'title': 'Kardiyoloji Uzmanı',
      'category': 'Tıp',
      'rating': 4.8,
      'experience': '11 yıl',
      'specialties': ['Kardiyoloji', 'Hipertansiyon'],
      'location': 'Özel Kardiyoloji Kliniği',
      'phone': '+90 555 567 8901',
      'email': 'fatma.sahin@kardiyoloji.com',
      'workingHours': '09:00 - 17:00',
      'workingDays': 'Salı - Cumartesi',
      'isAvailable': true,
      'avatar': null,
    },
    {
      'id': 'p6',
      'name': 'Dr. Mehmet Kaya',
      'title': 'Diş Hekimi',
      'category': 'Diş Hekimliği',
      'rating': 4.6,
      'experience': '7 yıl',
      'specialties': ['Diş Temizliği', 'Dolgulu Tedavi'],
      'location': 'Gülümseme Diş Kliniği',
      'phone': '+90 555 678 9012',
      'email': 'mehmet.kaya@dis.com',
      'workingHours': '09:00 - 18:00',
      'workingDays': 'Pazartesi - Cuma',
      'isAvailable': true,
      'avatar': null,
    },
    {
      'id': 'p7',
      'name': 'Dr. Zeynep Aktaş',
      'title': 'Diş Hekimi',
      'category': 'Diş Hekimliği',
      'rating': 4.8,
      'experience': '9 yıl',
      'specialties': ['Diş Temizliği', 'Estetik Diş Hekimliği'],
      'location': 'Dental Plus Klinik',
      'phone': '+90 555 789 0123',
      'email': 'zeynep.aktas@dentalplus.com',
      'workingHours': '08:00 - 17:00',
      'workingDays': 'Pazartesi - Cumartesi',
      'isAvailable': true,
      'avatar': null,
    },
    {
      'id': 'p8',
      'name': 'Dr. Fatma Özkan',
      'title': 'Diş Hekimi',
      'category': 'Diş Hekimliği',
      'rating': 4.7,
      'experience': '6 yıl',
      'specialties': ['Diş Dolgusu', 'Kanal Tedavisi'],
      'location': 'Sağlık Diş Merkezi',
      'phone': '+90 555 890 1234',
      'email': 'fatma.ozkan@saglikdis.com',
      'workingHours': '09:30 - 18:30',
      'workingDays': 'Pazartesi - Cuma',
      'isAvailable': false,
      'avatar': null,
    },
    {
      'id': 'p9',
      'name': 'Dr. Ali Yurt',
      'title': 'Diş Hekimi',
      'category': 'Diş Hekimliği',
      'rating': 4.9,
      'experience': '13 yıl',
      'specialties': ['Diş Dolgusu', 'İmplant', 'Protez'],
      'location': 'Elit Diş Kliniği',
      'phone': '+90 555 901 2345',
      'email': 'ali.yurt@elitdis.com',
      'workingHours': '08:00 - 18:00',
      'workingDays': 'Pazartesi - Cumartesi',
      'isAvailable': true,
      'avatar': null,
    },
    {
      'id': 'p10',
      'name': 'Usta Ali',
      'title': 'Berber',
      'category': 'Güzellik',
      'rating': 4.5,
      'experience': '5 yıl',
      'specialties': ['Saç Kesimi', 'Sakal Tıraşı'],
      'location': 'Klasik Berber Salonu',
      'phone': '+90 555 012 3456',
      'email': 'ali@klasikberber.com',
      'workingHours': '09:00 - 19:00',
      'workingDays': 'Pazartesi - Cumartesi',
      'isAvailable': true,
      'avatar': null,
    },
    {
      'id': 'p11',
      'name': 'Berber Mehmet',
      'title': 'Berber',
      'category': 'Güzellik',
      'rating': 4.8,
      'experience': '12 yıl',
      'specialties': ['Saç Kesimi', 'Saç Boyama', 'Sakal Şekillendirme'],
      'location': 'Modern Saç Tasarım',
      'phone': '+90 555 123 4567',
      'email': 'mehmet@modernsac.com',
      'workingHours': '08:00 - 20:00',
      'workingDays': 'Her gün',
      'isAvailable': true,
      'avatar': null,
    },
    {
      'id': 'p12',
      'name': 'Zeynep Hanım',
      'title': 'Masöz',
      'category': 'Güzellik',
      'rating': 4.9,
      'experience': '8 yıl',
      'specialties': ['Masaj Terapisi', 'Refleksoloji', 'Aromaterapi'],
      'location': 'Wellness Spa Center',
      'phone': '+90 555 234 5678',
      'email': 'zeynep@wellness.com',
      'workingHours': '10:00 - 18:00',
      'workingDays': 'Salı - Pazar',
      'isAvailable': true,
      'avatar': null,
    },
    {
      'id': 'p13',
      'name': 'Ayşe Terzi',
      'title': 'Masöz',
      'category': 'Güzellik',
      'rating': 4.7,
      'experience': '6 yıl',
      'specialties': ['Masaj Terapisi', 'Spor Masajı'],
      'location': 'Relaks Masaj Merkezi',
      'phone': '+90 555 345 6789',
      'email': 'ayse@relaks.com',
      'workingHours': '09:00 - 17:00',
      'workingDays': 'Pazartesi - Cumartesi',
      'isAvailable': false,
      'avatar': null,
    },
  ];

  List<String> get _categories {
    final categories = _allProviders.map((provider) => provider['category'] as String).toSet().toList();
    categories.insert(0, 'all');
    return categories;
  }

  List<Map<String, dynamic>> get _filteredProviders {
    List<Map<String, dynamic>> filtered = _allProviders;

    // Kategori filtresi
    if (_selectedCategory != 'all') {
      filtered = filtered.where((provider) => provider['category'] == _selectedCategory).toList();
    }

    // Arama filtresi
    if (_searchController.text.isNotEmpty) {
      final searchTerm = _searchController.text.toLowerCase();
      filtered = filtered.where((provider) {
        return provider['name'].toString().toLowerCase().contains(searchTerm) ||
               provider['title'].toString().toLowerCase().contains(searchTerm) ||
               provider['specialties'].toString().toLowerCase().contains(searchTerm) ||
               provider['location'].toString().toLowerCase().contains(searchTerm);
      }).toList();
    }

    // Rating'e göre sırala (yüksekten düşüğe)
    filtered.sort((a, b) => (b['rating'] as double).compareTo(a['rating'] as double));

    return filtered;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showProviderDetails(Map<String, dynamic> provider) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.8,
        maxChildSize: 0.95,
        minChildSize: 0.5,
        expand: false,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Provider Header
              Row(
                children: [
                  CircleAvatar(
                    radius: 35,
                    backgroundColor: const Color(0xFF667eea),
                    child: Text(
                      provider['name'].toString().split(' ').map((n) => n[0]).take(2).join().toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          provider['name'],
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF667eea),
                          ),
                        ),
                        Text(
                          provider['title'],
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(Icons.star, color: Colors.amber, size: 16),
                            const SizedBox(width: 4),
                            Text(
                              provider['rating'].toString(),
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.amber,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: provider['isAvailable'] ? Colors.green : Colors.red,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                provider['isAvailable'] ? 'Müsait' : 'Meşgul',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Details
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildDetailSection('Deneyim', provider['experience']),
                      _buildDetailSection('Konum', provider['location']),
                      _buildDetailSection('Telefon', provider['phone']),
                      _buildDetailSection('E-posta', provider['email']),
                      _buildDetailSection('Çalışma Saatleri', provider['workingHours']),
                      _buildDetailSection('Çalışma Günleri', provider['workingDays']),
                      _buildSpecialtiesSection(provider['specialties']),
                    ],
                  ),
                ),
              ),

              // Action Buttons
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                                              onPressed: () async {
                          final phone = provider['phone'] ?? '';
                          if (phone.isNotEmpty) {
                            // Telefon numarasından özel karakterleri temizle
                            final cleanPhone = phone.replaceAll(RegExp(r'[^\d+]'), '');
                            // tel: URL scheme kullanarak varsayılan telefon uygulamasını aç
                            final uri = Uri.parse('tel:$cleanPhone');
                            try {
                              // Web platformunda tel: link'i desteklenmez, bu yüzden
                              // masaüstü/web için alternatif göster
                              if (Uri.base.scheme == 'http' || Uri.base.scheme == 'https') {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Telefon: $phone'),
                                    action: SnackBarAction(
                                      label: 'Kopyala',
                                      onPressed: () {
                                        // Clipboard API web'de çalışır
                                        print('Telefon numarası: $phone');
                                      },
                                    ),
                                  ),
                                );
                              }
                            } catch (e) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Telefon uygulaması açılamadı: $phone'),
                                ),
                              );
                            }
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Telefon numarası bulunamadı'),
                              ),
                            );
                          }
                        },
                      icon: const Icon(Icons.phone),
                      label: const Text('Ara'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF667eea),
                        side: const BorderSide(color: Color(0xFF667eea)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                                         child: ElevatedButton.icon(
                       onPressed: provider['isAvailable'] ? () {
                         Navigator.of(context).pop();
                         // Sağlayıcı bilgilerini parametre olarak geç
                         context.go('/customer/create-appointment?'
                             'providerId=${provider['id']}&'
                             'providerName=${Uri.encodeComponent(provider['name'])}&'
                             'serviceCategory=${Uri.encodeComponent(provider['category'])}');
                       } : null,
                       icon: const Icon(Icons.calendar_today),
                       label: const Text('Randevu Al'),
                       style: ElevatedButton.styleFrom(
                         backgroundColor: const Color(0xFF667eea),
                         foregroundColor: Colors.white,
                         padding: const EdgeInsets.symmetric(vertical: 12),
                       ),
                     ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailSection(String title, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Color(0xFF667eea),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildSpecialtiesSection(List<dynamic> specialties) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Uzmanlık Alanları',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Color(0xFF667eea),
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: specialties.map((specialty) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF667eea).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF667eea).withValues(alpha: 0.3)),
                ),
                child: Text(
                  specialty.toString(),
                  style: const TextStyle(
                    color: Color(0xFF667eea),
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              );
            }).toList(),
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
            title: const Text('Hizmet Sağlayıcılar'),
            backgroundColor: const Color(0xFF667eea),
            foregroundColor: Colors.white,
            elevation: 0,
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
            child: SafeArea(
              child: Column(
                children: [
                  // Search and Filter Section
                  Container(
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        // Search Field
                        TextField(
                          controller: _searchController,
                          decoration: InputDecoration(
                            hintText: 'Sağlayıcı ara... (isim, uzmanlık, konum)',
                            prefixIcon: const Icon(Icons.search),
                            suffixIcon: _searchController.text.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear),
                                    onPressed: () {
                                      setState(() {
                                        _searchController.clear();
                                      });
                                    },
                                  )
                                : null,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            filled: true,
                            fillColor: Colors.grey.shade50,
                          ),
                          onChanged: (value) {
                            setState(() {});
                          },
                        ),
                        const SizedBox(height: 16),

                        // Category Filter
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: _categories.map((category) {
                              final isSelected = _selectedCategory == category;
                              final displayName = category == 'all' ? 'Tümü' : category;
                              
                              return Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: FilterChip(
                                  label: Text(displayName),
                                  selected: isSelected,
                                  onSelected: (selected) {
                                    setState(() {
                                      _selectedCategory = category;
                                    });
                                  },
                                  selectedColor: const Color(0xFF667eea).withValues(alpha: 0.2),
                                  checkmarkColor: const Color(0xFF667eea),
                                  labelStyle: TextStyle(
                                    color: isSelected ? const Color(0xFF667eea) : Colors.grey.shade700,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Results Count
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        Text(
                          '${_filteredProviders.length} sağlayıcı bulundu',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Providers List
                  Expanded(
                    child: _filteredProviders.isEmpty
                        ? Center(
                            child: Card(
                              margin: const EdgeInsets.all(24),
                              child: Padding(
                                padding: const EdgeInsets.all(32),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.person_search,
                                      size: 64,
                                      color: Colors.grey.shade400,
                                    ),
                                    const SizedBox(height: 16),
                                    Text(
                                      'Arama kriterinize uygun sağlayıcı bulunamadı',
                                      style: TextStyle(
                                        fontSize: 16,
                                        color: Colors.grey.shade600,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _filteredProviders.length,
                            itemBuilder: (context, index) {
                              final provider = _filteredProviders[index];
                              return _buildProviderCard(provider);
                            },
                          ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildProviderCard(Map<String, dynamic> provider) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: () => _showProviderDetails(provider),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Avatar
              CircleAvatar(
                radius: 30,
                backgroundColor: const Color(0xFF667eea),
                child: Text(
                  provider['name'].toString().split(' ').map((n) => n[0]).take(2).join().toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 16),

              // Provider Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Name and Title
                    Text(
                      provider['name'],
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      provider['title'],
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                    ),
                    const SizedBox(height: 4),

                    // Rating and Experience
                    Row(
                      children: [
                        Icon(Icons.star, color: Colors.amber, size: 16),
                        const SizedBox(width: 4),
                        Text(
                          provider['rating'].toString(),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.amber,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Icon(Icons.work, size: 16, color: Colors.grey.shade600),
                        const SizedBox(width: 4),
                        Text(
                          provider['experience'],
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),

                    // Location
                    Row(
                      children: [
                        Icon(Icons.location_on, size: 16, color: Colors.grey.shade600),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            provider['location'],
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Status and Action
              Column(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: provider['isAvailable'] ? Colors.green : Colors.red,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      provider['isAvailable'] ? 'Müsait' : 'Meşgul',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Icon(
                    Icons.arrow_forward_ios,
                    size: 16,
                    color: Colors.grey.shade400,
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