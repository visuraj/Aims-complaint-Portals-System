import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper'; // Import DefaultTheme
import { AuthProvider, useAuth } from './contexts/MongoDBAuthContext';
import AuthStack from './navigation/AuthStack';
import StudentStack from './navigation/StudentStack';
import ProfessorStack from './navigation/ProfessorStack';
import AdminStack from './navigation/AdminStack';
import LoadingScreen from './screens/LoadingScreen';

// Configure theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#d32f2f', // Red color for admin
    accent: '#1976d2',  // Blue color for student
  },
};

const Stack = createStackNavigator();

function AppContent() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  const getInitialRouteName = () => {
    if (!user || !userProfile) {
      return 'Auth';
    }
    
    switch (userProfile.role) {
      case 'student':
        return 'Student';
      case 'professor':
        return 'Professor';
      case 'admin':
        return 'Admin';
      default:
        return 'Auth';
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={getInitialRouteName()}
        screenOptions={{ headerShown: false }}
      >
        {!user || !userProfile ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <>
            {userProfile.role === 'student' && (
              <Stack.Screen name="Student" component={StudentStack} />
            )}
            {userProfile.role === 'professor' && (
              <Stack.Screen name="Professor" component={ProfessorStack} />
            )}
            {userProfile.role === 'admin' && (
              <Stack.Screen name="Admin" component={AdminStack} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme}> {/* Wrap with PaperProvider and theme */}
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </PaperProvider>
  );
}