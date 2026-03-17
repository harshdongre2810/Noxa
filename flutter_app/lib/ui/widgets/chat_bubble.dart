import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

import '../../services/message_service.dart';

class ChatBubble extends StatelessWidget {
  final Message message;

  const ChatBubble({
    super.key,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    final isMe = message.isMe;
    final status = message.status;
    final text = message.text;
    final time = message.timestamp.toString(); // Simplified for now
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOutCubic,
      builder: (context, value, child) {
        return Transform.translate(
          offset: Offset(isMe ? (1 - value) * 20 : (value - 1) * 20, 0),
          child: Opacity(
            opacity: value,
            child: child,
          ),
        );
      },
      child: Align(
        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          margin: EdgeInsets.only(
            top: 4,
            bottom: 4,
            left: isMe ? 64 : 16,
            right: isMe ? 16 : 64,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: isMe ? AppTheme.bubbleSent : AppTheme.bubbleReceive,
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(20),
              topRight: const Radius.circular(20),
              bottomLeft: Radius.circular(isMe ? 20 : 4),
              bottomRight: Radius.circular(isMe ? 4 : 20),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                message.isViewOnce && !message.isMe ? "Tap to view once" : message.text,
                style: TextStyle(
                  color: Colors.black87,
                  fontSize: 15,
                  height: 1.4,
                  fontStyle: message.isViewOnce && !message.isMe ? FontStyle.italic : FontStyle.normal,
                ),
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (message.isViewOnce)
                    const Padding(
                      padding: EdgeInsets.only(right: 4),
                      child: Icon(Icons.visibility_off, size: 12, color: Colors.black45),
                    ),
                  if (message.isSecretChat)
                    const Padding(
                      padding: EdgeInsets.only(right: 4),
                      child: Icon(Icons.lock, size: 12, color: Colors.black45),
                    ),
                  if (message.selfDestructTimer != null)
                    Padding(
                      padding: const EdgeInsets.only(right: 4),
                      child: Row(
                        children: [
                          const Icon(Icons.timer, size: 12, color: Colors.black45),
                          const SizedBox(width: 2),
                          Text('${message.selfDestructTimer}s', style: const TextStyle(fontSize: 10, color: Colors.black45)),
                        ],
                      ),
                    ),
                  Text(
                    time,
                    style: const TextStyle(
                      color: Colors.black54,
                      fontSize: 10,
                    ),
                  ),
                  if (isMe) ...[
                    const SizedBox(width: 4),
                    _buildStatusIcon(),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusIcon() {
    switch (status) {
      case MessageStatus.pending:
        return const Icon(Icons.access_time, size: 12, color: Colors.black45);
      case MessageStatus.sent:
        return const Icon(Icons.done, size: 14, color: Colors.black45);
      case MessageStatus.delivered:
        return const Icon(Icons.done_all, size: 14, color: Colors.black45);
      case MessageStatus.read:
        return const Icon(Icons.done_all, size: 14, color: Colors.blue);
    }
  }
}
