import 'package:cloud_firestore/cloud_firestore.dart';
import 'working_hours_model.dart';

enum AppointmentStatus {
  pending,
  confirmed,
  cancelled,
  completed,
}

class AppointmentModel {
  final String id;
  final String customerId;
  final String providerId;
  final String serviceId;
  final DateTime startTime;
  final DateTime endTime;
  final AppointmentStatus status;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;
  final WorkingHoursModel workingHours;

  AppointmentModel({
    required this.id,
    required this.customerId,
    required this.providerId,
    required this.serviceId,
    required this.startTime,
    required this.endTime,
    required this.status,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
    required this.workingHours,
  });

  factory AppointmentModel.fromMap(Map<String, dynamic>? map) {
    if (map == null) {
      throw Exception('AppointmentModel.fromMap: map is null');
    }

    return AppointmentModel(
      id: map['id'] as String? ?? '',
      customerId: map['customerId'] as String? ?? '',
      providerId: map['providerId'] as String? ?? '',
      serviceId: map['serviceId'] as String? ?? '',
      startTime: map['startTime'] != null 
          ? (map['startTime'] as Timestamp).toDate()
          : DateTime.now(),
      endTime: map['endTime'] != null 
          ? (map['endTime'] as Timestamp).toDate()
          : DateTime.now(),
      status: AppointmentStatus.values.firstWhere(
        (e) => e.toString() == 'AppointmentStatus.${map['status']}',
        orElse: () => AppointmentStatus.pending,
      ),
      notes: map['notes'] as String?,
      createdAt: map['createdAt'] != null 
          ? (map['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
      updatedAt: map['updatedAt'] != null 
          ? (map['updatedAt'] as Timestamp).toDate()
          : DateTime.now(),
      workingHours: map['workingHours'] != null 
          ? WorkingHoursModel.fromMap(map['workingHours'] as Map<String, dynamic>)
          : WorkingHoursModel(
              id: '',
              providerId: map['providerId'] as String? ?? '',
              dayOfWeek: map['startTime'] != null 
                  ? (map['startTime'] as Timestamp).toDate().weekday 
                  : DateTime.now().weekday,
              startTime: '09:00',
              endTime: '17:00',
              isActive: true,
              createdAt: DateTime.now(),
              updatedAt: DateTime.now(),
            ),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'customerId': customerId,
      'providerId': providerId,
      'serviceId': serviceId,
      'startTime': Timestamp.fromDate(startTime),
      'endTime': Timestamp.fromDate(endTime),
      'status': status.toString().split('.').last,
      'notes': notes,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
      'workingHours': workingHours.toMap(),
    };
  }

  AppointmentModel copyWith({
    String? id,
    String? customerId,
    String? providerId,
    String? serviceId,
    DateTime? startTime,
    DateTime? endTime,
    AppointmentStatus? status,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
    WorkingHoursModel? workingHours,
  }) {
    return AppointmentModel(
      id: id ?? this.id,
      customerId: customerId ?? this.customerId,
      providerId: providerId ?? this.providerId,
      serviceId: serviceId ?? this.serviceId,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      workingHours: workingHours ?? this.workingHours,
    );
  }
} 