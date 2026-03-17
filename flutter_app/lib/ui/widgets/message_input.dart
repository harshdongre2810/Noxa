import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class MessageInput extends StatefulWidget {
  final Function(String, {bool isViewOnce, bool isSecretChat, int? selfDestructTimer}) onSend;
  final VoidCallback onAttach;
  final VoidCallback? onTyping;

  const MessageInput({
    super.key,
    required this.onSend,
    required this.onAttach,
    this.onTyping,
  });

  @override
  State<MessageInput> createState() => _MessageInputState();
}

class _MessageInputState extends State<MessageInput> with SingleTickerProviderStateMixin {
  final TextEditingController _controller = TextEditingController();
  bool _hasText = false;
  late AnimationController _sendBtnController;
  
  bool _isViewOnce = false;
  bool _isSecretChat = false;
  int? _selfDestructTimer;

  @override
  void initState() {
    super.initState();
    _sendBtnController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _controller.addListener(() {
      if (_controller.text.trim().isNotEmpty) {
        widget.onTyping?.call();
      }
      setState(() {
        _hasText = _controller.text.trim().isNotEmpty;
      });
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _sendBtnController.dispose();
    super.dispose();
  }

  void _handleSend() {
    if (_controller.text.trim().isNotEmpty) {
      _sendBtnController.forward().then((_) => _sendBtnController.reverse());
      widget.onSend(
        _controller.text.trim(),
        isViewOnce: _isViewOnce,
        isSecretChat: _isSecretChat,
        selfDestructTimer: _selfDestructTimer,
      );
      _controller.clear();
      setState(() {
        _isViewOnce = false;
        _isSecretChat = false;
        _selfDestructTimer = null;
      });
    }
  }

  void _showPrivacyMenu() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.surfaceColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Privacy Options',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 24),
                  SwitchListTile(
                    title: const Text('View Once', style: TextStyle(color: Colors.white)),
                    subtitle: const Text('Message deletes after recipient opens it', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                    value: _isViewOnce,
                    activeColor: AppTheme.primaryColor,
                    onChanged: (val) {
                      setModalState(() => _isViewOnce = val);
                      setState(() => _isViewOnce = val);
                    },
                  ),
                  SwitchListTile(
                    title: const Text('Secret Chat Mode', style: TextStyle(color: Colors.white)),
                    subtitle: const Text('E2EE, no server storage, no forwarding', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                    value: _isSecretChat,
                    activeColor: AppTheme.primaryColor,
                    onChanged: (val) {
                      setModalState(() => _isSecretChat = val);
                      setState(() => _isSecretChat = val);
                    },
                  ),
                  const Divider(color: AppTheme.secondarySurfaceColor),
                  const ListTile(
                    title: Text('Self Destruct Timer', style: TextStyle(color: Colors.white)),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildTimerChip(null, 'Off', setModalState),
                      _buildTimerChip(5, '5s', setModalState),
                      _buildTimerChip(10, '10s', setModalState),
                      _buildTimerChip(60, '1m', setModalState),
                    ],
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildTimerChip(int? seconds, String label, StateSetter setModalState) {
    final isSelected = _selfDestructTimer == seconds;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) {
          setModalState(() => _selfDestructTimer = seconds);
          setState(() => _selfDestructTimer = seconds);
        }
      },
      selectedColor: AppTheme.primaryColor,
      backgroundColor: AppTheme.secondarySurfaceColor,
      labelStyle: TextStyle(color: isSelected ? Colors.white : AppTheme.textSecondary),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (_isViewOnce || _isSecretChat || _selfDestructTimer != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            color: AppTheme.primaryColor.withOpacity(0.1),
            child: Row(
              children: [
                const Icon(Icons.security, size: 14, color: AppTheme.primaryColor),
                const SizedBox(width: 8),
                Text(
                  'Privacy active: ${_isViewOnce ? "View Once " : ""}${_isSecretChat ? "Secret " : ""}${_selfDestructTimer != null ? "Timer ${_selfDestructTimer}s" : ""}',
                  style: const TextStyle(fontSize: 10, color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          decoration: BoxDecoration(
            color: AppTheme.backgroundColor,
            border: Border(top: BorderSide(color: AppTheme.surfaceColor, width: 0.5)),
          ),
          child: SafeArea(
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.add, color: AppTheme.primaryColor),
                  onPressed: widget.onAttach,
                ),
                IconButton(
                  icon: const Icon(Icons.shield_outlined, color: AppTheme.primaryColor),
                  onPressed: _showPrivacyMenu,
                ),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceColor,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: TextField(
                      controller: _controller,
                      maxLines: 4,
                      minLines: 1,
                      decoration: const InputDecoration(
                        hintText: 'Type a message...',
                        hintStyle: TextStyle(color: AppTheme.textSecondary),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(vertical: 10),
                      ),
                      style: const TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ScaleTransition(
                  scale: Tween<double>(begin: 1.0, end: 0.9).animate(_sendBtnController),
                  child: GestureDetector(
                    onTap: _handleSend,
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: const BoxDecoration(
                        color: AppTheme.primaryColor,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.send, color: Colors.white, size: 20),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
