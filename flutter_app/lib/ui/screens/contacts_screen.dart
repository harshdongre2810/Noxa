import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../widgets/avatar_widget.dart';

class ContactsScreen extends StatelessWidget {
  const ContactsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search contacts...',
                prefixIcon: const Icon(Icons.search, color: AppTheme.textSecondary),
                filled: true,
                fillColor: AppTheme.surfaceColor,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          ListTile(
            leading: const CircleAvatar(
              backgroundColor: AppTheme.primaryColor,
              child: Icon(Icons.person_add, color: Colors.white),
            ),
            title: const Text('New Contact', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            onTap: () {},
          ),
          ListTile(
            leading: const CircleAvatar(
              backgroundColor: AppTheme.secondarySurfaceColor,
              child: Icon(Icons.group_add, color: Colors.white),
            ),
            title: const Text('New Group', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            onTap: () {},
          ),
          const Divider(color: AppTheme.surfaceColor),
          Expanded(
            child: ListView.builder(
              itemCount: 15,
              physics: const BouncingScrollPhysics(),
              itemBuilder: (context, index) {
                final username = 'Friend ${index + 1}';
                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                  leading: AvatarWidget(username: username, size: 48, isOnline: index % 3 == 0),
                  title: Text(
                    username,
                    style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  subtitle: Text(
                    '@user_${index + 100}',
                    style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.chat_bubble_outline, color: AppTheme.primaryColor),
                    onPressed: () {},
                  ),
                  onTap: () {},
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
