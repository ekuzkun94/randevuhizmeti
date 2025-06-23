import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:appointment_app/providers/auth_provider.dart';
import 'package:appointment_app/providers/language_provider.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _passwordVisible = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final languageProvider =
          Provider.of<LanguageProvider>(context, listen: false);

      final email = _emailController.text.trim();
      final password = _passwordController.text.trim();

      // AuthProvider'dan giriş yap (API çağrısı yapacak)
      final success = await authProvider.login(
          email, password, ''); // Role ID boş, API'den gelecek

      if (success && mounted) {
        // Başarılı giriş - role'e göre yönlendir
        final user = authProvider.currentUser;
        if (user != null) {
          switch (user.roleId) {
            case '1': // Admin
              context.go('/admin');
              break;
            case '2': // Provider
              context.go('/provider');
              break;
            case '3': // Customer
              context.go('/customer');
              break;
            default:
              context.go('/customer'); // Varsayılan olarak customer'a yönlendir
          }
        }
      } else if (mounted) {
        // Giriş başarısız
        final errorMessage = authProvider.errorMessage ??
            languageProvider.translate('invalid_credentials',
                fallback: 'Geçersiz email veya şifre');

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        final languageProvider =
            Provider.of<LanguageProvider>(context, listen: false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                '${languageProvider.translate('login_error', fallback: 'Giriş hatası')}: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
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
        // Dil sistemi yüklenene kadar loading göster
        if (!languageProvider.isInitialized) {
          return Scaffold(
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
              child: const Center(
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
              ),
            ),
          );
        }

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
                        if (languageProvider.isInitialized &&
                            languageProvider.availableLanguages.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.3)),
                            ),
                            child: DropdownButton<String>(
                              value:
                                  languageProvider.currentLanguage?.id ?? 'tr',
                              dropdownColor:
                                  Colors.white.withValues(alpha: 0.95),
                              icon: const Icon(Icons.expand_more,
                                  color: Colors.white, size: 20),
                              underline: Container(),
                              style: const TextStyle(
                                  color: Colors.white, fontSize: 14),
                              items: languageProvider.availableLanguages
                                  .map((language) {
                                return DropdownMenuItem<String>(
                                  value: language.id,
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(language.flagEmoji,
                                          style: const TextStyle(fontSize: 16)),
                                      const SizedBox(width: 8),
                                      Text(
                                        language.nativeName,
                                        style: const TextStyle(
                                            color: Colors.black87),
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
                                return languageProvider.availableLanguages
                                    .map((language) {
                                  return Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(language.flagEmoji,
                                          style: const TextStyle(fontSize: 16)),
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

                  // Login formu
                  Expanded(
                    child: SingleChildScrollView(
                      padding: EdgeInsets.symmetric(
                        horizontal: MediaQuery.of(context).size.width > 600
                            ? 24.0
                            : 16.0,
                      ),
                      child: Column(
                        children: [
                          SizedBox(
                              height: MediaQuery.of(context).size.height > 700
                                  ? 20
                                  : 10),

                          // Başlık bölümü
                          Column(
                            children: [
                              // Logo - Mobilde daha küçük
                              Container(
                                width: MediaQuery.of(context).size.height > 700
                                    ? 80
                                    : 60,
                                height: MediaQuery.of(context).size.height > 700
                                    ? 80
                                    : 60,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color:
                                          Colors.black.withValues(alpha: 0.1),
                                      blurRadius: 15,
                                      offset: const Offset(0, 4),
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
                                          Icons.schedule,
                                          size: MediaQuery.of(context)
                                                      .size
                                                      .height >
                                                  700
                                              ? 40
                                              : 30,
                                          color: Colors.white,
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              ),
                              SizedBox(
                                  height:
                                      MediaQuery.of(context).size.height > 700
                                          ? 20
                                          : 12),

                              Text(
                                languageProvider.translate('welcome_back',
                                    fallback: 'Tekrar Hoş Geldiniz'),
                                style: TextStyle(
                                  fontSize:
                                      MediaQuery.of(context).size.height > 700
                                          ? 28
                                          : 22,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              SizedBox(
                                  height:
                                      MediaQuery.of(context).size.height > 700
                                          ? 8
                                          : 4),

                              Text(
                                languageProvider.translate('login_subtitle',
                                    fallback: 'Hesabınıza giriş yapın'),
                                style: TextStyle(
                                  fontSize:
                                      MediaQuery.of(context).size.height > 700
                                          ? 14
                                          : 12,
                                  color: Colors.white70,
                                ),
                                textAlign: TextAlign.center,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                          SizedBox(
                              height: MediaQuery.of(context).size.height > 700
                                  ? 24
                                  : 16),

                          // Form kartı
                          Card(
                            elevation: 12,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Padding(
                              padding: EdgeInsets.all(
                                  MediaQuery.of(context).size.width > 600
                                      ? 24.0
                                      : 16.0),
                              child: Form(
                                key: _formKey,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Email
                                    _buildTextField(
                                      controller: _emailController,
                                      label: languageProvider.translate('email',
                                          fallback: 'E-posta'),
                                      icon: Icons.email_outlined,
                                      keyboardType: TextInputType.emailAddress,
                                      validator: (value) {
                                        if (value == null || value.isEmpty) {
                                          return languageProvider.translate(
                                              'email_required',
                                              fallback: 'E-posta gerekli');
                                        }
                                        if (!value.contains('@')) {
                                          return languageProvider.translate(
                                              'invalid_email',
                                              fallback:
                                                  'Geçerli bir e-posta adresi girin');
                                        }
                                        return null;
                                      },
                                    ),
                                    SizedBox(
                                        height:
                                            MediaQuery.of(context).size.height >
                                                    700
                                                ? 20
                                                : 16),

                                    // Şifre
                                    _buildTextField(
                                      controller: _passwordController,
                                      label: languageProvider.translate(
                                          'password',
                                          fallback: 'Şifre'),
                                      icon: Icons.lock_outline,
                                      obscureText: !_passwordVisible,
                                      suffixIcon: IconButton(
                                        icon: Icon(_passwordVisible
                                            ? Icons.visibility_off
                                            : Icons.visibility),
                                        onPressed: () => setState(() =>
                                            _passwordVisible =
                                                !_passwordVisible),
                                      ),
                                      validator: (value) {
                                        if (value == null || value.isEmpty) {
                                          return languageProvider.translate(
                                              'password_required',
                                              fallback: 'Şifre gerekli');
                                        }
                                        return null;
                                      },
                                    ),
                                    SizedBox(
                                        height:
                                            MediaQuery.of(context).size.height >
                                                    700
                                                ? 24
                                                : 20),

                                    // Giriş butonu
                                    SizedBox(
                                      width: double.infinity,
                                      height: 50,
                                      child: ElevatedButton(
                                        onPressed: _isLoading ? null : _login,
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor:
                                              const Color(0xFF667eea),
                                          foregroundColor: Colors.white,
                                          shape: RoundedRectangleBorder(
                                            borderRadius:
                                                BorderRadius.circular(14),
                                          ),
                                          elevation: 4,
                                        ),
                                        child: _isLoading
                                            ? const SizedBox(
                                                width: 20,
                                                height: 20,
                                                child:
                                                    CircularProgressIndicator(
                                                  color: Colors.white,
                                                  strokeWidth: 2,
                                                ),
                                              )
                                            : Row(
                                                mainAxisAlignment:
                                                    MainAxisAlignment.center,
                                                children: [
                                                  const Icon(Icons.login,
                                                      size: 20),
                                                  const SizedBox(width: 8),
                                                  Text(
                                                    languageProvider.translate(
                                                        'login',
                                                        fallback: 'Giriş Yap'),
                                                    style: const TextStyle(
                                                      fontSize: 16,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                      ),
                                    ),
                                    SizedBox(
                                        height:
                                            MediaQuery.of(context).size.height >
                                                    700
                                                ? 16
                                                : 12),

                                    // Şifremi unuttum linki
                                    Center(
                                      child: TextButton(
                                        onPressed: () =>
                                            context.go('/forgot-password'),
                                        child: Text(
                                          languageProvider.translate(
                                              'forgot_password',
                                              fallback: 'Şifremi Unuttum'),
                                          style: const TextStyle(
                                            color: Color(0xFF667eea),
                                            fontSize: 13,
                                            decoration:
                                                TextDecoration.underline,
                                          ),
                                        ),
                                      ),
                                    ),
                                    SizedBox(
                                        height:
                                            MediaQuery.of(context).size.height >
                                                    700
                                                ? 16
                                                : 8),

                                    // Kayıt ol linki
                                    Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: Colors.grey.shade50,
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                            color: Colors.grey.shade200),
                                      ),
                                      child: Column(
                                        children: [
                                          Text(
                                            languageProvider.translate(
                                                'dont_have_account',
                                                fallback: 'Hesabınız yok mu?'),
                                            style: const TextStyle(
                                              color: Colors.grey,
                                              fontSize: 13,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          TextButton.icon(
                                            onPressed: () =>
                                                context.go('/register'),
                                            icon: const Icon(Icons.person_add,
                                                size: 16),
                                            label: Text(
                                              languageProvider.translate(
                                                  'register',
                                                  fallback: 'Kayıt Ol'),
                                              style: const TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                            style: TextButton.styleFrom(
                                              foregroundColor:
                                                  const Color(0xFF667eea),
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                      horizontal: 8,
                                                      vertical: 4),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          SizedBox(
                              height: MediaQuery.of(context).size.height > 700
                                  ? 20
                                  : 16),

                          // Test kullanıcıları kartı
                          Card(
                            elevation: 8,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [
                                    Colors.blue.shade50,
                                    Colors.purple.shade50,
                                  ],
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF667eea)
                                              .withValues(alpha: 0.1),
                                          borderRadius:
                                              BorderRadius.circular(8),
                                        ),
                                        child: const Icon(
                                          Icons.info_outline,
                                          color: Color(0xFF667eea),
                                          size: 20,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Text(
                                        languageProvider.translate('test_users',
                                            fallback: 'Test Kullanıcıları'),
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF667eea),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  _buildTestUserInfo(
                                    role: 'Admin',
                                    email: 'admin@example.com',
                                    password: 'admin123',
                                    icon: Icons.admin_panel_settings,
                                    color: Colors.red,
                                  ),
                                  const SizedBox(height: 8),
                                  _buildTestUserInfo(
                                    role: 'Hizmet Sağlayıcı',
                                    email: 'ahmet@example.com',
                                    password: 'provider123',
                                    icon: Icons.business_center,
                                    color: Colors.orange,
                                  ),
                                  const SizedBox(height: 8),
                                  _buildTestUserInfo(
                                    role: 'Müşteri',
                                    email: 'mehmet@example.com',
                                    password: 'customer123',
                                    icon: Icons.person,
                                    color: Colors.green,
                                  ),
                                ],
                              ),
                            ),
                          ),
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
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF667eea), width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
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

  Widget _buildTestUserInfo({
    required String role,
    required String email,
    required String password,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  role,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  email,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Colors.black87,
                  ),
                ),
                Text(
                  password,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Colors.grey,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () {
              _emailController.text = email;
              _passwordController.text = password;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('$role hesabı bilgileri dolduruldu'),
                  duration: const Duration(seconds: 2),
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
              );
            },
            icon: const Icon(Icons.copy, size: 16),
            tooltip: 'Bilgileri Doldur',
            constraints: const BoxConstraints(
              minWidth: 32,
              minHeight: 32,
            ),
            padding: const EdgeInsets.all(4),
          ),
        ],
      ),
    );
  }
}
