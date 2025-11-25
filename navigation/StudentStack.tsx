import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StudentDashboard from '../screens/student/StudentDashboard';
import AddComplaintScreen from '../screens/student/AddComplaintScreen';
import ComplaintDetailsScreen from '../screens/student/ComplaintDetailsScreen';
import ScheduleMeetingScreen from '../screens/student/ScheduleMeetingScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const StudentTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'AddComplaint') {
            iconName = 'add-circle';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={StudentDashboard} />
      <Tab.Screen name="AddComplaint" component={AddComplaintScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const StudentStack: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="StudentTabs" 
        component={StudentTabs} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ComplaintDetails" 
        component={ComplaintDetailsScreen}
        options={{ title: 'Complaint Details' }}
      />
      <Stack.Screen 
        name="ScheduleMeeting" 
        component={ScheduleMeetingScreen}
        options={{ title: 'Schedule Meeting with Admin' }}
      />
    </Stack.Navigator>
  );
};

export default StudentStack;