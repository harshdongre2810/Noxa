import 'dart:async';
import 'dart:convert';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter/foundation.dart';

class SocketService extends ChangeNotifier {
  late IO.Socket socket;
  bool isConnected = false;
  final String serverUrl = 'https://ais-dev-qb7eseuuwynsfp4xxy3g4f-490784673095.asia-southeast1.run.app'; // Replace with actual URL

  final _messageController = StreamController<Map<String, dynamic>>.broadcast();
  Stream<Map<String, dynamic>> get messageStream => _messageController.stream;

  final _statusController = StreamController<Map<String, dynamic>>.broadcast();
  Stream<Map<String, dynamic>> get statusStream => _statusController.stream;

  void init(String userId) {
    socket = IO.io(serverUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });

    socket.connect();

    socket.onConnect((_) {
      isConnected = true;
      socket.emit('register', userId);
      notifyListeners();
      debugPrint('Connected to NOXA Server');
    });

    socket.onDisconnect((_) {
      isConnected = false;
      notifyListeners();
      debugPrint('Disconnected from NOXA Server');
    });

    socket.on('message', (data) {
      _messageController.add(data);
    });

    socket.on('user_status', (data) {
      _statusController.add(data);
    });

    socket.on('typing', (data) {
      _statusController.add({'type': 'typing', ...data});
    });

    socket.on('delivered', (data) {
      _statusController.add({'type': 'delivered', ...data});
    });

    socket.on('read', (data) {
      _statusController.add({'type': 'read', ...data});
    });
  }

  void sendMessage(Map<String, dynamic> data) {
    socket.emit('message', data);
  }

  void sendTyping(String to, {bool isGroup = false}) {
    socket.emit('typing', {'to': to, 'isGroup': isGroup});
  }

  void sendRead(String messageId, String to, {bool isGroup = false}) {
    socket.emit('read', {'id': messageId, 'to': to, 'isGroup': isGroup});
  }

  void sendDelivered(String messageId, String to, {bool isGroup = false}) {
    socket.emit('delivered', {'id': messageId, 'to': to, 'isGroup': isGroup});
  }

  @override
  void dispose() {
    socket.dispose();
    _messageController.close();
    _statusController.close();
    super.dispose();
  }
}
