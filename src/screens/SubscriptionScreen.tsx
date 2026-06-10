import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text, Surface, Button, useTheme, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiService } from '../services/apiService';

// In a real app, this should be fetched from the backend or an environment variable
const RAZORPAY_KEY_ID = 'rzp_test_placeholderKeyId';

const SubscriptionScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [fetchingPlans, setFetchingPlans] = useState(true);

  React.useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setFetchingPlans(true);
      const response = await apiService.payments.getPlans();
      if (response.success) {
        setPlans(response.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      Alert.alert('Error', 'Failed to load subscription plans.');
    } finally {
      setFetchingPlans(false);
    }
  };

  const handleSubscribe = async (plan: any) => {
    setLoading(true);
    try {
      // 1. Create Order on Backend
      const response = await apiService.payments.createOrder({
        amount: plan.price,
        currency: 'INR',
        plan_id: plan.id,
        plan_type: plan.name
      });
      
      const order_id = response.order_id;

      const options = {
        description: plan.name,
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: 'INR',
        key: RAZORPAY_KEY_ID,
        amount: plan.price * 100, // paise
        name: 'GoOne Marketplace',
        order_id: order_id, 
        theme: { color: theme.colors.primary },
      };

      // 2. Open Razorpay Checkout
      RazorpayCheckout.open(options).then(async (data: any) => {
        // 3. Verify Payment on Backend
        try {
          await apiService.payments.verifyPayment({
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_order_id: data.razorpay_order_id,
            razorpay_signature: data.razorpay_signature,
            plan_type: plan.name,
            plan_id: plan.id
          });
          Alert.alert('Success!', `Your payment for ${plan.name} was successful!`);
          navigation.goBack();
        } catch (verifyError) {
          console.error('Verify error:', verifyError);
          Alert.alert('Payment Verification Failed', 'We received your payment but could not verify it.');
        }
      }).catch((error: any) => {
        // User cancelled or payment failed
        Alert.alert('Payment Cancelled', 'You cancelled the payment or it failed.');
      });

    } catch (error) {
      console.error('Payment Error:', error);
      Alert.alert('Error', 'Something went wrong initiating the payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.headerRow}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text variant="titleLarge" style={styles.headerRowTitle}>Subscription Plans</Text>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Upgrade Your Account</Text>
        <Text variant="bodyLarge" style={styles.headerSubtitle}>Boost your business with our premium plans</Text>
      </View>

      {fetchingPlans ? (
        <ActivityIndicator size="large" style={styles.loader} color={theme.colors.primary} />
      ) : plans.length === 0 ? (
        <Text style={{textAlign: 'center', marginTop: 20}}>No plans available at the moment.</Text>
      ) : (
        plans.map((plan) => (
          <Surface key={plan.id} style={styles.card} elevation={2}>
            <View style={styles.cardHeader}>
              <Text variant="titleLarge" style={styles.planTitle}>{plan.name}</Text>
              <Text variant="headlineSmall" style={styles.planPrice}>₹{plan.price}</Text>
            </View>
            
            <View style={styles.featuresList}>
              {(plan.features || []).map((feature: string, index: number) => (
                <View key={index} style={styles.featureRow}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <Button 
              mode="contained" 
              onPress={() => handleSubscribe(plan)}
              disabled={loading}
              style={styles.button}
            >
              Select Plan
            </Button>
          </Surface>
        ))
      )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backButton: {
    margin: 0,
  },
  headerRowTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  loader: {
    marginBottom: 16,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: 'white',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 16,
  },
  planTitle: {
    fontWeight: 'bold',
    flex: 1,
  },
  planPrice: {
    fontWeight: 'bold',
    color: '#0066FF',
  },
  featuresList: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 12,
    color: '#444',
  },
  button: {
    borderRadius: 8,
  }
});

export default SubscriptionScreen;
