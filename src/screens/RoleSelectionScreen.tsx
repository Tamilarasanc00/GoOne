import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Surface, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useAppDispatch } from '../redux/hooks';
import { setRole } from '../redux/slices/appSlice';

type RoleSelectionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RoleSelection'>;

const ROLES = [
  { id: 'retail_shop', name: 'Retail Shop', icon: 'storefront-outline' },
  { id: 'farmer', name: 'Farmer', icon: 'tractor' },
  { id: 'service_worker', name: 'Service Worker', icon: 'wrench-outline' },
  { id: 'rental_owner', name: 'Rental Owner', icon: 'key-outline' },
  { id: 'customer', name: 'Customer', icon: 'account-outline' },
];

const PRIMARY_COLOR = '#0066FF';

const RoleSelectionScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<RoleSelectionNavigationProp>();
  const dispatch = useAppDispatch();
  
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      dispatch(setRole(selectedRole));
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    }
  };

  const renderItem = ({ item }: { item: typeof ROLES[0] }) => {
    const isSelected = selectedRole === item.id;
    return (
      <TouchableOpacity onPress={() => setSelectedRole(item.id)} activeOpacity={0.8} style={styles.cardWrapper}>
        <Surface 
          style={[
            styles.roleCard, 
            { 
              backgroundColor: isSelected ? PRIMARY_COLOR : theme.colors.surface,
              borderColor: isSelected ? PRIMARY_COLOR : theme.colors.outlineVariant,
              borderWidth: 2,
            }
          ]} 
          elevation={isSelected ? 4 : 1}
        >
          <MaterialCommunityIcons 
            name={item.icon} 
            size={48} 
            color={isSelected ? '#FFFFFF' : PRIMARY_COLOR} 
            style={styles.icon}
          />
          <Text 
            variant="titleMedium" 
            style={[
              styles.roleName, 
              { color: isSelected ? '#FFFFFF' : theme.colors.onSurface }
            ]}
          >
            {item.name}
          </Text>
        </Surface>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Choose Your Role
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            Select how you want to use the app
          </Text>
        </View>

        <FlatList
          data={ROLES}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.footer}>
          <Button 
            mode="contained" 
            onPress={handleContinue} 
            disabled={!selectedRole}
            style={[styles.continueButton, selectedRole ? { backgroundColor: PRIMARY_COLOR } : undefined]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Continue
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardWrapper: {
    width: '48%',
  },
  roleCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  icon: {
    marginBottom: 12,
  },
  roleName: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  continueButton: {
    borderRadius: 16,
  },
  buttonContent: {
    height: 60,
  },
  buttonLabel: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default RoleSelectionScreen;
