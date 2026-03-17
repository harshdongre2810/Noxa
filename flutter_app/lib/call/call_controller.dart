// lib/call/call_controller.dart

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../webrtc/webrtc_service.dart';
import '../signaling/signaling_service.dart';
import 'models/call_state.dart';

/// Controller for managing the call lifecycle and state.
class CallController extends ChangeNotifier {
  final SignalingService _signaling;
  final WebRTCService _rtc = WebRTCService();
  
  CallSession? _session;
  CallSession? get session => _session;

  // Renderers for video display
  final RTCVideoRenderer localRenderer = RTCVideoRenderer();
  final RTCVideoRenderer remoteRenderer = RTCVideoRenderer();

  bool isMuted = false;
  bool isVideoOff = false;
  bool isSpeakerOn = false;
  Timer? _timer;
  int durationSeconds = 0;

  // Store the incoming offer data to use when accepting
  Map<String, dynamic>? _incomingOfferData;

  CallController(this._signaling) {
    _initRenderers();
    _listenSignaling();
  }

  Future<void> _initRenderers() async {
    await localRenderer.initialize();
    await remoteRenderer.initialize();
  }

  /// Listens for incoming signaling messages.
  void _listenSignaling() {
    _signaling.messageStream.listen((msg) async {
      final type = msg['type'];
      final from = msg['from'];
      final data = msg['data'];

      switch (type) {
        case 'offer':
          _onIncomingCall(from, data);
          break;
        case 'answer':
          await _rtc.setRemoteDescription(RTCSessionDescription(data['sdp'], data['type']));
          _startTimer();
          _session = _session?.copyWith(status: CallStatus.connected);
          notifyListeners();
          break;
        case 'ice-candidate':
          await _rtc.addIceCandidate(RTCIceCandidate(data['candidate'], data['sdpMid'], data['sdpMLineIndex']));
          break;
        case 'hangup':
          _cleanup();
          break;
      }
    });
  }

  void _onIncomingCall(String from, Map<String, dynamic> data) {
    // If already in a call, ignore or send busy signal
    if (_session != null) return;

    _incomingOfferData = data;
    _session = CallSession(
      id: 'call_${DateTime.now().millisecondsSinceEpoch}',
      remoteUserId: from,
      remoteUserName: data['name'] ?? 'Unknown',
      type: data['callType'] == 'video' ? CallType.video : CallType.audio,
      status: CallStatus.ringing,
    );
    notifyListeners();
  }

  /// Initiates a one-to-one video or audio call.
  /// This implements the requested logic to start a call.
  Future<void> startCall(String targetId, String targetName, CallType type) async {
    _session = CallSession(
      id: 'call_${DateTime.now().millisecondsSinceEpoch}',
      remoteUserId: targetId,
      remoteUserName: targetName,
      type: type,
      status: CallStatus.connecting,
    );
    notifyListeners();

    // 1. Initialize WebRTC with appropriate media constraints
    await _initWebRTC(type == CallType.video);
    
    // 2. Define what to do when the SDP offer is generated
    _rtc.onSdpReady = (sdp) {
      _signaling.send(targetId, {
        'type': 'offer',
        'data': {
          'sdp': sdp.sdp,
          'type': sdp.type,
          'name': 'Me', // TODO: Use actual user display name
          'callType': type.name,
        }
      });
    };

    // 3. Create the SDP Offer
    await _rtc.createOffer();
  }

  /// Accepts the current incoming call.
  Future<void> acceptCall() async {
    if (_session == null || _incomingOfferData == null) return;
    
    final offerData = _incomingOfferData!;
    _session = _session!.copyWith(status: CallStatus.connecting);
    notifyListeners();

    await _initWebRTC(_session!.type == CallType.video);
    
    _rtc.onSdpReady = (sdp) {
      _signaling.send(_session!.remoteUserId, {
        'type': 'answer',
        'data': {
          'sdp': sdp.sdp,
          'type': sdp.type,
        }
      });
    };

    await _rtc.createAnswer(RTCSessionDescription(offerData['sdp'], offerData['type']));
    _session = _session!.copyWith(status: CallStatus.connected);
    _startTimer();
    notifyListeners();
  }

  /// Helper to initialize WebRTC and set up listeners.
  Future<void> _initWebRTC(bool video) async {
    await _rtc.initialize(video: video);
    
    _rtc.onLocalStream = (stream) => localRenderer.srcObject = stream;
    _rtc.onRemoteStream = (stream) => remoteRenderer.srcObject = stream;
    
    _rtc.onIceCandidate = (candidate) {
      _signaling.send(_session!.remoteUserId, {
        'type': 'ice-candidate',
        'data': {
          'candidate': candidate.candidate,
          'sdpMid': candidate.sdpMid,
          'sdpMLineIndex': candidate.sdpMLineIndex,
        }
      });
    };

    _rtc.onFingerprintReady = (fingerprint) {
      _session = _session?.copyWith(fingerprint: fingerprint);
      notifyListeners();
    };
  }

  /// Ends the call and notifies the remote peer.
  void hangUp() {
    if (_session != null) {
      _signaling.send(_session!.remoteUserId, {'type': 'hangup'});
    }
    _cleanup();
  }

  /// Resets the call state and disposes of resources.
  void _cleanup() {
    _timer?.cancel();
    _rtc.dispose();
    localRenderer.srcObject = null;
    remoteRenderer.srcObject = null;
    _session = null;
    durationSeconds = 0;
    notifyListeners();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      durationSeconds++;
      notifyListeners();
    });
  }

  void toggleMute() {
    isMuted = !isMuted;
    _rtc.toggleMute(isMuted);
    notifyListeners();
  }

  void toggleCamera() {
    isVideoOff = !isVideoOff;
    _rtc.toggleVideo(!isVideoOff);
    notifyListeners();
  }

  void toggleSpeakerphone() {
    isSpeakerOn = !isSpeakerOn;
    _rtc.setSpeakerphoneOn(isSpeakerOn);
    notifyListeners();
  }

  Future<void> switchCamera() async {
    await _rtc.switchCamera();
  }

  @override
  void dispose() {
    _cleanup();
    localRenderer.dispose();
    remoteRenderer.dispose();
    super.dispose();
  }
}
