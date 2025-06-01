import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'appointment_model.dart';

class WorkingHoursModel {
  final String id;
  final String providerId;
  final int dayOfWeek; // 1-7 (Pazartesi-Pazar)
  final String startTime;
  final String endTime;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  WorkingHoursModel({
    required this.id,
    required this.providerId,
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'providerId': providerId,
      'dayOfWeek': dayOfWeek,
      'startTime': startTime,
      'endTime': endTime,
      'isActive': isActive,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  factory WorkingHoursModel.fromMap(Map<String, dynamic>? map) {
    if (map == null) {
      throw Exception('WorkingHoursModel.fromMap: map is null');
    }
    
    return WorkingHoursModel(
      id: map['id'] as String? ?? '',
      providerId: map['providerId'] as String? ?? '',
      dayOfWeek: map['dayOfWeek'] as int? ?? 1,
      startTime: map['startTime'] as String? ?? '09:00',
      endTime: map['endTime'] as String? ?? '17:00',
      isActive: map['isActive'] as bool? ?? true,
      createdAt: map['createdAt'] != null 
          ? (map['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
      updatedAt: map['updatedAt'] != null 
          ? (map['updatedAt'] as Timestamp).toDate()
          : DateTime.now(),
    );
  }

  TimeOfDay _parseTimeString(String timeString) {
    final parts = timeString.split(':');
    return TimeOfDay(
      hour: int.parse(parts[0]),
      minute: int.parse(parts[1]),
    );
  }

  bool isTimeInRange(TimeOfDay time) {
    final start = _parseTimeString(startTime);
    final end = _parseTimeString(endTime);
    
    final timeInMinutes = time.hour * 60 + time.minute;
    final startInMinutes = start.hour * 60 + start.minute;
    final endInMinutes = end.hour * 60 + end.minute;
    
    return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes;
  }

  List<TimeOfDay> getAvailableTimeSlots(
    int duration,
    List<AppointmentModel> existingAppointments,
  ) {
    final start = _parseTimeString(startTime);
    final end = _parseTimeString(endTime);
    
    final startInMinutes = start.hour * 60 + start.minute;
    final endInMinutes = end.hour * 60 + end.minute;
    
    final availableSlots = <TimeOfDay>[];
    
    // Her 15 dakikada bir kontrol et
    for (var minutes = startInMinutes; minutes <= endInMinutes - duration; minutes += 15) {
      final slotTime = TimeOfDay(
        hour: minutes ~/ 60,
        minute: minutes % 60,
      );
      
      // Randevu çakışması kontrolü
      bool hasConflict = false;
      for (final appointment in existingAppointments) {
        final appointmentStart = TimeOfDay(
          hour: appointment.startTime.hour,
          minute: appointment.startTime.minute,
        );
        final appointmentEnd = TimeOfDay(
          hour: appointment.endTime.hour,
          minute: appointment.endTime.minute,
        );
        
        final slotEnd = TimeOfDay(
          hour: (minutes + duration) ~/ 60,
          minute: (minutes + duration) % 60,
        );
        
        if (_isTimeOverlapping(
          slotTime,
          slotEnd,
          appointmentStart,
          appointmentEnd,
        )) {
          hasConflict = true;
          break;
        }
      }
      
      if (!hasConflict) {
        availableSlots.add(slotTime);
      }
    }
    
    return availableSlots;
  }

  bool _isTimeOverlapping(
    TimeOfDay start1,
    TimeOfDay end1,
    TimeOfDay start2,
    TimeOfDay end2,
  ) {
    final start1Minutes = start1.hour * 60 + start1.minute;
    final end1Minutes = end1.hour * 60 + end1.minute;
    final start2Minutes = start2.hour * 60 + start2.minute;
    final end2Minutes = end2.hour * 60 + end2.minute;
    
    return start1Minutes < end2Minutes && end1Minutes > start2Minutes;
  }

  WorkingHoursModel copyWith({
    String? id,
    String? providerId,
    int? dayOfWeek,
    String? startTime,
    String? endTime,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return WorkingHoursModel(
      id: id ?? this.id,
      providerId: providerId ?? this.providerId,
      dayOfWeek: dayOfWeek ?? this.dayOfWeek,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  TimeOfDay? getStartTime() {
    try {
      final parts = startTime.split(':');
      if (parts.length != 2) return null;
      
      final hour = int.parse(parts[0]);
      final minute = int.parse(parts[1]);
      
      return TimeOfDay(hour: hour, minute: minute);
    } catch (e) {
      print('getStartTime error: $e');
      return null;
    }
  }

  TimeOfDay? getEndTime() {
    try {
      final parts = endTime.split(':');
      if (parts.length != 2) return null;
      
      final hour = int.parse(parts[0]);
      final minute = int.parse(parts[1]);
      
      return TimeOfDay(hour: hour, minute: minute);
    } catch (e) {
      print('getEndTime error: $e');
      return null;
    }
  }

  TimeOfDay _addMinutes(TimeOfDay time, int minutes) {
    final totalMinutes = time.hour * 60 + time.minute + minutes;
    final hour = (totalMinutes ~/ 60) % 24;
    final minute = totalMinutes % 60;
    return TimeOfDay(hour: hour, minute: minute);
  }
} 