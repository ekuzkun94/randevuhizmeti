class Staff {
  final String id;
  final String providerId;
  final String? userId;
  final String firstName;
  final String lastName;
  final String position;
  final String? specialization;
  final int experienceYears;
  final String? phone;
  final String? email;
  final String? bio;
  final String? photoUrl;
  final double rating;
  final int totalReviews;
  final bool isActive;
  final bool isAvailable;
  final Map<String, dynamic>? workingHours;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Staff({
    required this.id,
    required this.providerId,
    this.userId,
    required this.firstName,
    required this.lastName,
    required this.position,
    this.specialization,
    this.experienceYears = 0,
    this.phone,
    this.email,
    this.bio,
    this.photoUrl,
    this.rating = 0.0,
    this.totalReviews = 0,
    this.isActive = true,
    this.isAvailable = true,
    this.workingHours,
    required this.createdAt,
    this.updatedAt,
  });

  // Full name getter
  String get fullName => '$firstName $lastName';

  // Display name with position
  String get displayName => '$fullName ($position)';

  // Rating display
  String get ratingDisplay => rating.toStringAsFixed(1);

  // Experience display
  String get experienceDisplay => '$experienceYears yıl';

  // From JSON
  factory Staff.fromJson(Map<String, dynamic> json) {
    return Staff(
      id: json['id'] ?? '',
      providerId: json['provider_id'] ?? '',
      userId: json['user_id'],
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      position: json['position'] ?? '',
      specialization: json['specialization'],
      experienceYears: json['experience_years'] ?? 0,
      phone: json['phone'],
      email: json['email'],
      bio: json['bio'],
      photoUrl: json['photo_url'],
      rating: (json['rating'] ?? 0.0).toDouble(),
      totalReviews: json['total_reviews'] ?? 0,
      isActive: json['is_active'] ?? true,
      isAvailable: json['is_available'] ?? true,
      workingHours: json['working_hours'] != null
          ? Map<String, dynamic>.from(json['working_hours'])
          : null,
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
      'provider_id': providerId,
      'user_id': userId,
      'first_name': firstName,
      'last_name': lastName,
      'position': position,
      'specialization': specialization,
      'experience_years': experienceYears,
      'phone': phone,
      'email': email,
      'bio': bio,
      'photo_url': photoUrl,
      'rating': rating,
      'total_reviews': totalReviews,
      'is_active': isActive,
      'is_available': isAvailable,
      'working_hours': workingHours,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  // Copy with
  Staff copyWith({
    String? id,
    String? providerId,
    String? userId,
    String? firstName,
    String? lastName,
    String? position,
    String? specialization,
    int? experienceYears,
    String? phone,
    String? email,
    String? bio,
    String? photoUrl,
    double? rating,
    int? totalReviews,
    bool? isActive,
    bool? isAvailable,
    Map<String, dynamic>? workingHours,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Staff(
      id: id ?? this.id,
      providerId: providerId ?? this.providerId,
      userId: userId ?? this.userId,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      position: position ?? this.position,
      specialization: specialization ?? this.specialization,
      experienceYears: experienceYears ?? this.experienceYears,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      bio: bio ?? this.bio,
      photoUrl: photoUrl ?? this.photoUrl,
      rating: rating ?? this.rating,
      totalReviews: totalReviews ?? this.totalReviews,
      isActive: isActive ?? this.isActive,
      isAvailable: isAvailable ?? this.isAvailable,
      workingHours: workingHours ?? this.workingHours,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  String toString() {
    return 'Staff(id: $id, name: $fullName, position: $position, providerId: $providerId)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Staff && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
