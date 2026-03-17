// lib/screens/incoming_call_screen.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'call_controller.dart';
import 'models/call_state.dart';

class IncomingCallScreen extends StatelessWidget {
  const IncomingCallScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<CallController>();
    final session = controller.session;

    if (session == null || session.status != CallStatus.ringing) {
      return const SizedBox.shrink();
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0B141B), // WhatsApp Dark Background
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 60),
            const Text(
              'WhatsApp Call',
              style: TextStyle(
                color: Colors.white70,
                fontSize: 14,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              session.remoteUserName,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.w400,
              ),
            ),
            const Spacer(),
            CircleAvatar(
              radius: 60,
              backgroundColor: Colors.grey[800],
              child: const Icon(Icons.person, size: 80, color: Colors.white24),
            ),
            const Spacer(),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 60),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _CallActionBtn(
                    icon: Icons.close,
                    color: Colors.red,
                    onPressed: () => controller.hangUp(),
                    label: 'Decline',
                  ),
                  _CallActionBtn(
                    icon: session.type == CallType.video ? Icons.videocam : Icons.call,
                    color: Colors.green,
                    onPressed: () => controller.acceptCall(),
                    label: 'Accept',
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CallActionBtn extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onPressed;
  final String label;

  const _CallActionBtn({
    required this.icon,
    required this.color,
    required this.onPressed,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        FloatingActionButton(
          heroTag: label,
          onPressed: onPressed,
          backgroundColor: color,
          child: Icon(icon, color: Colors.white),
        ),
        const SizedBox(height: 12),
        Text(
          label,
          style: const TextStyle(color: Colors.white70, fontSize: 12),
        ),
      ],
    );
  }
}
