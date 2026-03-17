import 'package:flutter/services.dart';

class ScreenshotService {
  static const _channel = MethodChannel('com.noxa.app/screenshot');
  
  static Function(String)? onScreenshotDetected;

  static void init() {
    _channel.setMethodCallHandler((call) async {
      if (call.method == 'onScreenshot') {
        onScreenshotDetected?.call(call.arguments as String);
      }
    });
  }

  // This is a mock for the demo environment
  static void mockScreenshot() {
    onScreenshotDetected?.call('me');
  }
}
