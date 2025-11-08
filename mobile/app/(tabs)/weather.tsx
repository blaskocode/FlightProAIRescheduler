import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';

export default function WeatherScreen() {
  const { user } = useAuth();

  const { data: weatherAlerts, isLoading } = useQuery({
    queryKey: ['weather-alerts'],
    queryFn: async () => {
      const token = await user?.getIdToken();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/weather/alerts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch weather alerts');
      return response.json();
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weather</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <Text>Loading weather data...</Text>
        </View>
      ) : weatherAlerts && weatherAlerts.length > 0 ? (
        weatherAlerts.map((alert: any) => (
          <View key={alert.id} style={styles.alertCard}>
            <Text style={styles.alertTitle}>{alert.airport}</Text>
            <Text style={styles.alertSeverity}>{alert.severity}</Text>
            <Text style={styles.alertMessage}>{alert.message}</Text>
          </View>
        ))
      ) : (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No weather alerts</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  alertCard: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  alertSeverity: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});

