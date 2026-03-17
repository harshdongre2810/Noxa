import 'package:flutter/material.dart';
import '../../../theme/app_theme.dart';
import '../../../services/network_usage_service.dart';
import '../../../services/storage_service.dart';

class NetworkUsageScreen extends StatefulWidget {
  const NetworkUsageScreen({super.key});

  @override
  State<NetworkUsageScreen> createState() => _NetworkUsageScreenState();
}

class _NetworkUsageScreenState extends State<NetworkUsageScreen> {
  final NetworkUsageService _networkService = NetworkUsageService();
  final StorageService _storageService = StorageService();
  Map<String, dynamic> _stats = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    final stats = await _networkService.getStats();
    if (mounted) {
      setState(() {
        _stats = stats;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Network Usage'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildUsageSummary(),
                const SizedBox(height: 24),
                _buildStatItem(Icons.chat_bubble_outline, 'Messages', 
                  '${_stats['sentMessages']} sent • ${_stats['receivedMessages']} received'),
                _buildStatItem(Icons.image_outlined, 'Media', 
                  '${_stats['sentMedia']} sent • ${_stats['receivedMedia']} received'),
                _buildStatItem(Icons.call_outlined, 'Calls', '0 sent • 0 received'),
                _buildStatItem(Icons.cloud_upload_outlined, 'Status', '0 sent • 0 received'),
                
                const SizedBox(height: 40),
                Center(
                  child: TextButton(
                    onPressed: _showResetConfirmation,
                    child: const Text(
                      'RESET STATISTICS',
                      style: TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold, letterSpacing: 1),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Center(
                  child: Text(
                    'Last reset: Never',
                    style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildUsageSummary() {
    return Column(
      children: [
        Text(
          _storageService.formatBytes(_stats['totalBytes'] ?? 0.0),
          style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(
          'Total Data Transferred',
          style: TextStyle(color: AppTheme.textSecondary, fontSize: 14),
        ),
      ],
    );
  }

  Widget _buildStatItem(IconData icon, String title, String subtitle) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.textSecondary, size: 24),
      title: Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500)),
      subtitle: Text(subtitle, style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
    );
  }

  void _showResetConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.surfaceColor,
        title: const Text('Reset network statistics?', style: TextStyle(color: Colors.white)),
        content: const Text(
          'This will reset all network usage counters back to zero.',
          style: TextStyle(color: AppTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('CANCEL', style: TextStyle(color: AppTheme.primaryColor)),
          ),
          TextButton(
            onPressed: () async {
              await _networkService.resetStats();
              await _loadStats();
              if (mounted) Navigator.pop(context);
            },
            child: const Text('RESET', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
  }
}
