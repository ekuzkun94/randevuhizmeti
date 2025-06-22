class LanguageModel {
  final String id;
  final String name;
  final String nativeName;
  final String flagEmoji;
  final bool isActive;
  final int sortOrder;
  final DateTime createdAt;
  final DateTime updatedAt;

  LanguageModel({
    required this.id,
    required this.name,
    required this.nativeName,
    required this.flagEmoji,
    required this.isActive,
    required this.sortOrder,
    required this.createdAt,
    required this.updatedAt,
  });

  factory LanguageModel.fromJson(Map<String, dynamic> json) {
    return LanguageModel(
      id: json['id'] as String,
      name: json['name'] as String,
      nativeName: json['native_name'] as String,
      flagEmoji: json['flag_emoji'] as String,
      isActive: json['is_active'] == 1,
      sortOrder: json['sort_order'] as int,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'native_name': nativeName,
      'flag_emoji': flagEmoji,
      'is_active': isActive ? 1 : 0,
      'sort_order': sortOrder,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}

class TranslationModel {
  final String id;
  final String languageId;
  final String translationKey;
  final String translationValue;
  final String category;
  final DateTime createdAt;
  final DateTime updatedAt;

  TranslationModel({
    required this.id,
    required this.languageId,
    required this.translationKey,
    required this.translationValue,
    required this.category,
    required this.createdAt,
    required this.updatedAt,
  });

  factory TranslationModel.fromJson(Map<String, dynamic> json) {
    return TranslationModel(
      id: json['id'] as String,
      languageId: json['language_id'] as String,
      translationKey: json['translation_key'] as String,
      translationValue: json['translation_value'] as String,
      category: json['category'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'language_id': languageId,
      'translation_key': translationKey,
      'translation_value': translationValue,
      'category': category,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
} 