class Provider {
  final String id;
  final String? userId;
  final String businessName;
  final String? description;
  final String specialization;
  final int experienceYears;
  final String? phone;
  final String address;
  final String city;
  final double? rating;
  final int? totalReviews;
  final bool isActive;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Provider({
    required this.id,
    this.userId,
    required this.businessName,
    this.description,
    required this.specialization,
    this.experienceYears = 0,
    this.phone,
    required this.address,
    required this.city,
    this.rating,
    this.totalReviews,
    this.isActive = true,
    required this.createdAt,
    this.updatedAt,
  });

  // Display name
  String get displayName => businessName;

  // Rating display
  String get ratingDisplay => rating?.toStringAsFixed(1) ?? '0.0';

  // Experience display
  String get experienceDisplay => '$experienceYears yıl';

  // From JSON
  factory Provider.fromJson(Map<String, dynamic> json) {
    return Provider(
      id: json['id'] ?? '',
      userId: json['user_id'],
      businessName: json['business_name'] ?? '',
      description: json['description'],
      specialization: json['specialization'] ?? '',
      experienceYears: json['experience_years'] ?? 0,
      phone: json['phone'],
      address: json['address'] ?? '',
      city: json['city'] ?? '',
      rating:
          json['rating'] != null ? (json['rating'] as num).toDouble() : null,
      totalReviews: json['total_reviews'],
      isActive: json['is_active'] ?? true,
      createdAt: DateTime.parse(
          json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
    );
  }

  // To JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'business_name': businessName,
      'description': description,
      'specialization': specialization,
      'experience_years': experienceYears,
      'phone': phone,
      'address': address,
      'city': city,
      'rating': rating,
      'total_reviews': totalReviews,
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  // Copy with
  Provider copyWith({
    String? id,
    String? userId,
    String? businessName,
    String? description,
    String? specialization,
    int? experienceYears,
    String? phone,
    String? address,
    String? city,
    double? rating,
    int? totalReviews,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Provider(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      businessName: businessName ?? this.businessName,
      description: description ?? this.description,
      specialization: specialization ?? this.specialization,
      experienceYears: experienceYears ?? this.experienceYears,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      city: city ?? this.city,
      rating: rating ?? this.rating,
      totalReviews: totalReviews ?? this.totalReviews,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  String toString() {
    return 'Provider(id: $id, businessName: $businessName, specialization: $specialization)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Provider && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
