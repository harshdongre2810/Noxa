import 'package:flutter/material.dart';
import '../../../theme/app_theme.dart';
import 'manage_storage_screen.dart';
import 'network_usage_screen.dart';
import 'media_upload_quality_screen.dart';
import 'media_auto_download_screen.dart';

class StorageAndDataScreen extends StatelessWidget {
  const StorageAndDataScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Storage and Data'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        children: [
          _buildSectionHeader('Storage'),
          _buildMenuTile(
            context,
            icon: Icons.storage_outlined,
            title: 'Manage Storage',
            subtitle: '3.8 GB used',
            destination: const ManageStorageScreen(),
          ),
          
          const Divider(color: AppTheme.surfaceColor, indent: 70),
          
          _buildMenuTile(
            context,
            icon: Icons.data_usage_outlined,
            title: 'Network Usage',
            subtitle: '2.1 GB sent • 5.4 GB received',
            destination: const NetworkUsageScreen(),
          ),

          const SizedBox(height: 16),
          _buildSectionHeader('Media Auto-Download'),
          _buildMenuTile(
            context,
            icon: Icons.download_for_offline_outlined,
            title: 'Media Auto-Download',
            subtitle: 'Voice messages are always auto-downloaded',
            destination: const MediaAutoDownloadScreen(),
          ),

          const SizedBox(height: 16),
          _buildSectionHeader('Media Upload Quality'),
          _buildMenuTile(
            context,
            icon: Icons.high_quality_outlined,
            title: 'Media Upload Quality',
            subtitle: 'Auto (recommended)',
            destination: const MediaUploadQualityScreen(),
          ),

          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                const Icon(Icons.info_outline, color: AppTheme.textSecondary, size: 18),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Media upload quality only applies to photos and videos sent in chats.',
                    style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: const TextStyle(
          color: AppTheme.primaryColor,
          fontSize: 12,
          fontWeight: FontWeight.bold,
          letterSpacing: 1,
        ),
      ),
    );
  }

  Widget _buildMenuTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required Widget destination,
  }) {
    return ListTile(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => destination),
        );
      },
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: AppTheme.surfaceColor,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: Colors.white, size: 24),
      ),
      title: Text(
        title,
        style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500),
      ),
      subtitle: Text(
        subtitle,
        style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
      ),
      trailing: Icon(Icons.chevron_right, color: AppTheme.textSecondary, size: 20),
    );
  }
}
