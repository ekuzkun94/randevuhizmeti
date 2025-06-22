import 'package:uuid/uuid.dart';
import 'package:flutter/material.dart';

enum AppointmentStatus {
  pending('pending', 'Bekliyor', 'Pending'),
  confirmed('confirmed', 'Onaylandı', 'Confirmed'),
  cancelled('cancelled', 'İptal Edildi', 'Cancelled'),
  completed('completed', 'Tamamlandı', 'Completed'),
  noShow('no_show', 'Gelmedi', 'No Show');

  const AppointmentStatus(this.value, this.trLabel, this.enLabel);
  
  final String value;
  final String trLabel;
  final String enLabel;
  
  static AppointmentStatus fromString(String value) {
    return AppointmentStatus.values.firstWhere(
      (status) => status.value == value,
      orElse: () => AppointmentStatus.pending,
    );
  }
}

class AppointmentModel {
  final String id;
  final String customerId;
  final String? customerName; // For guest appointments
  final String? customerEmail; // For guest appointments
  final String? customerPhone; // For guest appointments
  final String providerId;
  final String serviceId;
  final DateTime appointmentDate;
  final String appointmentTime;
  final String? notes;
  final AppointmentStatus status;
  final bool isGuest;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  // Additional fields for enhanced functionality
  final int? duration; // Duration in minutes
  final String? location;
  final double? price;
  final String? paymentStatus;
  final String? meetingLink; // For online appointments

  AppointmentModel({
    String? id,
    required this.customerId,
    this.customerName,
    this.customerEmail,
    this.customerPhone,
    required this.providerId,
    required this.serviceId,
    required this.appointmentDate,
    required this.appointmentTime,
    this.notes,
    AppointmentStatus? status,
    bool? isGuest,
    DateTime? createdAt,
    DateTime? updatedAt,
    this.duration,
    this.location,
    this.price,
    this.paymentStatus,
    this.meetingLink,
  }) : 
    id = id ?? const Uuid().v4(),
    status = status ?? AppointmentStatus.pending,
    isGuest = isGuest ?? false,
    createdAt = createdAt ?? DateTime.now(),
    updatedAt = updatedAt ?? DateTime.now();

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    return AppointmentModel(
      id: json['id'] as String,
      customerId: json['customer_id'] as String,
      customerName: json['customer_name'] as String?,
      customerEmail: json['customer_email'] as String?,
      customerPhone: json['customer_phone'] as String?,
      providerId: json['provider_id'] as String,
      serviceId: json['service_id'] as String,
      appointmentDate: DateTime.parse(json['appointment_date'] as String),
      appointmentTime: json['appointment_time'] as String,
      notes: json['notes'] as String?,
      status: AppointmentStatus.fromString(json['status'] as String? ?? 'pending'),
      isGuest: json['is_guest'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      duration: json['duration'] as int?,
      location: json['location'] as String?,
      price: (json['price'] as num?)?.toDouble(),
      paymentStatus: json['payment_status'] as String?,
      meetingLink: json['meeting_link'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'customer_id': customerId,
      'customer_name': customerName,
      'customer_email': customerEmail,
      'customer_phone': customerPhone,
      'provider_id': providerId,
      'service_id': serviceId,
      'appointment_date': appointmentDate.toIso8601String(),
      'appointment_time': appointmentTime,
      'notes': notes,
      'status': status.value,
      'is_guest': isGuest,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'duration': duration,
      'location': location,
      'price': price,
      'payment_status': paymentStatus,
      'meeting_link': meetingLink,
    };
  }

  AppointmentModel copyWith({
    String? id,
    String? customerId,
    String? customerName,
    String? customerEmail,
    String? customerPhone,
    String? providerId,
    String? serviceId,
    DateTime? appointmentDate,
    String? appointmentTime,
    String? notes,
    AppointmentStatus? status,
    bool? isGuest,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? duration,
    String? location,
    double? price,
    String? paymentStatus,
    String? meetingLink,
  }) {
    return AppointmentModel(
      id: id ?? this.id,
      customerId: customerId ?? this.customerId,
      customerName: customerName ?? this.customerName,
      customerEmail: customerEmail ?? this.customerEmail,
      customerPhone: customerPhone ?? this.customerPhone,
      providerId: providerId ?? this.providerId,
      serviceId: serviceId ?? this.serviceId,
      appointmentDate: appointmentDate ?? this.appointmentDate,
      appointmentTime: appointmentTime ?? this.appointmentTime,
      notes: notes ?? this.notes,
      status: status ?? this.status,
      isGuest: isGuest ?? this.isGuest,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      duration: duration ?? this.duration,
      location: location ?? this.location,
      price: price ?? this.price,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      meetingLink: meetingLink ?? this.meetingLink,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is AppointmentModel && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() {
    return 'AppointmentModel(id: $id, customerId: $customerId, providerId: $providerId, date: $appointmentDate, status: $status)';
  }

  // Helper methods
  bool get isUpcoming => appointmentDate.isAfter(DateTime.now());
  bool get isToday => appointmentDate.day == DateTime.now().day && 
                      appointmentDate.month == DateTime.now().month && 
                      appointmentDate.year == DateTime.now().year;
  bool get isPast => appointmentDate.isBefore(DateTime.now());
  
  String get statusLabel {
    switch (status) {
      case AppointmentStatus.pending:
        return 'Bekliyor';
      case AppointmentStatus.confirmed:
        return 'Onaylandı';
      case AppointmentStatus.cancelled:
        return 'İptal Edildi';
      case AppointmentStatus.completed:
        return 'Tamamlandı';
      case AppointmentStatus.noShow:
        return 'Gelmedi';
    }
  }

  String get statusLabelEn {
    switch (status) {
      case AppointmentStatus.pending:
        return 'Pending';
      case AppointmentStatus.confirmed:
        return 'Confirmed';
      case AppointmentStatus.cancelled:
        return 'Cancelled';
      case AppointmentStatus.completed:
        return 'Completed';
      case AppointmentStatus.noShow:
        return 'No Show';
    }
  }

  Color get statusColor {
    switch (status) {
      case AppointmentStatus.pending:
        return Colors.orange;
      case AppointmentStatus.confirmed:
        return Colors.green;
      case AppointmentStatus.cancelled:
        return Colors.red;
      case AppointmentStatus.completed:
        return Colors.blue;
      case AppointmentStatus.noShow:
        return Colors.grey;
    }
  }
} 