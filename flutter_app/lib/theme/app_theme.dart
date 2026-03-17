import 'package:flutter/material.dart';

class AppTheme {
  static const primaryColor = Color(0xFF22C55E); // Green
  static const backgroundColor = Color(0xFF0F172A); // Dark Blue/Slate
  static const surfaceColor = Color(0xFF1E293B); // Slate 800
  static const secondarySurfaceColor = Color(0xFF334155); // Slate 700
  static const bubbleSent = Color(0xFFDCF8C6);
  static const bubbleReceive = Color(0xFFFFFFFF);
  static const textPrimary = Colors.white;
  static const textSecondary = Color(0xFF94A3B8); // Slate 400

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: const ColorScheme.dark(
      primary: primaryColor,
      surface: backgroundColor,
      onSurface: textPrimary,
      surfaceContainerHighest: surfaceColor,
    ),
    scaffoldBackgroundColor: backgroundColor,
    appBarTheme: const AppBarTheme(
      backgroundColor: backgroundColor,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.bold,
        color: textPrimary,
        letterSpacing: -0.5,
      ),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: primaryColor,
      foregroundColor: Colors.white,
      shape: CircleBorder(),
    ),
    textTheme: const TextTheme(
      headlineLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: textPrimary),
      bodyLarge: TextStyle(fontSize: 16, color: textPrimary),
      bodyMedium: TextStyle(fontSize: 14, color: textSecondary),
    ),
  );
}
