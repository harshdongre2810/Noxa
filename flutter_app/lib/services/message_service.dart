import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'socket_service.dart';
import 'auth_service.dart';

enum MessageStatus { sent, delivered, read, pending, disappeared }

class Message {
  final String id;
  final String from;
  final String to;
  final String text;
  final DateTime timestamp;
  MessageStatus status;
  final bool isMe;
  
  // Privacy features
  final bool isViewOnce;
  final bool isSecretChat;
  final int? selfDestructTimer; // in seconds
  final DateTime? expireAt;
  DateTime? viewedAt;

  Message({
    required this.id,
    required this.from,
    required this.to,
    required this.text,
    required this.timestamp,
    this.status = MessageStatus.pending,
    required this.isMe,
    this.isViewOnce = false,
    this.isSecretChat = false,
    this.selfDestructTimer,
    this.expireAt,
    this.viewedAt,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'from': from,
    'to': to,
    'text': text,
    'timestamp': timestamp.toIso8601String(),
    'status': status.name,
    'isMe': isMe,
    'isViewOnce': isViewOnce,
    'isSecretChat': isSecretChat,
    'selfDestructTimer': selfDestructTimer,
    'expireAt': expireAt?.toIso8601String(),
    'viewedAt': viewedAt?.toIso8601String(),
  };

  factory Message.fromJson(Map<String, dynamic> json) => Message(
    id: json['id'],
    from: json['from'],
    to: json['to'],
    text: json['text'],
    timestamp: DateTime.parse(json['timestamp']),
    status: MessageStatus.values.firstWhere((e) => e.name == json['status']),
    isMe: json['isMe'],
    isViewOnce: json['isViewOnce'] ?? false,
    isSecretChat: json['isSecretChat'] ?? false,
    selfDestructTimer: json['selfDestructTimer'],
    expireAt: json['expireAt'] != null ? DateTime.parse(json['expireAt']) : null,
    viewedAt: json['viewedAt'] != null ? DateTime.parse(json['viewedAt']) : null,
  );
}

class MessageService extends ChangeNotifier {
  final SocketService _socketService;
  final Map<String, List<Message>> _chatHistory = {}; // chatId -> List<Message>
  final List<Message> _offlineQueue = [];

  MessageService(this._socketService) {
    _loadHistory();
    _loadOfflineQueue();
    _socketService.addListener(_onSocketChanged);
    _socketService.messageStream.listen(_handleIncomingMessage);
    _socketService.statusStream.listen(_handleStatusUpdate);
    _socketService.socket.on('viewed', _handleRemoteViewed);
    _socketService.socket.on('screenshot_alert', _handleScreenshotAlert);
    
    // Local cleanup timer (every 10 seconds)
    Timer.periodic(const Duration(seconds: 10), (_) => _cleanupExpiredMessages());
  }

  void _cleanupExpiredMessages() {
    bool changed = false;
    final now = DateTime.now();
    
    _chatHistory.forEach((chatId, messages) {
      final initialCount = messages.length;
      messages.removeWhere((m) {
        if (m.expireAt != null && m.expireAt!.isBefore(now)) {
          return true;
        }
        return false;
      });
      if (messages.length != initialCount) changed = true;
    });

    if (changed) {
      _saveHistory();
      notifyListeners();
    }
  }

  void _handleRemoteViewed(dynamic data) {
    final messageId = data['id'];
    final chatId = data['from'];
    
    final history = _chatHistory[chatId];
    if (history != null) {
      final index = history.indexWhere((m) => m.id == messageId);
      if (index != -1) {
        final msg = history[index];
        if (msg.isViewOnce) {
          history.removeAt(index);
          _saveHistory();
          notifyListeners();
        }
      }
    }
  }

  void _handleScreenshotAlert(dynamic data) {
    final from = data['from'];
    // In a real app, we'd add a system message to the chat
    final systemMsg = Message(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      from: 'system',
      to: 'me',
      text: 'Screenshot detected!',
      timestamp: DateTime.now(),
      isMe: false,
      status: MessageStatus.read,
    );
    _addMessageToHistory(from, systemMsg);
    notifyListeners();
  }

  void _onSocketChanged() {
    if (_socketService.isConnected) {
      processOfflineQueue();
    }
  }

  Future<void> _loadOfflineQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final queueJson = prefs.getString('offline_queue');
    if (queueJson != null) {
      final List<dynamic> decoded = jsonDecode(queueJson);
      _offlineQueue.clear();
      _offlineQueue.addAll(decoded.map((m) => Message.fromJson(m)));
      notifyListeners();
    }
  }

  Future<void> _saveOfflineQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final queueJson = jsonEncode(_offlineQueue.map((m) => m.toJson()).toList());
    await prefs.setString('offline_queue', queueJson);
  }

  Future<void> _loadHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final historyJson = prefs.getString('chat_history');
    if (historyJson != null) {
      final Map<String, dynamic> decoded = jsonDecode(historyJson);
      decoded.forEach((key, value) {
        _chatHistory[key] = (value as List).map((m) => Message.fromJson(m)).toList();
      });
      notifyListeners();
    }
  }

  Future<void> _saveHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final historyJson = jsonEncode(_chatHistory.map((key, value) => MapEntry(key, value.map((m) => m.toJson()).toList())));
    await prefs.setString('chat_history', historyJson);
  }

  List<Message> getMessages(String chatId) => _chatHistory[chatId] ?? [];

  Future<void> sendMessage(String to, String text, {
    bool isViewOnce = false,
    bool isSecretChat = false,
    int? selfDestructTimer,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final from = prefs.getString('userId') ?? '';
    
    final message = Message(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      from: from,
      to: to,
      text: text,
      timestamp: DateTime.now(),
      isMe: true,
      status: MessageStatus.pending,
      isViewOnce: isViewOnce,
      isSecretChat: isSecretChat,
      selfDestructTimer: selfDestructTimer,
      expireAt: !isSecretChat ? DateTime.now().add(const Duration(hours: 24)) : null,
    );

    _addMessageToHistory(to, message);
    await _saveHistory();

    if (_socketService.isConnected) {
      _socketService.sendMessage({
        'id': message.id,
        'to': to,
        'from': from,
        'text': text,
        'timestamp': message.timestamp.millisecondsSinceEpoch,
        'isViewOnce': isViewOnce,
        'isSecretChat': isSecretChat,
        'selfDestructTimer': selfDestructTimer,
        'expireAt': message.expireAt?.millisecondsSinceEpoch,
      });
      message.status = MessageStatus.sent;
      await _saveHistory();
    } else {
      _offlineQueue.add(message);
      await _saveOfflineQueue();
    }
    notifyListeners();
  }

  void _handleIncomingMessage(Map<String, dynamic> data) {
    final message = Message(
      id: data['id'],
      from: data['from'],
      to: data['to'],
      text: data['text'],
      timestamp: DateTime.fromMillisecondsSinceEpoch(data['timestamp']),
      isMe: false,
      status: MessageStatus.delivered,
      isViewOnce: data['isViewOnce'] ?? false,
      isSecretChat: data['isSecretChat'] ?? false,
      selfDestructTimer: data['selfDestructTimer'],
      expireAt: data['expireAt'] != null ? DateTime.fromMillisecondsSinceEpoch(data['expireAt']) : null,
    );

    _addMessageToHistory(message.from, message);
    _saveHistory();
    
    // Send delivered status back
    _socketService.socket.emit('delivered', {'id': message.id, 'to': message.from, 'from': message.to});
    notifyListeners();
  }

  void _handleStatusUpdate(Map<String, dynamic> data) {
    final type = data['type'];
    final from = data['from'];
    final messageId = data['id'];

    if (type == 'delivered' || type == 'read') {
      final history = _chatHistory[from];
      if (history != null) {
        final msgIndex = history.indexWhere((m) => m.id == messageId);
        if (msgIndex != -1) {
          history[msgIndex].status = type == 'read' ? MessageStatus.read : MessageStatus.delivered;
          notifyListeners();
        }
      }
    }
  }

  @override
  void dispose() {
    _socketService.removeListener(_onSocketChanged);
    super.dispose();
  }

  List<Map<String, dynamic>> getRecentChats() {
    final List<Map<String, dynamic>> recent = [];
    _chatHistory.forEach((chatId, messages) {
      if (messages.isNotEmpty) {
        final lastMsg = messages.last;
        final unreadCount = messages.where((m) => !m.isMe && m.status != MessageStatus.read).length;
        recent.add({
          'chatId': chatId,
          'lastMessage': lastMsg.text,
          'timestamp': lastMsg.timestamp,
          'unreadCount': unreadCount,
          'isRead': lastMsg.isMe && lastMsg.status == MessageStatus.read,
        });
      }
    });
    recent.sort((a, b) => (b['timestamp'] as DateTime).compareTo(a['timestamp'] as DateTime));
    return recent;
  }

  void markAsRead(String chatId) {
    final history = _chatHistory[chatId];
    if (history != null) {
      bool changed = false;
      final now = DateTime.now();
      for (var msg in history) {
        if (!msg.isMe && msg.status != MessageStatus.read) {
          msg.status = MessageStatus.read;
          msg.viewedAt = now;
          _socketService.socket.emit('viewed', {'id': msg.id, 'from': msg.to, 'to': msg.from});
          
          if (msg.isViewOnce) {
            // Will be deleted on next frame or after a short delay
            Timer(const Duration(seconds: 1), () {
              history.remove(msg);
              _saveHistory();
              notifyListeners();
            });
          } else if (msg.selfDestructTimer != null) {
            // Set expireAt based on viewedAt + timer
            // This is a simplified version; in a real app we'd update the object
          }
          
          changed = true;
        }
      }
      if (changed) {
        _saveHistory();
        notifyListeners();
      }
    }
  }

  void _addMessageToHistory(String chatId, Message message) {
    if (!_chatHistory.containsKey(chatId)) {
      _chatHistory[chatId] = [];
    }
    _chatHistory[chatId]!.add(message);
  }

  Future<void> processOfflineQueue() async {
    if (_socketService.isConnected && _offlineQueue.isNotEmpty) {
      for (var msg in _offlineQueue) {
        _socketService.sendMessage({
          'id': msg.id,
          'to': msg.to,
          'from': msg.from,
          'text': msg.text,
          'timestamp': msg.timestamp.millisecondsSinceEpoch,
        });
        msg.status = MessageStatus.sent;
      }
      _offlineQueue.clear();
      await _saveOfflineQueue();
      await _saveHistory();
      notifyListeners();
    }
  }
}
