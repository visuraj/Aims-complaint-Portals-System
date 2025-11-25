import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ProfessorDashboard from '../screens/professor/ProfessorDashboard';
import ProfessorComplaintDetails from '../screens/professor/ProfessorComplaintDetails';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const ProfessorTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#9c27b0',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={ProfessorDashboard} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const ProfessorStack: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfessorTabs" 
        component={ProfessorTabs} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ComplaintDetails" 
        component={ProfessorComplaintDetails}
        options={{ title: 'Complaint Details' }}
      />
    </Stack.Navigator>
  );
};

export default ProfessorStack;
