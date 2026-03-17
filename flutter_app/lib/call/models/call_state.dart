// lib/call/models/call_state.dart

enum CallStatus {
  idle,
  ringing,
  connecting,
  connected,
  ended,
  failed,
}

enum CallType {
  audio,
  video,
}

class CallSession {
  final String id;
  final String remoteUserId;
  final String remoteUserName;
  final CallType type;
  final CallStatus status;
  final DateTime? startTime;
  final String? fingerprint; // DTLS Fingerprint for E2EE verification UI

  CallSession({
    required this.id,
    required this.remoteUserId,
    required this.remoteUserName,
    required this.type,
    this.status = CallStatus.idle,
    this.startTime,
    this.fingerprint,
  });

  CallSession copyWith({
    CallStatus? status,
    DateTime? startTime,
    String? fingerprint,
  }) {
    return CallSession(
      id: id,
      remoteUserId: remoteUserId,
      remoteUserName: remoteUserName,
      type: type,
      status: status ?? this.status,
      startTime: startTime ?? this.startTime,
      fingerprint: fingerprint ?? this.fingerprint,
    );
  }
}
