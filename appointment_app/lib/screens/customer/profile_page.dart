import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:appointment_app/providers/language_provider.dart';
import 'package:appointment_app/providers/auth_provider.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  
  bool _isEditing = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  void _loadUserData() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.currentUser;
    
    if (user != null) {
      _nameController.text = user.name;
      _emailController.text = user.email;
      _phoneController.text = user.phone ?? '';
      _addressController.text = user.address ?? '';
    }
  }

  Future<void> _updateProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      // Simulated API call - replace with actual API call
      await Future.delayed(const Duration(seconds: 1));
      
      // Update user data
      // TODO: Implement updateUserProfile method in AuthProvider
      
      setState(() => _isEditing = false);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profil başarıyla güncellendi'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Hata: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }

    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<LanguageProvider, AuthProvider>(
      builder: (context, languageProvider, authProvider, child) {
        final user = authProvider.currentUser;
        
        return Scaffold(
          appBar: AppBar(
            title: Text(languageProvider.translate('profile', fallback: 'Profil')),
            backgroundColor: const Color(0xFF667eea),
            foregroundColor: Colors.white,
            elevation: 0,
            actions: [
              if (!_isEditing)
                IconButton(
                  icon: const Icon(Icons.edit),
                  onPressed: () => setState(() => _isEditing = true),
                  tooltip: 'Düzenle',
                ),
              if (_isEditing) ...[
                TextButton(
                  onPressed: () {
                    setState(() => _isEditing = false);
                    _loadUserData(); // Reset form data
                  },
                  child: const Text('İptal', style: TextStyle(color: Colors.white)),
                ),
                TextButton(
                  onPressed: _isLoading ? null : _updateProfile,
                  child: _isLoading 
                    ? const SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text('Kaydet', style: TextStyle(color: Colors.white)),
                ),
              ],
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
            child: SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    // Profile Picture Section
                    _buildProfilePictureSection(user),
                    const SizedBox(height: 24),
                    
                    // Profile Form
                    Card(
                      elevation: 8,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Kişisel Bilgiler',
                                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  color: const Color(0xFF667eea),
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 20),
                              
                              _buildFormField(
                                controller: _nameController,
                                label: 'Ad Soyad',
                                icon: Icons.person,
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'Ad Soyad gerekli';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16),
                              
                              _buildFormField(
                                controller: _emailController,
                                label: 'E-posta',
                                icon: Icons.email,
                                keyboardType: TextInputType.emailAddress,
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'E-posta gerekli';
                                  }
                                  if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                                    return 'Geçerli bir e-posta adresi girin';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16),
                              
                              _buildFormField(
                                controller: _phoneController,
                                label: 'Telefon',
                                icon: Icons.phone,
                                keyboardType: TextInputType.phone,
                                validator: (value) {
                                  if (value != null && value.isNotEmpty) {
                                    if (!RegExp(r'^[0-9+\-\s\(\)]+$').hasMatch(value)) {
                                      return 'Geçerli bir telefon numarası girin';
                                    }
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16),
                              
                              _buildFormField(
                                controller: _addressController,
                                label: 'Adres',
                                icon: Icons.location_on,
                                maxLines: 3,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    // Account Settings
                    _buildAccountSettingsSection(),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildProfilePictureSection(user) {
    return Card(
      elevation: 8,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: 50,
                  backgroundColor: const Color(0xFF667eea).withValues(alpha: 0.1),
                  child: const Icon(
                    Icons.person,
                    size: 50,
                    color: Color(0xFF667eea),
                  ),
                ),
                if (_isEditing)
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      decoration: const BoxDecoration(
                        color: Color(0xFF667eea),
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.camera_alt, color: Colors.white, size: 20),
                        onPressed: () {
                          // Implement photo picker
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Fotoğraf yükleme özelliği yakında!'),
                              backgroundColor: Colors.blue,
                            ),
                          );
                        },
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              user?.name ?? 'Kullanıcı',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF667eea),
              ),
            ),
            Text(
              user?.email ?? '',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF667eea).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                _getRoleText(user?.roleId),
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF667eea),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFormField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
    int maxLines = 1,
  }) {
    return TextFormField(
      controller: controller,
      enabled: _isEditing,
      keyboardType: keyboardType,
      maxLines: maxLines,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: const Color(0xFF667eea)),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF667eea), width: 2),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade200),
        ),
        filled: true,
        fillColor: _isEditing ? Colors.white : Colors.grey.shade50,
      ),
    );
  }

  Widget _buildAccountSettingsSection() {
    return Card(
      elevation: 8,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Hesap Ayarları',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: const Color(0xFF667eea),
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            
            _buildSettingsItem(
              icon: Icons.lock,
              title: 'Şifre Değiştir',
              subtitle: 'Hesap güvenliğinizi koruyun',
              onTap: () {
                // Implement password change
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Şifre değiştirme özelliği yakında!'),
                    backgroundColor: Colors.blue,
                  ),
                );
              },
            ),
            
            _buildSettingsItem(
              icon: Icons.notifications,
              title: 'Bildirimler',
              subtitle: 'Bildirim tercihlerinizi yönetin',
              onTap: () {
                // Implement notification settings
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Bildirim ayarları yakında!'),
                    backgroundColor: Colors.blue,
                  ),
                );
              },
            ),
            
            _buildSettingsItem(
              icon: Icons.language,
              title: 'Dil Seçimi',
              subtitle: 'Türkçe',
              onTap: () {
                // Show language selection dialog
                _showLanguageDialog();
              },
            ),
            
            _buildSettingsItem(
              icon: Icons.help,
              title: 'Yardım & Destek',
              subtitle: 'SSS ve iletişim bilgileri',
              onTap: () {
                // Implement help & support
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Yardım sayfası yakında!'),
                    backgroundColor: Colors.blue,
                  ),
                );
              },
            ),
            
            const Divider(height: 32),
            
            _buildSettingsItem(
              icon: Icons.logout,
              title: 'Çıkış Yap',
              subtitle: 'Hesabınızdan güvenli çıkış yapın',
              onTap: () => _showLogoutDialog(),
              isDestructive: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool isDestructive = false,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: (isDestructive ? Colors.red : const Color(0xFF667eea)).withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          icon,
          color: isDestructive ? Colors.red : const Color(0xFF667eea),
        ),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontWeight: FontWeight.bold,
          color: isDestructive ? Colors.red : Colors.black87,
        ),
      ),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }

  void _showLanguageDialog() {
    final languageProvider = Provider.of<LanguageProvider>(context, listen: false);
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Dil Seçimi'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('Türkçe'),
              leading: Radio<String>(
                value: 'tr',
                groupValue: languageProvider.currentLocale.languageCode,
                onChanged: (value) {
                  languageProvider.setLanguageById('tr');
                  Navigator.of(context).pop();
                },
              ),
            ),
            ListTile(
              title: const Text('English'),
              leading: Radio<String>(
                value: 'en',
                groupValue: languageProvider.currentLocale.languageCode,
                onChanged: (value) {
                  languageProvider.setLanguageById('en');
                  Navigator.of(context).pop();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Çıkış Yap'),
        content: const Text('Hesabınızdan çıkış yapmak istediğinizden emin misiniz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('İptal'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              final authProvider = Provider.of<AuthProvider>(context, listen: false);
              authProvider.signOut();
              // Navigation will be handled by the auth provider
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Çıkış Yap'),
          ),
        ],
      ),
    );
  }

  String _getRoleText(String? roleId) {
    switch (roleId) {
      case '1':
        return 'Yönetici';
      case '2':
        return 'Hizmet Sağlayıcı';
      case '3':
        return 'Müşteri';
      default:
        return 'Kullanıcı';
    }
  }
} 