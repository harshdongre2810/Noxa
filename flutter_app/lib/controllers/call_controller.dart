// lib/controllers/call_controller.dart

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../models/call_state.dart';
import '../services/signaling_service.dart';
import '../services/webrtc_service.dart';

/// State management for the call lifecycle.
/// Uses ChangeNotifier to update UI.
class CallController extends ChangeNotifier {
  final SignalingService _signaling;
  final WebRTCService _rtc = WebRTCService();
  
  CallSession? _session;
  CallSession? get session => _session;

  // Renderers for video display
  final RTCVideoRenderer localRenderer = RTCVideoRenderer();
  final RTCVideoRenderer remoteRenderer = RTCVideoRenderer();

  bool isMuted = false;
  bool isVideoEnabled = true;
  bool isSpeakerOn = false;

  CallController(this._signaling) {
    _initRenderers();
    _listenToSignaling();
  }

  Future<void> _initRenderers() async {
    await localRenderer.initialize();
    await remoteRenderer.initialize();
  }

  /// Main signaling listener
  void _listenToSignaling() {
    _signaling.messageStream.listen((message) async {
      final type = message['type'];
      final from = message['from'];
      final data = message['data'];

      switch (type) {
        case 'offer':
          _handleIncomingCall(from, data);
          break;
        case 'answer':
          await _rtc.setRemoteDescription(
            RTCSessionDescription(data['sdp'], data['type']),
          );
          _session = _session?.copyWith(status: CallStatus.connected);
          notifyListeners();
          break;
        case 'ice-candidate':
          await _rtc.addIceCandidate(
            RTCIceCandidate(data['candidate'], data['sdpMid'], data['sdpMLineIndex']),
          );
          break;
        case 'hangup':
          _cleanUp();
          break;
      }
    });
  }

  void _handleIncomingCall(String from, Map<String, dynamic> data) {
    // Only handle if not already in a call
    if (_session != null) return;

    _session = CallSession(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      remoteUserId: from,
      remoteUserName: data['name'] ?? 'Unknown',
      type: data['callType'] == 'video' ? CallType.video : CallType.audio,
      status: CallStatus.ringing,
    );
    notifyListeners();
  }

  /// Initiate a call to a specific user
  Future<void> startCall(String targetUserId, String targetUserName, CallType type) async {
    _session = CallSession(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      remoteUserId: targetUserId,
      remoteUserName: targetUserName,
      type: type,
      status: CallStatus.connecting,
    );
    notifyListeners();

    await _rtc.initialize(video: type == CallType.video);
    
    _rtc.onLocalStream = (stream) => localRenderer.srcObject = stream;
    _rtc.onRemoteStream = (stream) => remoteRenderer.srcObject = stream;
    
    _rtc.onIceCandidate = (candidate) {
      _signaling.send(targetUserId, {
        'type': 'ice-candidate',
        'data': {
          'candidate': candidate.candidate,
          'sdpMid': candidate.sdpMid,
          'sdpMLineIndex': candidate.sdpMLineIndex,
        }
      });
    };
    
    _rtc.onOfferCreated = (description) {
      _signaling.send(targetUserId, {
        'type': 'offer',
        'data': {
          'sdp': description.sdp,
          'type': description.type,
          'name': 'Current User', // TODO: Pass actual user name
          'callType': type == CallType.video ? 'video' : 'audio',
        }
      });
    };

    await _rtc.createOffer();
  }

  /// Accept an incoming call
  Future<void> acceptCall(Map<String, dynamic> offerData) async {
    if (_session == null) return;
    
    _session = _session!.copyWith(status: CallStatus.connecting);
    notifyListeners();

    await _rtc.initialize(video: _session!.type == CallType.video);
    
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

    _rtc.onAnswerCreated = (description) {
      _signaling.send(_session!.remoteUserId, {
        'type': 'answer',
        'data': {
          'sdp': description.sdp,
          'type': description.type,
        }
      });
    };

    await _rtc.createAnswer(RTCSessionDescription(offerData['sdp'], offerData['type']));
    _session = _session!.copyWith(status: CallStatus.connected);
    notifyListeners();
  }

  /// End the call and notify remote peer
  void hangUp() {
    if (_session != null) {
      _signaling.send(_session!.remoteUserId, {'type': 'hangup'});
    }
    _cleanUp();
  }

  void _cleanUp() {
    _rtc.dispose();
    localRenderer.srcObject = null;
    remoteRenderer.srcObject = null;
    _session = null;
    notifyListeners();
  }

  void toggleMute() {
    isMuted = !isMuted;
    _rtc.toggleMute(isMuted);
    notifyListeners();
  }

  void toggleCamera() {
    isVideoEnabled = !isVideoEnabled;
    _rtc.toggleVideo(isVideoEnabled);
    notifyListeners();
  }

  Future<void> switchCamera() async {
    await _rtc.switchCamera();
  }

  @override
  void dispose() {
    _cleanUp();
    localRenderer.dispose();
    remoteRenderer.dispose();
    super.dispose();
  }
}
