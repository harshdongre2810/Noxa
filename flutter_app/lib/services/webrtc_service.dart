// lib/services/webrtc_service.dart

import 'package:flutter_webrtc/flutter_webrtc.dart';

/// Core WebRTC logic handling PeerConnection and MediaStreams.
class WebRTCService {
  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  MediaStream? _remoteStream;

  // Callbacks for UI/Controller
  Function(MediaStream stream)? onLocalStream;
  Function(MediaStream stream)? onRemoteStream;
  Function(RTCIceCandidate candidate)? onIceCandidate;
  Function(RTCSessionDescription description)? onOfferCreated;
  Function(RTCSessionDescription description)? onAnswerCreated;

  // WebRTC Configuration
  final Map<String, dynamic> _configuration = {
    'iceServers': [
      {'urls': 'stun:stun.l.google.com:19302'},
      // TODO: Add production TURN servers here for real-world reliability (bypassing symmetric NATs)
      // {'urls': 'turn:your.turn.server', 'username': '...', 'credential': '...'}
    ]
  };

  final Map<String, dynamic> _constraints = {
    'mandatory': {
      'OfferToReceiveAudio': true,
      'OfferToReceiveVideo': true,
    },
    'optional': [],
  };

  /// Initialize local media and peer connection
  Future<void> initialize({required bool video}) async {
    final mediaConstraints = {
      'audio': true,
      'video': video ? {
        'facingMode': 'user',
        'width': 1280,
        'height': 720,
      } : false,
    };

    // Get local media
    _localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    onLocalStream?.call(_localStream!);

    // Create peer connection
    _peerConnection = await createRTCPeerConnection(_configuration, _constraints);

    // Handle ICE candidates
    _peerConnection!.onIceCandidate = (candidate) {
      onIceCandidate?.call(candidate);
    };

    // Handle remote tracks
    _peerConnection!.onTrack = (event) {
      if (event.streams.isNotEmpty) {
        _remoteStream = event.streams[0];
        onRemoteStream?.call(_remoteStream!);
      }
    };

    // Add local tracks to peer connection
    _localStream!.getTracks().forEach((track) {
      _peerConnection!.addTrack(track, _localStream!);
    });
  }

  /// Create SDP Offer
  Future<void> createOffer() async {
    if (_peerConnection == null) return;
    RTCSessionDescription description = await _peerConnection!.createOffer(_constraints);
    await _peerConnection!.setLocalDescription(description);
    onOfferCreated?.call(description);
  }

  /// Create SDP Answer from remote Offer
  Future<void> createAnswer(RTCSessionDescription offer) async {
    if (_peerConnection == null) return;
    await _peerConnection!.setRemoteDescription(offer);
    RTCSessionDescription description = await _peerConnection!.createAnswer(_constraints);
    await _peerConnection!.setLocalDescription(description);
    onAnswerCreated?.call(description);
  }

  /// Set remote description (Answer or Offer)
  Future<void> setRemoteDescription(RTCSessionDescription description) async {
    await _peerConnection?.setRemoteDescription(description);
  }

  /// Add ICE candidate received from signaling
  Future<void> addIceCandidate(RTCIceCandidate candidate) async {
    await _peerConnection?.addCandidate(candidate);
  }

  /// Proper cleanup of resources
  Future<void> dispose() async {
    _localStream?.getTracks().forEach((track) => track.stop());
    await _localStream?.dispose();
    await _remoteStream?.dispose();
    await _peerConnection?.dispose();
    _peerConnection = null;
  }
  
  /// Toggle microphone mute
  void toggleMute(bool muted) {
    _localStream?.getAudioTracks().forEach((track) {
      track.enabled = !muted;
    });
  }

  /// Toggle camera enable/disable
  void toggleVideo(bool enabled) {
    _localStream?.getVideoTracks().forEach((track) {
      track.enabled = enabled;
    });
  }

  /// Switch between front and back camera
  Future<void> switchCamera() async {
    if (_localStream != null) {
      final videoTrack = _localStream!.getVideoTracks().first;
      await Helper.switchCamera(videoTrack);
    }
  }
}
