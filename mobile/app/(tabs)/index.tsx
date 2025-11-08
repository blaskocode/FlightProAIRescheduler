import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useFirebaseRealtime } from '../../hooks/useFirebaseRealtime';

export default function DashboardScreen() {
  const { user } = useAuth();
  const notifications = useFirebaseRealtime(`notifications/${user?.uid}`);

  const { data: flights, isLoading, refetch } = useQuery({
    queryKey: ['upcoming-flights'],
    queryFn: async () => {
      const token = await user?.getIdToken();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/flights/upcoming`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch flights');
      return response.json();
    },
  });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back!</Text>
      </View>

      {notifications && notifications.length > 0 && (
        <View style={styles.notifications}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {notifications.map((notification: any) => (
            <View key={notification.id} style={styles.notificationCard}>
              <Text style={styles.notificationTitle}>{notification.subject}</Text>
              <Text style={styles.notificationText}>{notification.message}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Flights</Text>
        {isLoading ? (
          <Text>Loading...</Text>
        ) : flights && flights.length > 0 ? (
          flights.map((flight: any) => (
            <View key={flight.id} style={styles.flightCard}>
              <Text style={styles.flightDate}>
                {new Date(flight.scheduledStart).toLocaleDateString()}
              </Text>
              <Text style={styles.flightTime}>
                {new Date(flight.scheduledStart).toLocaleTimeString()}
              </Text>
              <Text style={styles.flightStatus}>{flight.status}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No upcoming flights</Text>
        )}
      </View>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  notifications: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  notificationCard: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 14,
    color: '#78350f',
  },
  flightCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  flightDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  flightTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  flightStatus: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});

