// lib/signaling/websocket_signaling_service.dart

import 'dart:convert';
import 'dart:async';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'signaling_service.dart';

class WebSocketSignalingService implements SignalingService {
  WebSocketChannel? _channel;
  final _controller = StreamController<Map<String, dynamic>>.broadcast();

  @override
  Stream<Map<String, dynamic>> get messageStream => _controller.stream;

  @override
  Future<void> connect(String url) async {
    // TODO: Implement robust reconnection logic, heartbeat, and auth headers.
    try {
      _channel = WebSocketChannel.connect(Uri.parse(url));
      _channel!.stream.listen(
        (message) {
          final data = jsonDecode(message);
          _controller.add(data);
        },
        onError: (e) => print('Signaling Error: $e'),
        onDone: () => print('Signaling Connection Closed'),
      );
    } catch (e) {
      print('Signaling Connection Failed: $e');
    }
  }

  @override
  Future<void> send(String to, Map<String, dynamic> data) async {
    if (_channel == null) {
      print('Warning: Attempted to send signaling message while disconnected.');
      return;
    }
    
    _channel!.sink.add(jsonEncode({
      'to': to,
      'payload': data,
      'timestamp': DateTime.now().toIso8601String(),
    }));
  }

  @override
  Future<void> dispose() async {
    await _channel?.sink.close();
    await _controller.close();
  }
}
