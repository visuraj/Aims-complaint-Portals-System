import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AdminDashboard from '../screens/admin/AdminDashboard';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import ComplaintManagementScreen from '../screens/admin/ComplaintManagementScreen';
import AdminComplaintDetails from '../screens/admin/AdminComplaintDetails';
import AdminScheduleMeetingScreen from '../screens/admin/ScheduleMeetingScreen';
import ExceededLimitStudentsScreen from '../screens/admin/ExceededLimitStudentsScreen';
import SendMeetingRequestScreen from '../screens/admin/SendMeetingRequestScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const AdminTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Users') {
            iconName = 'people';
          } else if (route.name === 'Complaints') {
            iconName = 'assignment';
          } else if (route.name === 'ExceededLimit') {
            iconName = 'warning';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#d32f2f',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboard} />
      <Tab.Screen name="Users" component={UserManagementScreen} />
      <Tab.Screen name="Complaints" component={ComplaintManagementScreen} />
      <Tab.Screen 
        name="ExceededLimit" 
        component={ExceededLimitStudentsScreen} 
        options={{ title: 'Exceeded Limit' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const AdminStack: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AdminTabs" 
        component={AdminTabs} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ComplaintDetails" 
        component={AdminComplaintDetails}
        options={{ title: 'Complaint Details' }}
      />
      <Stack.Screen 
        name="ScheduleMeeting" 
        component={AdminScheduleMeetingScreen}
        options={{ title: 'Schedule Meeting with Student' }}
      />
      <Stack.Screen 
        name="SendMeetingRequest" 
        component={SendMeetingRequestScreen}
        options={{ title: 'Send Meeting Request' }}
      />
    </Stack.Navigator>
  );
};

export default AdminStack;