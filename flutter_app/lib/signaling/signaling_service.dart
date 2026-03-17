// lib/signaling/signaling_service.dart

import 'dart:async';

/// Abstract signaling interface.
/// Decouples the WebRTC logic from the transport layer (WebSocket, MQTT, etc).
abstract class SignalingService {
  /// Stream of incoming signaling messages.
  Stream<Map<String, dynamic>> get messageStream;
  
  /// Connects to the signaling server.
  Future<void> connect(String url);
  
  /// Sends signaling data (Offer, Answer, ICE Candidate, Hangup) to a specific user.
  Future<void> send(String to, Map<String, dynamic> data);
  
  /// Disposes of the signaling service.
  Future<void> dispose();
}
