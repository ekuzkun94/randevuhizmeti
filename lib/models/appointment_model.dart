import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:randevu_projesi/models/working_hours_model.dart';

class AppointmentModel {
  final String id;
  final String userId;
  final String doctorId;
  final DateTime date;
  final WorkingHoursModel workingHours;
  final String status;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  AppointmentModel({
    required this.id,
    required this.userId,
    required this.doctorId,
    required this.date,
    required this.workingHours,
    required this.status,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    return AppointmentModel(
      id: json['id'] as String,
      userId: json['userId'] as String,
      doctorId: json['doctorId'] as String,
      date: (json['date'] as Timestamp).toDate(),
      workingHours: WorkingHoursModel.fromJson(json['workingHours'] as Map<String, dynamic>),
      status: json['status'] as String,
      notes: json['notes'] as String?,
      createdAt: (json['createdAt'] as Timestamp).toDate(),
      updatedAt: (json['updatedAt'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'doctorId': doctorId,
      'date': Timestamp.fromDate(date),
      'workingHours': workingHours.toJson(),
      'status': status,
      'notes': notes,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  AppointmentModel copyWith({
    String? id,
    String? userId,
    String? doctorId,
    DateTime? date,
    WorkingHoursModel? workingHours,
    String? status,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return AppointmentModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      doctorId: doctorId ?? this.doctorId,
      date: date ?? this.date,
      workingHours: workingHours ?? this.workingHours,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
} 