import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

class StorageService {
  Future<Map<String, double>> getStorageUsage() async {
    // Mocking storage scanning for the demo
    // In a real app, we would iterate through the app's document directory
    return {
      'Photos': 1.2 * 1024 * 1024 * 1024, // 1.2 GB
      'Videos': 2.5 * 1024 * 1024 * 1024, // 2.5 GB
      'Documents': 450 * 1024 * 1024,      // 450 MB
      'Audio': 120 * 1024 * 1024,         // 120 MB
    };
  }

  Future<List<ChatStorageInfo>> getChatStorageBreakdown() async {
    return [
      ChatStorageInfo(username: 'Alex Rivera', size: 1.5 * 1024 * 1024 * 1024, mediaCount: 450),
      ChatStorageInfo(username: 'Sarah Jenkins', size: 850 * 1024 * 1024, mediaCount: 120),
      ChatStorageInfo(username: 'Dev Team', size: 420 * 1024 * 1024, mediaCount: 85),
      ChatStorageInfo(username: 'John Doe', size: 120 * 1024 * 1024, mediaCount: 30),
      ChatStorageInfo(username: 'Family Group', size: 45 * 1024 * 1024, mediaCount: 12),
    ];
  }

  Future<void> deleteMedia(String path) async {
    try {
      final file = File(path);
      if (await file.exists()) {
        await file.delete();
      }
    } catch (e) {
      debugPrint('Error deleting file: $e');
    }
  }

  String formatBytes(double bytes) {
    if (bytes <= 0) return "0 B";
    const suffixes = ["B", "KB", "MB", "GB", "TB"];
    var i = (bytes > 0) ? (bytes / 1024).floor().toString().length ~/ 3 : 0;
    // Simple log logic for demonstration
    if (bytes < 1024) return "${bytes.toStringAsFixed(0)} B";
    if (bytes < 1024 * 1024) return "${(bytes / 1024).toStringAsFixed(1)} KB";
    if (bytes < 1024 * 1024 * 1024) return "${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB";
    return "${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB";
  }
}

class ChatStorageInfo {
  final String username;
  final double size;
  final int mediaCount;

  ChatStorageInfo({required this.username, required this.size, required this.mediaCount});
}
