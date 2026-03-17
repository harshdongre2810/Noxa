// lib/webrtc/webrtc_service.dart

import 'dart:async';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'ice_config.dart';

class WebRTCService {
  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  
  // Callbacks for the controller to handle stream updates and signaling
  Function(MediaStream)? onLocalStream;
  Function(MediaStream)? onRemoteStream;
  Function(RTCIceCandidate)? onIceCandidate;
  Function(RTCSessionDescription)? onSdpReady;
  Function(String)? onFingerprintReady;

  /// Initializes the local media stream and creates the PeerConnection.
  Future<void> initialize({required bool video}) async {
    final mediaConstraints = {
      'audio': true,
      'video': video ? {
        'facingMode': 'user',
        'width': {'min': '640', 'ideal': '1280'},
        'height': {'min': '480', 'ideal': '720'},
      } : false,
    };

    // 1. Get User Media
    _localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    onLocalStream?.call(_localStream!);

    // 2. Create Peer Connection with ICE configuration
    _peerConnection = await createRTCPeerConnection(
      IceConfig.configuration,
      IceConfig.constraints,
    );

    // 3. Set up ICE Candidate listener
    _peerConnection!.onIceCandidate = (candidate) {
      onIceCandidate?.call(candidate);
    };
    
    // 4. Set up Remote Track listener
    _peerConnection!.onTrack = (event) {
      if (event.streams.isNotEmpty) {
        onRemoteStream?.call(event.streams[0]);
      }
    };

    // 5. Add local tracks to the connection
    _localStream!.getTracks().forEach((track) {
      _peerConnection!.addTrack(track, _localStream!);
    });
  }

  /// Creates an SDP Offer and sets it as the local description.
  Future<void> createOffer() async {
    if (_peerConnection == null) {
      throw Exception("PeerConnection not initialized. Call initialize() first.");
    }
    
    RTCSessionDescription offer = await _peerConnection!.createOffer(IceConfig.constraints);
    await _peerConnection!.setLocalDescription(offer);
    
    // Extract DTLS fingerprint for verification UI
    _extractFingerprint(offer.sdp!);
    
    // Notify controller that SDP is ready to be sent via signaling
    onSdpReady?.call(offer);
  }

  /// Creates an SDP Answer in response to an incoming Offer.
  Future<void> createAnswer(RTCSessionDescription offer) async {
    if (_peerConnection == null) {
      throw Exception("PeerConnection not initialized.");
    }
    
    await _peerConnection!.setRemoteDescription(offer);
    RTCSessionDescription answer = await _peerConnection!.createAnswer(IceConfig.constraints);
    await _peerConnection!.setLocalDescription(answer);
    
    _extractFingerprint(answer.sdp!);
    
    onSdpReady?.call(answer);
  }

  /// Sets the remote description received from the signaling server.
  Future<void> setRemoteDescription(RTCSessionDescription sdp) async {
    await _peerConnection?.setRemoteDescription(sdp);
  }

  /// Adds an ICE candidate received from the signaling server.
  Future<void> addIceCandidate(RTCIceCandidate candidate) async {
    await _peerConnection?.addCandidate(candidate);
  }

  /// Extracts the SHA-256 fingerprint from the SDP for E2EE verification UI.
  void _extractFingerprint(String sdp) {
    final exp = RegExp(r'a=fingerprint:sha-256\s+([A-F0-9:]+)');
    final match = exp.firstMatch(sdp);
    if (match != null) {
      onFingerprintReady?.call(match.group(1)!);
    }
  }

  /// Toggles the local microphone.
  void toggleMute(bool muted) {
    _localStream?.getAudioTracks().forEach((track) => track.enabled = !muted);
  }

  /// Toggles the local camera.
  void toggleVideo(bool enabled) {
    _localStream?.getVideoTracks().forEach((track) => track.enabled = enabled);
  }

  /// Toggles the speakerphone.
  Future<void> setSpeakerphoneOn(bool enabled) async {
    await Helper.setSpeakerphoneOn(enabled);
  }

  /// Switches between front and back cameras.
  Future<void> switchCamera() async {
    if (_localStream != null && _localStream!.getVideoTracks().isNotEmpty) {
      await Helper.switchCamera(_localStream!.getVideoTracks().first);
    }
  }

  /// Disposes of all WebRTC resources.
  Future<void> dispose() async {
    _localStream?.getTracks().forEach((track) => track.stop());
    await _localStream?.dispose();
    await _peerConnection?.dispose();
    _peerConnection = null;
  }
}
