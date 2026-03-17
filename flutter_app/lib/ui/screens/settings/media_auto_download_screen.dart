import 'package:flutter/material.dart';
import '../../../theme/app_theme.dart';
import '../../../services/media_settings_service.dart';

class MediaAutoDownloadScreen extends StatefulWidget {
  const MediaAutoDownloadScreen({super.key});

  @override
  State<MediaAutoDownloadScreen> createState() => _MediaAutoDownloadScreenState();
}

class _MediaAutoDownloadScreenState extends State<MediaAutoDownloadScreen> {
  final MediaSettingsService _settingsService = MediaSettingsService();
  Map<String, Map<String, bool>> _settings = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final mobile = await _settingsService.getAutoDownloadSettings('Mobile Data');
    final wifi = await _settingsService.getAutoDownloadSettings('WiFi');
    final roaming = await _settingsService.getAutoDownloadSettings('Roaming');
    
    if (mounted) {
      setState(() {
        _settings = {
          'When using Mobile Data': mobile,
          'When connected to WiFi': wifi,
          'When Roaming': roaming,
        };
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleSetting(String section, String mediaType, bool value) async {
    await _settingsService.setAutoDownloadSetting(
      section.replaceFirst('When using ', '').replaceFirst('When connected to ', '').replaceFirst('When ', ''),
      mediaType,
      value,
    );
    setState(() {
      _settings[section]![mediaType] = value;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Media Auto-Download'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor))
          : ListView(
              children: _settings.entries.map((entry) {
                return _buildSection(entry.key, entry.value);
              }).toList(),
            ),
    );
  }

  Widget _buildSection(String title, Map<String, bool> options) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
          child: Text(
            title,
            style: const TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold, fontSize: 13),
          ),
        ),
        ...options.entries.map((option) {
          return CheckboxListTile(
            value: option.value,
            onChanged: (val) => _toggleSetting(title, option.key, val!),
            activeColor: AppTheme.primaryColor,
            checkColor: Colors.white,
            title: Text(
              option.key,
              style: const TextStyle(color: Colors.white, fontSize: 16),
            ),
            controlAffinity: ListTileControlAffinity.trailing,
          );
        }).toList(),
        const Divider(color: AppTheme.surfaceColor),
      ],
    );
  }
}
