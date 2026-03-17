import 'package:flutter/material.dart';
import '../../../theme/app_theme.dart';
import '../../../services/media_settings_service.dart';

class MediaUploadQualityScreen extends StatefulWidget {
  const MediaUploadQualityScreen({super.key});

  @override
  State<MediaUploadQualityScreen> createState() => _MediaUploadQualityScreenState();
}

class _MediaUploadQualityScreenState extends State<MediaUploadQualityScreen> {
  final MediaSettingsService _settingsService = MediaSettingsService();
  UploadQuality _selectedQuality = UploadQuality.auto;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final quality = await _settingsService.getUploadQuality();
    if (mounted) {
      setState(() {
        _selectedQuality = quality;
        _isLoading = false;
      });
    }
  }

  Future<void> _updateQuality(UploadQuality quality) async {
    await _settingsService.setUploadQuality(quality);
    setState(() => _selectedQuality = quality);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Media Upload Quality'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text(
                  'Choose the quality of media files to be sent',
                  style: TextStyle(color: AppTheme.textSecondary, fontSize: 14),
                ),
                const SizedBox(height: 24),
                _buildQualityOption(
                  UploadQuality.auto,
                  'Auto (recommended)',
                  'Balanced compression depending on network.',
                ),
                _buildQualityOption(
                  UploadQuality.best,
                  'Best Quality',
                  'Upload media without compression.',
                ),
                _buildQualityOption(
                  UploadQuality.saver,
                  'Data Saver',
                  'Compress images and videos before upload.',
                ),
              ],
            ),
    );
  }

  Widget _buildQualityOption(UploadQuality quality, String title, String description) {
    final isSelected = _selectedQuality == quality;
    return Container(
      margin: const EdgeInsets.bottom(16),
      decoration: BoxDecoration(
        color: isSelected ? AppTheme.primaryColor.withOpacity(0.1) : AppTheme.surfaceColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isSelected ? AppTheme.primaryColor : Colors.transparent,
          width: 1,
        ),
      ),
      child: RadioListTile<UploadQuality>(
        value: quality,
        groupValue: _selectedQuality,
        onChanged: (val) => _updateQuality(val!),
        activeColor: AppTheme.primaryColor,
        title: Text(
          title,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          description,
          style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
        ),
      ),
    );
  }
}
