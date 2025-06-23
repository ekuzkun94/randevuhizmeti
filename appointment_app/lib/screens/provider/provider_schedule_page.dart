import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/language_provider.dart';

class ProviderSchedulePage extends StatefulWidget {
  const ProviderSchedulePage({super.key});

  @override
  State<ProviderSchedulePage> createState() => _ProviderSchedulePageState();
}

class _ProviderSchedulePageState extends State<ProviderSchedulePage> {
  final Map<String, Map<String, dynamic>> _schedule = {
    'monday': {
      'name': 'Pazartesi',
      'isWorking': true,
      'startTime': '09:00',
      'endTime': '17:00',
      'breakStartTime': '12:00',
      'breakEndTime': '13:00',
    },
    'tuesday': {
      'name': 'Salı',
      'isWorking': true,
      'startTime': '09:00',
      'endTime': '17:00',
      'breakStartTime': '12:00',
      'breakEndTime': '13:00',
    },
    'wednesday': {
      'name': 'Çarşamba',
      'isWorking': true,
      'startTime': '09:00',
      'endTime': '17:00',
      'breakStartTime': '12:00',
      'breakEndTime': '13:00',
    },
    'thursday': {
      'name': 'Perşembe',
      'isWorking': true,
      'startTime': '09:00',
      'endTime': '17:00',
      'breakStartTime': '12:00',
      'breakEndTime': '13:00',
    },
    'friday': {
      'name': 'Cuma',
      'isWorking': true,
      'startTime': '09:00',
      'endTime': '17:00',
      'breakStartTime': '12:00',
      'breakEndTime': '13:00',
    },
    'saturday': {
      'name': 'Cumartesi',
      'isWorking': false,
      'startTime': '09:00',
      'endTime': '12:00',
      'breakStartTime': null,
      'breakEndTime': null,
    },
    'sunday': {
      'name': 'Pazar',
      'isWorking': false,
      'startTime': '09:00',
      'endTime': '12:00',
      'breakStartTime': null,
      'breakEndTime': null,
    },
  };

  void _editDay(String dayKey, Map<String, dynamic> day) {
    showDialog(
      context: context,
      builder: (context) => _DayEditDialog(
        day: day,
        onSave: (updatedDay) {
          setState(() {
            _schedule[dayKey] = updatedDay;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${day['name']} günü güncellendi'),
              backgroundColor: Colors.green,
            ),
          );
        },
      ),
    );
  }

  void _copyToAllDays(String sourceDayKey) {
    final sourceDay = _schedule[sourceDayKey]!;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Tüm Günlere Kopyala'),
        content: Text(
          '${sourceDay['name']} gününün ayarlarını tüm çalışma günlerine kopyalamak istediğinizden emin misiniz?'
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('İptal'),
          ),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _schedule.forEach((key, value) {
                  if (key != sourceDayKey) {
                    _schedule[key] = {
                      'name': value['name'], // Gün adını koru
                      'isWorking': sourceDay['isWorking'],
                      'startTime': sourceDay['startTime'],
                      'endTime': sourceDay['endTime'],
                      'breakStartTime': sourceDay['breakStartTime'],
                      'breakEndTime': sourceDay['breakEndTime'],
                    };
                  }
                });
              });
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Ayarlar tüm günlere kopyalandı'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF667eea),
              foregroundColor: Colors.white,
            ),
            child: const Text('Kopyala'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LanguageProvider>(
      builder: (context, languageProvider, child) {
        return Scaffold(
          appBar: AppBar(
            title: Text(languageProvider.translate('working_hours', fallback: 'Çalışma Saatleri')),
            backgroundColor: const Color(0xFF667eea),
            foregroundColor: Colors.white,
            actions: [
              IconButton(
                icon: const Icon(Icons.save),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Çalışma saatleri kaydedildi'),
                      backgroundColor: Colors.green,
                    ),
                  );
                },
                tooltip: 'Kaydet',
              ),
            ],
          ),
          body: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF667eea),
                  Color(0xFF764ba2),
                ],
              ),
            ),
            child: Column(
              children: [
                // Bilgi kartı
                Container(
                  margin: const EdgeInsets.all(16),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.info_outline,
                            color: Color(0xFF667eea),
                            size: 24,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Haftalık çalışma programınızı düzenleyin. Randevu alınabilecek saatleri belirleyebilirsiniz.',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[700],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                
                // Günlük çalışma saatleri listesi
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _schedule.length,
                    itemBuilder: (context, index) {
                      final entry = _schedule.entries.elementAt(index);
                      final dayKey = entry.key;
                      final day = entry.value;
                      
                      return _buildDayCard(dayKey, day);
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildDayCard(String dayKey, Map<String, dynamic> day) {
    final isWorking = day['isWorking'] ?? false;
    final hasBreak = day['breakStartTime'] != null && day['breakEndTime'] != null;
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isWorking ? Colors.green : Colors.grey,
            width: 2,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Gün adı ve durum
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    day['name'],
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: isWorking ? const Color(0xFF667eea) : Colors.grey,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isWorking ? Colors.green : Colors.grey,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      isWorking ? 'Açık' : 'Kapalı',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              
              if (isWorking) ...[
                const SizedBox(height: 12),
                
                // Çalışma saatleri
                Row(
                  children: [
                    Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 8),
                    Text(
                      'Çalışma: ${day['startTime']} - ${day['endTime']}',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                
                if (hasBreak) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.coffee, size: 16, color: Colors.grey[600]),
                      const SizedBox(width: 8),
                      Text(
                        'Mola: ${day['breakStartTime']} - ${day['breakEndTime']}',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[700],
                        ),
                      ),
                    ],
                  ),
                ],
              ],
              
              const SizedBox(height: 12),
              
              // Aksiyon butonları
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _editDay(dayKey, day),
                      icon: const Icon(Icons.edit, size: 16),
                      label: const Text('Düzenle'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    onPressed: () => _copyToAllDays(dayKey),
                    icon: const Icon(Icons.copy, size: 16),
                    label: const Text('Kopyala'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF667eea),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DayEditDialog extends StatefulWidget {
  final Map<String, dynamic> day;
  final Function(Map<String, dynamic>) onSave;

  const _DayEditDialog({
    required this.day,
    required this.onSave,
  });

  @override
  State<_DayEditDialog> createState() => _DayEditDialogState();
}

class _DayEditDialogState extends State<_DayEditDialog> {
  late bool _isWorking;
  late TimeOfDay _startTime;
  late TimeOfDay _endTime;
  TimeOfDay? _breakStartTime;
  TimeOfDay? _breakEndTime;
  bool _hasBreak = false;

  @override
  void initState() {
    super.initState();
    _isWorking = widget.day['isWorking'] ?? false;
    _startTime = _parseTime(widget.day['startTime']);
    _endTime = _parseTime(widget.day['endTime']);
    
    if (widget.day['breakStartTime'] != null && widget.day['breakEndTime'] != null) {
      _hasBreak = true;
      _breakStartTime = _parseTime(widget.day['breakStartTime']);
      _breakEndTime = _parseTime(widget.day['breakEndTime']);
    }
  }

  TimeOfDay _parseTime(String timeString) {
    final parts = timeString.split(':');
    return TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
  }

  String _formatTime(TimeOfDay time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }

  Future<void> _selectTime(BuildContext context, TimeOfDay initialTime, Function(TimeOfDay) onSelected) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: initialTime,
    );
    if (picked != null) {
      onSelected(picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('${widget.day['name']} Düzenle'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Çalışma durumu
            SwitchListTile(
              title: const Text('Bu gün çalışıyor musunuz?'),
              value: _isWorking,
              onChanged: (value) {
                setState(() {
                  _isWorking = value;
                });
              },
              activeColor: const Color(0xFF667eea),
            ),
            
            if (_isWorking) ...[
              const SizedBox(height: 16),
              
              // Başlangıç saati
              ListTile(
                leading: const Icon(Icons.access_time),
                title: const Text('Başlangıç Saati'),
                subtitle: Text(_formatTime(_startTime)),
                onTap: () => _selectTime(context, _startTime, (time) {
                  setState(() {
                    _startTime = time;
                  });
                }),
              ),
              
              // Bitiş saati
              ListTile(
                leading: const Icon(Icons.access_time_filled),
                title: const Text('Bitiş Saati'),
                subtitle: Text(_formatTime(_endTime)),
                onTap: () => _selectTime(context, _endTime, (time) {
                  setState(() {
                    _endTime = time;
                  });
                }),
              ),
              
              const SizedBox(height: 16),
              
              // Mola durumu
              SwitchListTile(
                title: const Text('Mola var mı?'),
                value: _hasBreak,
                onChanged: (value) {
                  setState(() {
                    _hasBreak = value;
                    if (!value) {
                      _breakStartTime = null;
                      _breakEndTime = null;
                    } else {
                      _breakStartTime = const TimeOfDay(hour: 12, minute: 0);
                      _breakEndTime = const TimeOfDay(hour: 13, minute: 0);
                    }
                  });
                },
                activeColor: const Color(0xFF667eea),
              ),
              
              if (_hasBreak && _breakStartTime != null && _breakEndTime != null) ...[
                // Mola başlangıç
                ListTile(
                  leading: const Icon(Icons.coffee),
                  title: const Text('Mola Başlangıç'),
                  subtitle: Text(_formatTime(_breakStartTime!)),
                  onTap: () => _selectTime(context, _breakStartTime!, (time) {
                    setState(() {
                      _breakStartTime = time;
                    });
                  }),
                ),
                
                // Mola bitiş
                ListTile(
                  leading: const Icon(Icons.coffee_outlined),
                  title: const Text('Mola Bitiş'),
                  subtitle: Text(_formatTime(_breakEndTime!)),
                  onTap: () => _selectTime(context, _breakEndTime!, (time) {
                    setState(() {
                      _breakEndTime = time;
                    });
                  }),
                ),
              ],
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('İptal'),
        ),
        ElevatedButton(
          onPressed: () {
            final updatedDay = {
              'name': widget.day['name'],
              'isWorking': _isWorking,
              'startTime': _formatTime(_startTime),
              'endTime': _formatTime(_endTime),
              'breakStartTime': _hasBreak ? _formatTime(_breakStartTime!) : null,
              'breakEndTime': _hasBreak ? _formatTime(_breakEndTime!) : null,
            };
            
            widget.onSave(updatedDay);
            Navigator.of(context).pop();
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF667eea),
            foregroundColor: Colors.white,
          ),
          child: const Text('Kaydet'),
        ),
      ],
    );
  }
} 