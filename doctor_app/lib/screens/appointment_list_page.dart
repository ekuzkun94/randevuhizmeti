import 'package:flutter/material.dart';

class AppointmentListPage extends StatelessWidget {
  const AppointmentListPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Randevuları Listele')),
      body: const Center(
        child: Text('Randevu listeleme sayfası (yakında)'),
      ),
    );
  }
} 