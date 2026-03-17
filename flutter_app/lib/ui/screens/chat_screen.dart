import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../theme/app_theme.dart';
import '../widgets/chat_bubble.dart';
import '../widgets/message_input.dart';
import '../widgets/avatar_widget.dart';
import '../../services/message_service.dart';
import '../../services/socket_service.dart';
import '../../services/screenshot_service.dart';

class ChatScreen extends StatefulWidget {
  final String username;
  final String userId; // Add userId to identify the chat
  final String? avatarUrl;

  const ChatScreen({
    super.key,
    required this.username,
    required this.userId,
    this.avatarUrl,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  bool _isTyping = false;
  Timer? _typingTimer;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<MessageService>().markAsRead(widget.userId);
    });
    
    // Listen for screenshot alerts
    ScreenshotService.onScreenshotDetected = (from) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Screenshot detected by ${from == 'me' ? 'you' : widget.username}!'),
            backgroundColor: Colors.redAccent,
          ),
        );
        // Notify server
        context.read<SocketService>().socket.emit('screenshot', {'from': 'me', 'to': widget.userId});
      }
    };
  }

  @override
  void dispose() {
    _typingTimer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage(String text, {bool isViewOnce = false, bool isSecretChat = false, int? selfDestructTimer}) {
    context.read<MessageService>().sendMessage(
      widget.userId,
      text,
      isViewOnce: isViewOnce,
      isSecretChat: isSecretChat,
      selfDestructTimer: selfDestructTimer,
    );
    _scrollToBottom();
  }

  void _onTyping() {
    context.read<SocketService>().sendTyping(widget.userId);
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent + 100,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _showAttachmentMenu() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surfaceColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.bottom(24),
                decoration: BoxDecoration(
                  color: AppTheme.secondarySurfaceColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              GridView.count(
                shrinkWrap: true,
                crossAxisCount: 3,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                children: [
                  _buildAttachmentItem(Icons.image, 'Photo', Colors.purple),
                  _buildAttachmentItem(Icons.videocam, 'Video', Colors.rose),
                  _buildAttachmentItem(Icons.insert_drive_file, 'File', Colors.blue),
                  _buildAttachmentItem(Icons.camera_alt, 'Camera', Colors.orange),
                  _buildAttachmentItem(Icons.description, 'Document', Colors.emerald),
                  _buildAttachmentItem(Icons.location_on, 'Location', Colors.red),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildAttachmentItem(IconData icon, String label, Color color) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 28),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leadingWidth: 40,
        title: Row(
          children: [
            AvatarWidget(username: widget.username, imageUrl: widget.avatarUrl, size: 36, isOnline: true),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.username,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const Text(
                    'Online',
                    style: TextStyle(fontSize: 12, color: Colors.emerald, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.videocam_outlined, color: AppTheme.primaryColor),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('WebRTC Video Call: Establishing secure connection...')),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.phone_outlined, color: AppTheme.primaryColor),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('WebRTC Voice Call: Establishing secure connection...')),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.more_vert, color: AppTheme.textSecondary),
            onPressed: () {
              // Mock screenshot for demo
              ScreenshotService.mockScreenshot();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: Consumer<MessageService>(
              builder: (context, messageService, child) {
                final messages = messageService.getMessages(widget.userId);
                
                // Mark as read when new messages arrive while chat is open
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  messageService.markAsRead(widget.userId);
                  _scrollToBottom();
                });

                return ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  itemCount: messages.length,
                  physics: const BouncingScrollPhysics(),
                  itemBuilder: (context, index) {
                    final msg = messages[index];
                    return ChatBubble(
                      message: msg,
                    );
                  },
                );
              },
            ),
          ),
          Consumer<SocketService>(
            builder: (context, socketService, child) {
              // This is a simplified typing indicator logic
              return StreamBuilder<Map<String, dynamic>>(
                stream: socketService.statusStream,
                builder: (context, snapshot) {
                  bool showTyping = false;
                  if (snapshot.hasData && snapshot.data!['type'] == 'typing' && snapshot.data!['from'] == widget.userId) {
                    showTyping = true;
                  }
                  if (!showTyping) return const SizedBox.shrink();
                  return Padding(
                    padding: const EdgeInsets.only(left: 16, bottom: 8),
                    child: Row(
                      children: [
                        Text(
                          '${widget.username} is typing',
                          style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, fontStyle: FontStyle.italic),
                        ),
                        const SizedBox(width: 4),
                        _TypingIndicator(),
                      ],
                    ),
                  );
                },
              );
            },
          ),
          MessageInput(
            onSend: _sendMessage,
            onAttach: _showAttachmentMenu,
            onTyping: _onTyping,
          ),
        ],
      ),
    );
  }
}

class _TypingIndicator extends StatefulWidget {
  @override
  State<_TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<_TypingIndicator> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(3, (index) {
        return AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            final delay = index * 0.2;
            final value = (1.0 + (0.5 * (1.0 + (index == 0 ? _controller.value : (index == 1 ? (_controller.value + 0.3) % 1.0 : (_controller.value + 0.6) % 1.0))))).clamp(1.0, 1.5);
            return Container(
              width: 3,
              height: 3,
              margin: const EdgeInsets.symmetric(horizontal: 1),
              decoration: const BoxDecoration(
                color: AppTheme.textSecondary,
                shape: BoxShape.circle,
              ),
            );
          },
        );
      }),
    );
  }
}
