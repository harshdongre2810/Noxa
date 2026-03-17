import 'package:shared_preferences/shared_preferences.dart';

enum UploadQuality { auto, best, saver }

class MediaSettingsService {
  static const String _keyUploadQuality = 'media_upload_quality';
  static const String _keyAutoDownloadMobile = 'auto_download_mobile';
  static const String _keyAutoDownloadWifi = 'auto_download_wifi';
  static const String _keyAutoDownloadRoaming = 'auto_download_roaming';

  Future<UploadQuality> getUploadQuality() async {
    final prefs = await SharedPreferences.getInstance();
    final value = prefs.getString(_keyUploadQuality) ?? 'auto';
    return UploadQuality.values.firstWhere((e) => e.name == value, orElse: () => UploadQuality.auto);
  }

  Future<void> setUploadQuality(UploadQuality quality) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyUploadQuality, quality.name);
  }

  Future<Map<String, bool>> getAutoDownloadSettings(String type) async {
    final prefs = await SharedPreferences.getInstance();
    final key = _getKeyForType(type);
    final List<String> enabled = prefs.getStringList(key) ?? ['Photos'];
    
    return {
      'Photos': enabled.contains('Photos'),
      'Audio': enabled.contains('Audio'),
      'Videos': enabled.contains('Videos'),
      'Documents': enabled.contains('Documents'),
    };
  }

  Future<void> setAutoDownloadSetting(String type, String mediaType, bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    final key = _getKeyForType(type);
    List<String> current = prefs.getStringList(key) ?? ['Photos'];
    
    if (enabled) {
      if (!current.contains(mediaType)) current.add(mediaType);
    } else {
      current.remove(mediaType);
    }
    
    await prefs.setStringList(key, current);
  }

  String _getKeyForType(String type) {
    switch (type) {
      case 'Mobile Data': return _keyAutoDownloadMobile;
      case 'WiFi': return _keyAutoDownloadWifi;
      case 'Roaming': return _keyAutoDownloadRoaming;
      default: return _keyAutoDownloadMobile;
    }
  }
}
