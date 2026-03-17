import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class AvatarWidget extends StatelessWidget {
  final String? imageUrl;
  final String username;
  final double size;
  final bool isOnline;

  const AvatarWidget({
    super.key,
    this.imageUrl,
    required this.username,
    this.size = 50,
    this.isOnline = false,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: AppTheme.secondarySurfaceColor,
            shape: BoxShape.circle,
            border: Border.all(color: AppTheme.surfaceColor, width: 2),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(size / 2),
            child: imageUrl != null
                ? Image.network(
                    imageUrl!,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => _buildPlaceholder(),
                  )
                : _buildPlaceholder(),
          ),
        ),
        if (isOnline)
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              width: size * 0.25,
              height: size * 0.25,
              decoration: BoxDecoration(
                color: Colors.emerald,
                shape: BoxShape.circle,
                border: Border.all(color: AppTheme.backgroundColor, width: 2),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildPlaceholder() {
    return Center(
      child: Text(
        username.isNotEmpty ? username[0].toUpperCase() : '?',
        style: TextStyle(
          color: AppTheme.primaryColor,
          fontWeight: FontWeight.bold,
          fontSize: size * 0.4,
        ),
      ),
    );
  }
}
