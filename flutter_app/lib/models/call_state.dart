// lib/models/call_state.dart

enum CallStatus {
  idle,
  ringing,
  connecting,
  connected,
  held,
  ended,
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

  CallSession({
    required this.id,
    required this.remoteUserId,
    required this.remoteUserName,
    required this.type,
    this.status = CallStatus.idle,
    this.startTime,
  });

  CallSession copyWith({
    CallStatus? status,
    DateTime? startTime,
  }) {
    return CallSession(
      id: id,
      remoteUserId: remoteUserId,
      remoteUserName: remoteUserName,
      type: type,
      status: status ?? this.status,
      startTime: startTime ?? this.startTime,
    );
  }
}
