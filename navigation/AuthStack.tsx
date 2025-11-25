import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import StudentRegistrationScreen from '../screens/auth/StudentRegistrationScreen';
import ProfessorRegistrationScreen from '../screens/auth/ProfessorRegistrationScreen';
import AdminLoginScreen from '../screens/auth/AdminLoginScreen';

const Stack = createStackNavigator();

const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="StudentRegistration" component={StudentRegistrationScreen} />
      <Stack.Screen name="ProfessorRegistration" component={ProfessorRegistrationScreen} />
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;
