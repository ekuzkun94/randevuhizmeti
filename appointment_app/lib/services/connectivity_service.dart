import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityService {
  static final ConnectivityService _instance = ConnectivityService._internal();
  factory ConnectivityService() => _instance;
  ConnectivityService._internal();

  final Connectivity _connectivity = Connectivity();
  StreamController<bool> connectionStatusController =
      StreamController<bool>.broadcast();

  bool _isOnline = false;
  bool get isOnline => _isOnline;

  Stream<bool> get connectionStatus => connectionStatusController.stream;

  Future<void> initialize() async {
    // İlk bağlantı durumunu kontrol et
    await _checkConnectionStatus();

    // Bağlantı durumu değişikliklerini dinle
    _connectivity.onConnectivityChanged.listen(_updateConnectionStatus);
  }

  Future<void> _checkConnectionStatus() async {
    try {
      final connectivityResult = await _connectivity.checkConnectivity();
      _updateConnectionStatus(connectivityResult);
    } catch (e) {
      debugPrint('Connectivity check error: $e');
      _updateConnectionStatus(ConnectivityResult.none);
    }
  }

  void _updateConnectionStatus(ConnectivityResult connectivityResult) {
    final wasOnline = _isOnline;

    switch (connectivityResult) {
      case ConnectivityResult.wifi:
      case ConnectivityResult.mobile:
      case ConnectivityResult.ethernet:
        _isOnline = true;
        break;
      case ConnectivityResult.none:
      default:
        _isOnline = false;
        break;
    }

    // Durum değiştiyse bildirim gönder
    if (wasOnline != _isOnline) {
      connectionStatusController.add(_isOnline);
      debugPrint(
          'Connection status changed: ${_isOnline ? "Online" : "Offline"}');
    }
  }

  void dispose() {
    connectionStatusController.close();
  }
}
