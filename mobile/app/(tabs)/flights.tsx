import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function FlightsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: flights, isLoading } = useQuery({
    queryKey: ['all-flights'],
    queryFn: async () => {
      const token = await user?.getIdToken();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/flights`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch flights');
      return response.json();
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Flights</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <Text>Loading flights...</Text>
        </View>
      ) : flights && flights.length > 0 ? (
        flights.map((flight: any) => (
          <TouchableOpacity
            key={flight.id}
            style={styles.flightCard}
            onPress={() => router.push(`/flights/${flight.id}`)}
          >
            <View style={styles.flightHeader}>
              <Text style={styles.flightDate}>
                {new Date(flight.scheduledStart).toLocaleDateString()}
              </Text>
              <Text style={styles.flightStatus}>{flight.status}</Text>
            </View>
            <Text style={styles.flightTime}>
              {new Date(flight.scheduledStart).toLocaleTimeString()} -{' '}
              {new Date(flight.scheduledEnd).toLocaleTimeString()}
            </Text>
            <Text style={styles.flightAirport}>{flight.departureAirport}</Text>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No flights scheduled</Text>
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
  flightCard: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  flightDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  flightStatus: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    fontWeight: '500',
  },
  flightTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  flightAirport: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});

