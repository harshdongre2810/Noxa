import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../widgets/avatar_widget.dart';
import 'settings/storage_and_data_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        children: [
          const SizedBox(height: 20),
          // Profile Section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                const AvatarWidget(
                  size: 70,
                  imageUrl: null,
                  isOnline: true,
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Harsh Dongre',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        '@harsh_noxa',
                        style: TextStyle(
                          color: AppTheme.textSecondary,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Available',
                        style: TextStyle(
                          color: AppTheme.primaryColor,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.qr_code, color: AppTheme.primaryColor),
                  onPressed: () {},
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          
          _buildSectionHeader('Account'),
          _buildSettingTile(
            icon: Icons.key_outlined,
            title: 'Account',
            subtitle: 'Security notifications, change number',
          ),
          _buildSettingTile(
            icon: Icons.lock_outline,
            title: 'Privacy',
            subtitle: 'Block contacts, disappearing messages',
          ),
          _buildSettingTile(
            icon: Icons.verified_user_outlined,
            title: 'End-to-End Encryption',
            subtitle: 'Your messages are secured',
            trailing: const Icon(Icons.check_circle, color: AppTheme.primaryColor, size: 20),
          ),
          
          const SizedBox(height: 16),
          _buildSectionHeader('Preferences'),
          _buildSettingTile(
            icon: Icons.notifications_none,
            title: 'Notifications',
            subtitle: 'Message, group & call tones',
          ),
          _buildSettingTile(
            icon: Icons.data_usage_outlined,
            title: 'Storage and Data',
            subtitle: 'Network usage, auto-download',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const StorageAndDataScreen()),
              );
            },
          ),
          _buildSettingTile(
            icon: Icons.language_outlined,
            title: 'App Language',
            subtitle: 'English (device\'s language)',
          ),
          
          const SizedBox(height: 16),
          _buildSectionHeader('Support'),
          _buildSettingTile(
            icon: Icons.help_outline,
            title: 'Help',
            subtitle: 'Help center, contact us, privacy policy',
          ),
          _buildSettingTile(
            icon: Icons.people_outline,
            title: 'Invite a friend',
            onTap: () {},
          ),
          
          const SizedBox(height: 32),
          Center(
            child: TextButton(
              onPressed: () {},
              child: const Text(
                'Logout',
                style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Center(
            child: Text(
              'NOXA v1.0.0',
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
            ),
          ),
          const SizedBox(height: 40),
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

  Widget _buildSettingTile({
    required IconData icon,
    required String title,
    String? subtitle,
    Widget? trailing,
    VoidCallback? onTap,
  }) {
    return ListTile(
      onTap: onTap ?? () {},
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppTheme.surfaceColor,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: Colors.white, size: 22),
      ),
      title: Text(
        title,
        style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500),
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
            )
          : null,
      trailing: trailing ?? Icon(Icons.chevron_right, color: AppTheme.textSecondary, size: 20),
    );
  }
}
