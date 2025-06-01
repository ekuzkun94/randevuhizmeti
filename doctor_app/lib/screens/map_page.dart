import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_map_location_marker/flutter_map_location_marker.dart';
import '../models/user_model.dart';

class MapPage extends StatefulWidget {
  const MapPage({super.key});

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> {
  final MapController _mapController = MapController();
  LatLng? _currentPosition;
  List<Marker> _markers = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
    _loadServiceProviders();
  }

  Future<void> _getCurrentLocation() async {
    try {
      // Konum izinlerini kontrol et
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _error = 'Konum izni reddedildi';
            _isLoading = false;
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _error = 'Konum izni kalıcı olarak reddedildi';
          _isLoading = false;
        });
        return;
      }

      // Mevcut konumu al
      final position = await Geolocator.getCurrentPosition();
      setState(() {
        _currentPosition = LatLng(position.latitude, position.longitude);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Konum alınamadı: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _loadServiceProviders() async {
    try {
      final providersSnapshot = await FirebaseFirestore.instance
          .collection('users')
          .where('role', isEqualTo: 'serviceProvider')
          .get();

      final markers = providersSnapshot.docs.map((doc) {
        final provider = UserModel.fromMap(doc.data());
        if (provider.latitude != null && provider.longitude != null) {
          return Marker(
            point: LatLng(provider.latitude!, provider.longitude!),
            width: 80,
            height: 80,
            builder: (context) => GestureDetector(
              onTap: () => _showProviderInfo(provider),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          provider.businessName ?? provider.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          provider.address ?? 'Adres yok',
                          style: const TextStyle(fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                  const Icon(
                    Icons.location_on,
                    color: Colors.red,
                    size: 30,
                  ),
                ],
              ),
            ),
          );
        }
        return null;
      }).whereType<Marker>().toList();

      setState(() {
        _markers = markers;
      });
    } catch (e) {
      setState(() {
        _error = 'Hizmet sağlayıcılar yüklenemedi: $e';
      });
    }
  }

  void _showProviderInfo(UserModel provider) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              provider.businessName ?? provider.name,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            if (provider.address != null) ...[
              const Text(
                'Adres:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              Text(provider.address!),
              const SizedBox(height: 8),
            ],
            if (provider.phone != null) ...[
              const Text(
                'Telefon:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              Text(provider.phone!),
              const SizedBox(height: 8),
            ],
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                // Randevu oluşturma sayfasına yönlendir
              },
              child: const Text('Randevu Oluştur'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_error != null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(_error!),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  setState(() {
                    _error = null;
                    _isLoading = true;
                  });
                  _getCurrentLocation();
                },
                child: const Text('Tekrar Dene'),
              ),
            ],
          ),
        ),
      );
    }

    if (_currentPosition == null) {
      return const Scaffold(
        body: Center(
          child: Text('Konum alınamadı'),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Hizmet Sağlayıcılar'),
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location),
            onPressed: () {
              _mapController.move(_currentPosition!, 15);
            },
          ),
        ],
      ),
      body: FlutterMap(
        mapController: _mapController,
        options: MapOptions(
          initialCenter: _currentPosition!,
          initialZoom: 15,
          onMapReady: () {
            _mapController.move(_currentPosition!, 15);
          },
        ),
        children: [
          TileLayer(
            urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            userAgentPackageName: 'com.example.doctor_app',
          ),
          CurrentLocationLayer(),
          MarkerLayer(markers: _markers),
        ],
      ),
    );
  }
} 