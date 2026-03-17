// lib/webrtc/ice_config.dart

class IceConfig {
  /// ICE Server Configuration.
  /// STUN is used for public IP discovery.
  /// TURN is MANDATORY for NAT traversal (symmetric NATs, firewalls).
  static Map<String, dynamic> get configuration => {
    'iceServers': [
      {
        'urls': [
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
        ],
      },
      {
        // TODO: Replace with your production COTURN server credentials
        // TURN is required for reliable calls over cellular or restricted networks.
        'urls': 'turn:your-turn-server.com:3478',
        'username': 'production_user',
        'credential': 'production_password',
      },
    ],
    'sdpSemantics': 'unified-plan',
  };

  static Map<String, dynamic> get constraints => {
    'mandatory': {
      'OfferToReceiveAudio': true,
      'OfferToReceiveVideo': true,
    },
    'optional': [
      {'DtlsSrtpKeyAgreement': true}, // Required for DTLS-SRTP encryption
    ],
  };
}
