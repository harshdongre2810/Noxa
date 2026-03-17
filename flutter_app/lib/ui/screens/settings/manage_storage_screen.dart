import 'package:flutter/material.dart';
import '../../../theme/app_theme.dart';
import '../../../services/storage_service.dart';

class ManageStorageScreen extends StatefulWidget {
  const ManageStorageScreen({super.key});

  @override
  State<ManageStorageScreen> createState() => _ManageStorageScreenState();
}

class _ManageStorageScreenState extends State<ManageStorageScreen> {
  final StorageService _storageService = StorageService();
  Map<String, double> _usage = {};
  List<ChatStorageInfo> _chats = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final usage = await _storageService.getStorageUsage();
    final chats = await _storageService.getChatStorageBreakdown();
    if (mounted) {
      setState(() {
        _usage = usage;
        _chats = chats;
        _isLoading = false;
      });
    }
  }

  double get _totalUsed => _usage.values.fold(0, (sum, val) => sum + val);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Manage Storage'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildStorageOverview(),
                const SizedBox(height: 24),
                _buildMediaBreakdown(),
                const SizedBox(height: 32),
                const Text(
                  'Chats',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                ..._chats.map((chat) => _buildChatTile(chat)).toList(),
              ],
            ),
    );
  }

  Widget _buildStorageOverview() {
    return Card(
      color: AppTheme.surfaceColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _storageService.formatBytes(_totalUsed),
                      style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      'Used of 128 GB',
                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 14),
                    ),
                  ],
                ),
                const Icon(Icons.pie_chart_outline, color: AppTheme.primaryColor, size: 40),
              ],
            ),
            const SizedBox(height: 20),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: _totalUsed / (128 * 1024 * 1024 * 1024),
                backgroundColor: AppTheme.secondarySurfaceColor,
                valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
                minHeight: 8,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMediaBreakdown() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: _usage.entries.map((entry) {
        return Column(
          children: [
            Text(
              entry.key,
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
            ),
            const SizedBox(height: 4),
            Text(
              _storageService.formatBytes(entry.value),
              style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
            ),
          ],
        );
      }).toList(),
    );
  }

  Widget _buildChatTile(ChatStorageInfo chat) {
    return Container(
      margin: const EdgeInsets.bottom(12),
      decoration: BoxDecoration(
        color: AppTheme.surfaceColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        title: Text(
          chat.username,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${chat.mediaCount} items • ${_storageService.formatBytes(chat.size)}',
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
            ),
            const SizedBox(height: 8),
            _buildMediaPreview(),
          ],
        ),
        trailing: IconButton(
          icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
          onPressed: () => _showDeleteConfirmation(chat),
        ),
      ),
    );
  }

  Widget _buildMediaPreview() {
    return Row(
      children: List.generate(4, (index) {
        return Container(
          width: 40,
          height: 40,
          margin: const EdgeInsets.only(right: 8),
          decoration: BoxDecoration(
            color: AppTheme.secondarySurfaceColor,
            borderRadius: BorderRadius.circular(4),
            image: DecorationImage(
              image: NetworkImage('https://picsum.photos/seed/${index + 10}/100/100'),
              fit: cover,
            ),
          ),
        );
      }),
    );
  }

  void _showDeleteConfirmation(ChatStorageInfo chat) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        title: const Text('Clear chat media?', style: TextStyle(color: Colors.white)),
        content: Text(
          'This will delete all photos, videos, and documents from your chat with ${chat.username}.',
          style: const TextStyle(color: AppTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('CANCEL', style: TextStyle(color: AppTheme.primaryColor)),
          ),
          TextButton(
            onPressed: () {
              setState(() {
                _chats.removeWhere((c) => c.username == chat.username);
              });
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Cleared media for ${chat.username}'),
                  backgroundColor: AppTheme.primaryColor,
                ),
              );
            },
            child: const Text('DELETE', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
  }
}

// Fix for missing BoxFit.cover
const cover = BoxFit.cover;
