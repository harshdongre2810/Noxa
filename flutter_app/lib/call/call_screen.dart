// lib/screens/call_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:provider/provider.dart';
import 'call_controller.dart';
import 'models/call_state.dart';

class CallScreen extends StatefulWidget {
  const CallScreen({super.key});

  @override
  State<CallScreen> createState() => _CallScreenState();
}

class _CallScreenState extends State<CallScreen> {
  bool _showControls = true;

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<CallController>();
    final session = controller.session;

    if (session == null) return const SizedBox.shrink();

    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTap: () => setState(() => _showControls = !_showControls),
        child: Stack(
          children: [
            // Remote Video / Placeholder
            if (session.type == CallType.video)
              RTCVideoView(
                controller.remoteRenderer,
                objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
              )
            else
              const Center(
                child: Icon(Icons.person, size: 120, color: Colors.white24),
              ),

            // Local Preview (Small overlay)
            if (session.type == CallType.video)
              Positioned(
                top: 40,
                right: 20,
                child: Container(
                  width: 100,
                  height: 150,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white24, width: 1),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.5),
                        blurRadius: 10,
                      )
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: RTCVideoView(
                      controller.localRenderer,
                      mirror: true,
                      objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                    ),
                  ),
                ),
              ),

            // UI Overlays
            SafeArea(
              child: Column(
                children: [
                  const SizedBox(height: 20),
                  Text(
                    session.remoteUserName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const _EncryptionIndicator(),
                  const Spacer(),
                  if (_showControls) _buildControls(controller),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildControls(CallController controller) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 30),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: [
            Colors.black.withOpacity(0.9),
            Colors.black.withOpacity(0.4),
            Colors.transparent,
          ],
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _ControlBtn(
            icon: controller.isSpeakerOn ? Icons.volume_up : Icons.volume_down,
            onPressed: () => controller.toggleSpeakerphone(),
            active: controller.isSpeakerOn,
          ),
          if (controller.session?.type == CallType.video)
            _ControlBtn(
              icon: Icons.switch_camera,
              onPressed: () => controller.switchCamera(),
            ),
          _ControlBtn(
            icon: controller.isVideoOff ? Icons.videocam_off : Icons.videocam,
            onPressed: () => controller.toggleCamera(),
            active: controller.isVideoOff,
          ),
          _ControlBtn(
            icon: controller.isMuted ? Icons.mic_off : Icons.mic,
            onPressed: () => controller.toggleMute(),
            active: controller.isMuted,
          ),
          FloatingActionButton(
            heroTag: 'hangup',
            onPressed: () => controller.hangUp(),
            backgroundColor: Colors.red,
            child: const Icon(Icons.call_end, color: Colors.white),
          ),
        ],
      ),
    );
  }
}

class _ControlBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onPressed;
  final bool active;

  const _ControlBtn({
    required this.icon,
    required this.onPressed,
    this.active = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: active ? Colors.white : Colors.white10,
        shape: BoxShape.circle,
      ),
      child: IconButton(
        icon: Icon(icon),
        color: active ? Colors.black : Colors.white,
        iconSize: 28,
        onPressed: onPressed,
      ),
    );
  }
}

class _EncryptionIndicator extends StatelessWidget {
  const _EncryptionIndicator();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Icon(Icons.lock, color: Colors.white54, size: 12),
        const SizedBox(width: 4),
        Text(
          'Encrypted (WebRTC DTLS-SRTP)',
          style: TextStyle(
            color: Colors.white.withOpacity(0.5),
            fontSize: 10,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
