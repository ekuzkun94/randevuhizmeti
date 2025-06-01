import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../models/user_model.dart';

class MapPage extends StatefulWidget {
  const MapPage({super.key});

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> {
  GoogleMapController? _mapController;
  final Set<Marker> _markers = {};
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadServiceProviders();
  }

  Future<void> _loadServiceProviders() async {
    try {
      final snapshot = await FirebaseFirestore.instance
          .collection('users')
          .where('role', isEqualTo: 'serviceProvider')
          .get();

      final providers = snapshot.docs.map((doc) {
        try {
          return UserModel.fromMap(doc.data() as Map<String, dynamic>);
        } catch (e) {
          print('Hizmet sağlayıcı dönüştürme hatası: $e');
          return null;
        }
      }).where((provider) => provider != null && provider.latitude != null && provider.longitude != null)
          .cast<UserModel>()
          .toList();

      if (providers.isNotEmpty) {
        final markers = providers.map((provider) {
          return Marker(
            markerId: MarkerId(provider.id),
            position: LatLng(provider.latitude!, provider.longitude!),
            infoWindow: InfoWindow(
              title: provider.businessName ?? provider.name,
              snippet: provider.address,
            ),
          );
        }).toSet();

        setState(() {
          _markers.addAll(markers);
          _isLoading = false;
        });

        // Haritayı ilk hizmet sağlayıcının konumuna odakla
        if (_mapController != null && providers.isNotEmpty) {
          _mapController!.animateCamera(
            CameraUpdate.newLatLngZoom(
              LatLng(providers.first.latitude!, providers.first.longitude!),
              12,
            ),
          );
        }
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Hizmet sağlayıcılar yüklenemedi: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Haritada Gör'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _markers.isEmpty
                  ? const Center(child: Text('Haritada gösterilecek hizmet sağlayıcı bulunamadı.'))
                  : GoogleMap(
                      onMapCreated: (controller) {
                        _mapController = controller;
                      },
                      initialCameraPosition: const CameraPosition(
                        target: LatLng(41.0082, 28.9784), // İstanbul
                        zoom: 12,
                      ),
                      markers: _markers,
                      myLocationEnabled: true,
                      myLocationButtonEnabled: true,
                    ),
    );
  }
} 