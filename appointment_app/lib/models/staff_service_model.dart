class StaffService {
  final String id;
  final String staffId;
  final String serviceId;
  final bool isPrimary;
  final String experienceLevel; // beginner, intermediate, expert
  final double priceModifier;
  final bool isActive;
  final DateTime createdAt;
  final DateTime? updatedAt;

  // Service details (populated when joining with services table)
  final String? serviceName;
  final String? serviceDescription;
  final double? servicePrice;
  final int? serviceDuration;
  final double? staffServicePrice; // servicePrice * priceModifier

  StaffService({
    required this.id,
    required this.staffId,
    required this.serviceId,
    this.isPrimary = false,
    this.experienceLevel = 'intermediate',
    this.priceModifier = 1.0,
    this.isActive = true,
    required this.createdAt,
    this.updatedAt,
    this.serviceName,
    this.serviceDescription,
    this.servicePrice,
    this.serviceDuration,
    this.staffServicePrice,
  });

  // Experience level display
  String get experienceLevelDisplay {
    switch (experienceLevel.toLowerCase()) {
      case 'beginner':
        return 'Başlangıç';
      case 'intermediate':
        return 'Orta';
      case 'expert':
        return 'Uzman';
      default:
        return experienceLevel;
    }
  }

  // Price modifier display
  String get priceModifierDisplay {
    if (priceModifier == 1.0) {
      return 'Standart Fiyat';
    } else if (priceModifier > 1.0) {
      final percentage = ((priceModifier - 1.0) * 100).round();
      return '+%$percentage';
    } else {
      final percentage = ((1.0 - priceModifier) * 100).round();
      return '-%$percentage';
    }
  }

  // From JSON
  factory StaffService.fromJson(Map<String, dynamic> json) {
    return StaffService(
      id: json['id'] ?? '',
      staffId: json['staff_id'] ?? '',
      serviceId: json['service_id'] ?? '',
      isPrimary: json['is_primary'] ?? false,
      experienceLevel: json['experience_level'] ?? 'intermediate',
      priceModifier: (json['price_modifier'] ?? 1.0).toDouble(),
      isActive: json['is_active'] ?? true,
      createdAt: DateTime.parse(
          json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
      serviceName: json['service_name'],
      serviceDescription: json['service_description'],
      servicePrice: json['service_price'] != null
          ? (json['service_price'] as num).toDouble()
          : null,
      serviceDuration: json['service_duration'],
      staffServicePrice: json['staff_service_price'] != null
          ? (json['staff_service_price'] as num).toDouble()
          : null,
    );
  }

  // To JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'staff_id': staffId,
      'service_id': serviceId,
      'is_primary': isPrimary,
      'experience_level': experienceLevel,
      'price_modifier': priceModifier,
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'service_name': serviceName,
      'service_description': serviceDescription,
      'service_price': servicePrice,
      'service_duration': serviceDuration,
      'staff_service_price': staffServicePrice,
    };
  }

  // Copy with
  StaffService copyWith({
    String? id,
    String? staffId,
    String? serviceId,
    bool? isPrimary,
    String? experienceLevel,
    double? priceModifier,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? serviceName,
    String? serviceDescription,
    double? servicePrice,
    int? serviceDuration,
    double? staffServicePrice,
  }) {
    return StaffService(
      id: id ?? this.id,
      staffId: staffId ?? this.staffId,
      serviceId: serviceId ?? this.serviceId,
      isPrimary: isPrimary ?? this.isPrimary,
      experienceLevel: experienceLevel ?? this.experienceLevel,
      priceModifier: priceModifier ?? this.priceModifier,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      serviceName: serviceName ?? this.serviceName,
      serviceDescription: serviceDescription ?? this.serviceDescription,
      servicePrice: servicePrice ?? this.servicePrice,
      serviceDuration: serviceDuration ?? this.serviceDuration,
      staffServicePrice: staffServicePrice ?? this.staffServicePrice,
    );
  }

  @override
  String toString() {
    return 'StaffService(id: $id, staffId: $staffId, serviceId: $serviceId, isPrimary: $isPrimary, experienceLevel: $experienceLevel)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is StaffService && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
