import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  final String baseUrl = 'https://ais-dev-qb7eseuuwynsfp4xxy3g4f-490784673095.asia-southeast1.run.app';

  Future<Map<String, dynamic>> register({
    required String username,
    required String password,
    required String publicKey,
    required String recoveryKey,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'username': username,
        'password': password,
        'publicKey': publicKey,
        'recoveryKey': recoveryKey,
      }),
    );

    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'username': username,
        'password': password,
      }),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', data['token']);
      await prefs.setString('userId', data['user']['id']);
      await prefs.setString('username', data['user']['username']);
    }
    return data;
  }

  Future<String?> getPublicKey(String username) async {
    final response = await http.get(Uri.parse('$baseUrl/api/users/$username/key'));
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['publicKey'];
    }
    return null;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}
