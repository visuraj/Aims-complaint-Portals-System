import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  Divider,
} from 'react-native-paper';
import { useAuth } from '../../contexts/MongoDBAuthContext';

const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { signIn } = useAuth();

  // ✅ Email Validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  // ✅ Password Validation
  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  // ✅ Login Function
  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Attempting login for user:', email);
      await signIn(email.trim().toLowerCase(), password);
    } catch (error: any) {
      console.error('💥 Login error:', error);
      
      // More specific error handling
      if (error.message.includes('connect') || error.message.includes('network') || error.message.includes('server')) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please check your internet connection and ensure the server is running on port 3001.\n\n' +
          'Troubleshooting tips:\n' +
          '• Make sure the server is running (npm start)\n' +
          '• If using Android emulator, try using 10.0.2.2 as the host\n' +
          '• If using a physical device, ensure both devices are on the same network\n' +
          '• Check your firewall settings\n\n' +
          `Error details: ${error.message}`
        );
      } else if (error.message.includes('timeout')) {
        Alert.alert(
          'Connection Timeout',
          'The server is taking too long to respond. Please try again.\n\n' +
          'This could be due to:\n' +
          '• Slow network connection\n' +
          '• Server overload\n' +
          '• Firewall blocking the connection'
        );
      } else if (error.message.includes('pending approval')) {
        Alert.alert(
          'Account Pending Approval',
          'Your account is pending admin approval. Please contact the administrator.'
        );
      } else {
        Alert.alert('Login Failed', error.message || 'Invalid credentials. Please check your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Admin Login Redirect
  const handleAdminLogin = () => {
    navigation.navigate('AdminLogin');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header Section */}
        <View style={styles.header}>
          <Title style={styles.title}>Complaint Portal</Title>
          <Paragraph style={styles.subtitle}>College Management System</Paragraph>
        </View>

        {/* Login Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Login</Title>

            {/* Email Input */}
            <TextInput
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              error={!!emailError}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            {/* Password Input */}
            <TextInput
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              error={!!passwordError}
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

            {/* Login Button */}
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Login
            </Button>

            <Divider style={styles.divider} />

            {/* Registration Section */}
            <View style={styles.registerSection}>
              <Text style={styles.registerText}>Don't have an account?</Text>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('StudentRegistration')}
                style={styles.registerButton}
              >
                Register as Student
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('ProfessorRegistration')}
                style={styles.registerButton}
              >
                Register as Professor
              </Button>
            </View>

            <Divider style={styles.divider} />

            {/* Admin Login Button */}
            <Button
              mode="text"
              onPress={handleAdminLogin}
              style={styles.adminButton}
            >
              Admin Login
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

// ✅ Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  card: {
    elevation: 4,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 22,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    marginBottom: 20,
  },
  divider: {
    marginVertical: 20,
  },
  registerSection: {
    alignItems: 'center',
  },
  registerText: {
    marginBottom: 15,
    fontSize: 16,
  },
  registerButton: {
    marginBottom: 10,
    width: '100%',
  },
  adminButton: {
    marginTop: 10,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
});

export default LoginScreen;