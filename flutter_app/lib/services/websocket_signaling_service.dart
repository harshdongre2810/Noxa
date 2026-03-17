// lib/services/websocket_signaling_service.dart

import 'dart:convert';
import 'dart:async';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'signaling_service.dart';

/// Concrete implementation of signaling using WebSockets.
/// Requires a backend that routes messages based on the 'to' field.
class WebSocketSignalingService implements SignalingService {
  WebSocketChannel? _channel;
  final _controller = StreamController<Map<String, dynamic>>.broadcast();

  @override
  Stream<Map<String, dynamic>> get messageStream => _controller.stream;

  @override
  Future<void> connect(String url) async {
    // TODO: Implement real WebSocket connection with auth headers/tokens
    // Backend REQUIRED: A server running on 'url' that handles JSON signaling.
    try {
      _channel = WebSocketChannel.connect(Uri.parse(url));
      _channel!.stream.listen(
        (message) {
          final data = jsonDecode(message);
          _controller.add(data);
        },
        onError: (e) => print('Signaling Error: $e'),
        onDone: () => print('Signaling Closed'),
      );
    } catch (e) {
      print('Could not connect to signaling: $e');
    }
  }

  @override
  Future<void> send(String to, Map<String, dynamic> data) async {
    if (_channel == null) return;
    
    final payload = {
      'to': to,
      'data': data,
      'timestamp': DateTime.now().toIso8601String(),
    };
    
    _channel!.sink.add(jsonEncode(payload));
  }

  @override
  Future<void> dispose() async {
    await _channel?.sink.close();
    await _controller.close();
  }
}
