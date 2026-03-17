import 'package:shared_preferences/shared_preferences.dart';

class NetworkUsageService {
  static const String _keySentMessages = 'net_sent_messages';
  static const String _keyReceivedMessages = 'net_received_messages';
  static const String _keySentMedia = 'net_sent_media';
  static const String _keyReceivedMedia = 'net_received_media';
  static const String _keyTotalBytes = 'net_total_bytes';

  Future<Map<String, dynamic>> getStats() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'sentMessages': prefs.getInt(_keySentMessages) ?? 0,
      'receivedMessages': prefs.getInt(_keyReceivedMessages) ?? 0,
      'sentMedia': prefs.getInt(_keySentMedia) ?? 0,
      'receivedMedia': prefs.getInt(_keyReceivedMedia) ?? 0,
      'totalBytes': prefs.getDouble(_keyTotalBytes) ?? 0.0,
    };
  }

  Future<void> trackMessageSent() async {
    final prefs = await SharedPreferences.getInstance();
    int current = prefs.getInt(_keySentMessages) ?? 0;
    await prefs.setInt(_keySentMessages, current + 1);
  }

  Future<void> trackMessageReceived() async {
    final prefs = await SharedPreferences.getInstance();
    int current = prefs.getInt(_keyReceivedMessages) ?? 0;
    await prefs.setInt(_keyReceivedMessages, current + 1);
  }

  Future<void> trackMediaTransfer(double bytes, bool isSent) async {
    final prefs = await SharedPreferences.getInstance();
    String mediaKey = isSent ? _keySentMedia : _keyReceivedMedia;
    int currentMedia = prefs.getInt(mediaKey) ?? 0;
    await prefs.setInt(mediaKey, currentMedia + 1);

    double total = prefs.getDouble(_keyTotalBytes) ?? 0.0;
    await prefs.setDouble(_keyTotalBytes, total + bytes);
  }

  Future<void> resetStats() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keySentMessages);
    await prefs.remove(_keyReceivedMessages);
    await prefs.remove(_keySentMedia);
    await prefs.remove(_keyReceivedMedia);
    await prefs.remove(_keyTotalBytes);
  }
}
