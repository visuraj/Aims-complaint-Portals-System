import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Divider,
} from 'react-native-paper';
import { useAuth } from '../contexts/MongoDBAuthContext';

const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userProfile, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  if (!userProfile) {
    return (
      <View style={styles.container}>
        <Text>No user profile found</Text>
      </View>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student':
        return '#2196f3';
      case 'professor':
        return '#9c27b0';
      case 'admin':
        return '#d32f2f';
      default:
        return '#666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'approved':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      default:
        return '#666';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Profile</Title>
      </View>

      <Card style={styles.profileCard}>
        <Card.Content>
          <View style={styles.profileHeader}>
            <Title style={styles.profileName}>{userProfile.fullName}</Title>
            <View style={styles.chipContainer}>
              <Chip 
                style={[styles.roleChip, { backgroundColor: getRoleColor(userProfile.role) }]}
                textStyle={styles.chipText}
              >
                <Text>{userProfile.role.toUpperCase()}</Text>
              </Chip>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getStatusColor(userProfile.status) }]}
                textStyle={styles.chipText}
              >
                <Text>{userProfile.status.toUpperCase()}</Text>
              </Chip>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.profileInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{userProfile.email}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role:</Text>
              <Text style={styles.infoValue}>{userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={styles.infoValue}>{userProfile.status.charAt(0).toUpperCase() + userProfile.status.slice(1)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member Since:</Text>
              <Text style={styles.infoValue}>
                {new Date(userProfile.createdAt).toLocaleDateString()}
              </Text>
            </View>
            
            {userProfile.role === 'student' && (
              <>
                <Divider style={styles.sectionDivider} />
                <Text style={styles.sectionTitle}>Student Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>College ID:</Text>
                  <Text style={styles.infoValue}>{userProfile.collegeId}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Course:</Text>
                  <Text style={styles.infoValue}>{userProfile.course}</Text>
                </View>
              </>
            )}
            
            {userProfile.role === 'professor' && (
              <>
                <Divider style={styles.sectionDivider} />
                <Text style={styles.sectionTitle}>Professor Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Professor ID:</Text>
                  <Text style={styles.infoValue}>{userProfile.professorId}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Department:</Text>
                  <Text style={styles.infoValue}>{userProfile.department}</Text>
                </View>
              </>
            )}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.actionsCard}>
        <Card.Content>
          <Title style={styles.actionsTitle}>Account Actions</Title>
          
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            Logout
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1976d2',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileCard: {
    margin: 16,
    elevation: 4,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  chipContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  roleChip: {
    marginHorizontal: 4,
  },
  statusChip: {
    marginHorizontal: 4,
  },
  chipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  profileInfo: {
    paddingHorizontal: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  sectionDivider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 12,
  },
  actionsCard: {
    margin: 16,
    marginTop: 0,
    elevation: 4,
  },
  actionsTitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#d32f2f',
  },
  logoutButton: {
    borderColor: '#d32f2f',
  },
});

export default ProfileScreen;
