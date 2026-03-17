// lib/services/signaling_service.dart

import 'dart:async';

/// Abstract interface for signaling.
/// This allows swapping WebSocket with Firebase or any other transport.
abstract class SignalingService {
  /// Stream of incoming signaling messages (offers, answers, candidates, hangup)
  Stream<Map<String, dynamic>> get messageStream;
  
  /// Initialize connection to signaling server
  Future<void> connect(String url);
  
  /// Send signaling data to a specific user
  Future<void> send(String to, Map<String, dynamic> data);
  
  /// Close signaling connection
  Future<void> dispose();
}
