import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:provider/provider.dart';
import 'theme/app_theme.dart';
import 'ui/screens/splash_screen.dart';
import 'ui/screens/onboarding_screen.dart';
import 'ui/screens/login_screen.dart';
import 'ui/screens/register_screen.dart';
import 'ui/screens/home_screen.dart';
import 'services/socket_service.dart';
import 'services/message_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final showOnboarding = prefs.getBool('showOnboarding') ?? true;
  final isLoggedIn = prefs.getString('token') != null;
  final userId = prefs.getString('userId');

  final socketService = SocketService();
  if (isLoggedIn && userId != null) {
    socketService.init(userId);
  }
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: socketService),
        ChangeNotifierProxyProvider<SocketService, MessageService>(
          create: (context) => MessageService(context.read<SocketService>()),
          update: (context, socket, previous) => previous ?? MessageService(socket),
        ),
      ],
      child: NoxaApp(showOnboarding: showOnboarding, isLoggedIn: isLoggedIn),
    ),
  );
}

class NoxaApp extends StatelessWidget {
  final bool showOnboarding;
  final bool isLoggedIn;
  
  const NoxaApp({super.key, required this.showOnboarding, required this.isLoggedIn});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NOXA',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const SplashScreen(),
      routes: {
        '/onboarding': (context) => const OnboardingScreen(),
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/home': (context) => const HomeScreen(),
      },
    );
  }
}
