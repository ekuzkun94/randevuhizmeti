import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:appointment_app/providers/language_provider.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;
  String? _selectedRole;
  bool _passwordVisible = false;
  bool _confirmPasswordVisible = false;

  final List<Map<String, String>> _roles = [
    {'id': '2', 'name': 'provider', 'displayName': 'Hizmet Sağlayıcı', 'description': 'Randevu veren profesyonel', 'icon': '👨‍⚕️'},
    {'id': '3', 'name': 'customer', 'displayName': 'Müşteri', 'description': 'Randevu alan kişi', 'icon': '👤'},
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      // Simulated registration - in real app this would go to database
      await Future.delayed(const Duration(seconds: 2));

      if (mounted) {
        final languageProvider = Provider.of<LanguageProvider>(context, listen: false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(languageProvider.translate('registration_successful', fallback: 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.')),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
        
        // Navigate to login page
        context.go('/login');
      }
    } catch (e) {
      if (mounted) {
        final languageProvider = Provider.of<LanguageProvider>(context, listen: false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${languageProvider.translate('registration_error', fallback: 'Kayıt hatası')}: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LanguageProvider>(
      builder: (context, languageProvider, child) {
        return Scaffold(
          extendBodyBehindAppBar: true,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white, size: 28),
              onPressed: () => context.go('/'),
              tooltip: 'Ana Sayfaya Dön',
            ),
          ),
          body: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF667eea),
                  Color(0xFF764ba2),
                  Color(0xFFf093fb),
                ],
              ),
            ),
            child: SafeArea(
              child: Column(
                children: [
                  // Header
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        // Dil seçeneği
                        if (languageProvider.isInitialized && languageProvider.availableLanguages.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                            ),
                            child: DropdownButton<String>(
                              value: languageProvider.currentLanguage?.id ?? 'tr',
                              dropdownColor: Colors.white.withValues(alpha: 0.95),
                              icon: const Icon(Icons.expand_more, color: Colors.white, size: 20),
                              underline: Container(),
                              style: const TextStyle(color: Colors.white, fontSize: 14),
                              items: languageProvider.availableLanguages.map((language) {
                                return DropdownMenuItem<String>(
                                  value: language.id,
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(language.flagEmoji, style: const TextStyle(fontSize: 16)),
                                      const SizedBox(width: 8),
                                      Text(
                                        language.nativeName,
                                        style: const TextStyle(color: Colors.black87),
                                      ),
                                    ],
                                  ),
                                );
                              }).toList(),
                              onChanged: (languageId) {
                                if (languageId != null) {
                                  languageProvider.setLanguageById(languageId);
                                }
                              },
                              selectedItemBuilder: (BuildContext context) {
                                return languageProvider.availableLanguages.map((language) {
                                  return Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(language.flagEmoji, style: const TextStyle(fontSize: 16)),
                                      const SizedBox(width: 8),
                                      Text(
                                        language.id.toUpperCase(),
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 14,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  );
                                }).toList();
                              },
                            ),
                          ),
                      ],
                    ),
                  ),
                  
                  // Register formu
                  Expanded(
                    child: SingleChildScrollView(
                      padding: EdgeInsets.symmetric(
                        horizontal: MediaQuery.of(context).size.width > 600 ? 24.0 : 16.0,
                      ),
                      child: Column(
                        children: [
                          SizedBox(height: MediaQuery.of(context).size.height > 700 ? 16 : 8),
                          
                          // Başlık bölümü
                          Column(
                            children: [
                              // Logo - Mobilde daha küçük
                              Container(
                                width: MediaQuery.of(context).size.height > 700 ? 70 : 50,
                                height: MediaQuery.of(context).size.height > 700 ? 70 : 50,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.1),
                                      blurRadius: 12,
                                      offset: const Offset(0, 3),
                                    ),
                                  ],
                                ),
                                child: ClipOval(
                                  child: Image.asset(
                                    'assets/images/zamanyonet_logo.png',
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) {
                                      return Container(
                                        decoration: const BoxDecoration(
                                          color: Color(0xFF667eea),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(
                                          Icons.person_add,
                                          size: MediaQuery.of(context).size.height > 700 ? 35 : 25,
                                          color: Colors.white,
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              ),
                              SizedBox(height: MediaQuery.of(context).size.height > 700 ? 16 : 8),
                              
                              Text(
                                languageProvider.translate('register', fallback: 'Kayıt Ol'),
                                style: TextStyle(
                                  fontSize: MediaQuery.of(context).size.height > 700 ? 26 : 20,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              SizedBox(height: MediaQuery.of(context).size.height > 700 ? 6 : 3),
                              
                              Text(
                                languageProvider.translate('join_platform', fallback: 'Platformumuza katılın'),
                                style: TextStyle(
                                  fontSize: MediaQuery.of(context).size.height > 700 ? 13 : 11,
                                  color: Colors.white70,
                                ),
                                textAlign: TextAlign.center,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                          SizedBox(height: MediaQuery.of(context).size.height > 700 ? 20 : 12),
                          
                          // Form kartı
                          Card(
                            elevation: 10,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(18),
                            ),
                            child: Padding(
                              padding: EdgeInsets.all(MediaQuery.of(context).size.width > 600 ? 20.0 : 14.0),
                              child: Form(
                                key: _formKey,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Ad Soyad
                                    _buildTextField(
                                      controller: _nameController,
                                      label: languageProvider.translate('name', fallback: 'Ad Soyad'),
                                      icon: Icons.person_outline,
                                      validator: (value) {
                                        if (value == null || value.isEmpty) {
                                          return languageProvider.translate('name_required', fallback: 'Ad Soyad gerekli');
                                        }
                                        return null;
                                      },
                                    ),
                                    SizedBox(height: MediaQuery.of(context).size.height > 700 ? 16 : 12),
                                    
                                    // Email
                                    _buildTextField(
                                      controller: _emailController,
                                      label: languageProvider.translate('email', fallback: 'E-posta'),
                                      icon: Icons.email_outlined,
                                      keyboardType: TextInputType.emailAddress,
                                      validator: (value) {
                                        if (value == null || value.isEmpty) {
                                          return languageProvider.translate('email_required', fallback: 'E-posta gerekli');
                                        }
                                        if (!value.contains('@')) {
                                          return languageProvider.translate('invalid_email', fallback: 'Geçerli bir e-posta adresi girin');
                                        }
                                        return null;
                                      },
                                    ),
                                    SizedBox(height: MediaQuery.of(context).size.height > 700 ? 16 : 12),
                                    
                                    // Rol Seçimi
                                    Text(
                                      languageProvider.translate('select_role', fallback: 'Rolünüzü Seçin'),
                                      style: TextStyle(
                                        fontSize: MediaQuery.of(context).size.height > 700 ? 14 : 12,
                                        fontWeight: FontWeight.w600,
                                        color: const Color(0xFF667eea),
                                      ),
                                    ),
                                    SizedBox(height: MediaQuery.of(context).size.height > 700 ? 10 : 6),
                                    
                                    ...(_roles.map((role) => _buildRoleCard(role, languageProvider))),
                                    
                                    if (_selectedRole == null)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 4),
                                        child: Text(
                                          languageProvider.translate('role_required', fallback: 'Rol seçimi gerekli'),
                                          style: const TextStyle(
                                            color: Colors.red,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ),
                                    
                                    SizedBox(height: MediaQuery.of(context).size.height > 700 ? 16 : 12),
                                    
                                    // Şifre
                                    _buildTextField(
                                      controller: _passwordController,
                                      label: languageProvider.translate('password', fallback: 'Şifre'),
                                      icon: Icons.lock_outline,
                                      obscureText: !_passwordVisible,
                                      suffixIcon: IconButton(
                                        icon: Icon(_passwordVisible ? Icons.visibility_off : Icons.visibility),
                                        onPressed: () => setState(() => _passwordVisible = !_passwordVisible),
                                      ),
                                      validator: (value) {
                                        if (value == null || value.isEmpty) {
                                          return languageProvider.translate('password_required', fallback: 'Şifre gerekli');
                                        }
                                        if (value.length < 6) {
                                          return languageProvider.translate('password_too_short', fallback: 'Şifre en az 6 karakter olmalı');
                                        }
                                        return null;
                                      },
                                    ),
                                    SizedBox(height: MediaQuery.of(context).size.height > 700 ? 16 : 12),
                                    
                                    // Şifre Tekrar
                                    _buildTextField(
                                      controller: _confirmPasswordController,
                                      label: languageProvider.translate('confirm_password', fallback: 'Şifre Tekrar'),
                                      icon: Icons.lock_outline,
                                      obscureText: !_confirmPasswordVisible,
                                      suffixIcon: IconButton(
                                        icon: Icon(_confirmPasswordVisible ? Icons.visibility_off : Icons.visibility),
                                        onPressed: () => setState(() => _confirmPasswordVisible = !_confirmPasswordVisible),
                                      ),
                                      validator: (value) {
                                        if (value == null || value.isEmpty) {
                                          return languageProvider.translate('confirm_password_required', fallback: 'Şifre tekrarı gerekli');
                                        }
                                        if (value != _passwordController.text) {
                                          return languageProvider.translate('passwords_dont_match', fallback: 'Şifreler eşleşmiyor');
                                        }
                                        return null;
                                      },
                                    ),
                                    SizedBox(height: MediaQuery.of(context).size.height > 700 ? 20 : 16),
                                    
                                    // Kayıt butonu
                                    SizedBox(
                                      width: double.infinity,
                                      height: 48,
                                      child: ElevatedButton(
                                        onPressed: _isLoading ? null : () {
                                          if (_selectedRole == null) {
                                            setState(() {});
                                            return;
                                          }
                                          _register();
                                        },
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(0xFF667eea),
                                          foregroundColor: Colors.white,
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(14),
                                          ),
                                          elevation: 4,
                                        ),
                                        child: _isLoading
                                            ? const SizedBox(
                                                width: 20,
                                                height: 20,
                                                child: CircularProgressIndicator(
                                                  color: Colors.white,
                                                  strokeWidth: 2,
                                                ),
                                              )
                                            : Row(
                                                mainAxisAlignment: MainAxisAlignment.center,
                                                children: [
                                                  const Icon(Icons.person_add, size: 20),
                                                  const SizedBox(width: 8),
                                                  Text(
                                                    languageProvider.translate('register_now', fallback: 'Kayıt Ol'),
                                                    style: const TextStyle(
                                                      fontSize: 16,
                                                      fontWeight: FontWeight.bold,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                      ),
                                    ),
                                    SizedBox(height: MediaQuery.of(context).size.height > 700 ? 16 : 12),
                                    
                                    // Login linki
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          languageProvider.translate('already_have_account', fallback: 'Zaten hesabınız var mı?'),
                                          style: TextStyle(
                                            color: Colors.grey,
                                            fontSize: MediaQuery.of(context).size.height > 700 ? 13 : 11,
                                          ),
                                        ),
                                        TextButton(
                                          onPressed: () => context.go('/login'),
                                          style: TextButton.styleFrom(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          ),
                                          child: Text(
                                            languageProvider.translate('login', fallback: 'Giriş Yap'),
                                            style: TextStyle(
                                              color: const Color(0xFF667eea),
                                              fontWeight: FontWeight.bold,
                                              fontSize: MediaQuery.of(context).size.height > 700 ? 13 : 11,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          SizedBox(height: MediaQuery.of(context).size.height > 700 ? 20 : 16),
                        ],
                      ),
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

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    bool obscureText = false,
    Widget? suffixIcon,
    String? Function(String?)? validator,
  }) {
    final isMobile = MediaQuery.of(context).size.height <= 700;
    
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: const Color(0xFF667eea)),
        suffixIcon: suffixIcon,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFF667eea), width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Colors.red),
        ),
        filled: true,
        fillColor: Colors.grey.shade50,
        contentPadding: EdgeInsets.symmetric(
          horizontal: 16, 
          vertical: isMobile ? 12 : 16,
        ),
      ),
    );
  }

  Widget _buildRoleCard(Map<String, String> role, LanguageProvider languageProvider) {
    final isSelected = _selectedRole == role['id'];
    final isMobile = MediaQuery.of(context).size.height <= 700;
    
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedRole = role['id'];
        });
      },
      child: Container(
        margin: EdgeInsets.only(bottom: isMobile ? 8 : 12),
        padding: EdgeInsets.all(isMobile ? 12 : 16),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF667eea).withValues(alpha: 0.1) : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? const Color(0xFF667eea) : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: isMobile ? 36 : 48,
              height: isMobile ? 36 : 48,
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF667eea) : Colors.grey.shade200,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Center(
                child: Text(
                  role['icon']!,
                  style: TextStyle(fontSize: isMobile ? 18 : 24),
                ),
              ),
            ),
            SizedBox(width: isMobile ? 12 : 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    languageProvider.translate(role['name']!, fallback: role['displayName']!),
                    style: TextStyle(
                      fontSize: isMobile ? 13 : 16,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? const Color(0xFF667eea) : Colors.black87,
                    ),
                  ),
                  SizedBox(height: isMobile ? 2 : 4),
                  Text(
                    role['description']!,
                    style: TextStyle(
                      fontSize: isMobile ? 10 : 12,
                      color: Colors.grey.shade600,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(
                Icons.check_circle,
                color: const Color(0xFF667eea),
                size: isMobile ? 20 : 24,
              ),
          ],
        ),
      ),
    );
  }
} 