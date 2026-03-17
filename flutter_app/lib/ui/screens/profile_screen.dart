import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../widgets/avatar_widget.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          children: [
            const SizedBox(height: 32),
            const Center(
              child: AvatarWidget(
                username: 'Harsh Dongre',
                size: 120,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Harsh Dongre',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            const Text(
              'No Number. No Trace. Just Chat.',
              style: TextStyle(color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 32),
            _buildSection(
              'Account',
              [
                _buildTile(Icons.person_outline, 'Username', '@harsh_dongre'),
                _buildTile(Icons.info_outline, 'Status', 'Available'),
              ],
            ),
            _buildSection(
              'Settings',
              [
                _buildTile(Icons.lock_outline, 'Privacy Settings', null, showArrow: true),
                _buildTile(Icons.palette_outlined, 'Theme', 'Dark Mode', showArrow: true),
                _buildTile(Icons.notifications_none, 'Notifications', null, showArrow: true),
              ],
            ),
            _buildSection(
              'Danger Zone',
              [
                _buildTile(Icons.logout, 'Logout', null, textColor: Colors.rose, iconColor: Colors.rose),
              ],
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 24, top: 24, bottom: 8),
          child: Text(
            title.toUpperCase(),
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppTheme.textSecondary,
              letterSpacing: 1.2,
            ),
          ),
        ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: AppTheme.surfaceColor,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildTile(IconData icon, String title, String? subtitle, {Color? textColor, Color? iconColor, bool showArrow = false}) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      leading: Icon(icon, color: iconColor ?? AppTheme.primaryColor),
      title: Text(
        title,
        style: TextStyle(
          color: textColor ?? AppTheme.textPrimary,
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: subtitle != null ? Text(subtitle, style: const TextStyle(color: AppTheme.textSecondary)) : null,
      trailing: showArrow ? const Icon(Icons.chevron_right, color: AppTheme.textSecondary) : null,
      onTap: () {},
    );
  }
}
