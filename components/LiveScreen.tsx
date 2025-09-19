import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AlpasoApiService from '../services/AlpasoApiService';
import { useAuth } from '../App';

interface Stream {
  _id: string;
  title: string;
  description: string;
  sellerName: string;
  sellerId: string;
  status: 'live' | 'scheduled' | 'ended';
  currentParticipants: number;
  maxParticipants: number;
  thumbnailUrl?: string;
  category: string;
  startTime?: string;
  products: any[];
}

export default function LiveScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'live' | 'scheduled'>('all');

  useEffect(() => {
    loadStreams();
  }, [filter]);

  const loadStreams = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📱 [LIVE SCREEN] Loading streams with filter:', filter);

      // Obtener streams desde el backend
      const response = await AlpasoApiService.getStreams({
        status: filter === 'all' ? undefined : filter,
        page: 1,
        limit: 20
      });

      if (response.success && response.streams) {
        setStreams(response.streams);
        console.log(`✅ [LIVE SCREEN] Loaded ${response.streams.length} streams`);
      } else {
        setStreams([]);
      }

    } catch (err: any) {
      console.error('❌ [LIVE SCREEN] Error loading streams:', err);
      setError(err.message || 'Error al cargar las transmisiones');

      if (!refreshing) {
        Alert.alert(
          'Error',
          'No se pudieron cargar las transmisiones. Verifica tu conexión.',
          [{ text: 'Reintentar', onPress: () => loadStreams() }]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStreams();
  };

  const joinStream = (stream: Stream) => {
    console.log('🚀 [LIVE SCREEN] Joining stream:', stream.title);

    if (stream.status === 'ended') {
      Alert.alert(
        'Transmisión finalizada',
        'Esta transmisión ya ha terminado.'
      );
      return;
    }

    if (stream.status === 'scheduled') {
      Alert.alert(
        'Transmisión programada',
        `Esta transmisión está programada para: ${new Date(stream.startTime || '').toLocaleString()}`
      );
      return;
    }

    // Navegar a la pantalla de streaming
    navigation.navigate('StreamPlayer' as never, {
      streamId: stream._id,
      isHost: false,
    } as never);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return '#ff4444';
      case 'scheduled':
        return '#ff9500';
      case 'ended':
        return '#666';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live':
        return '🔴 EN VIVO';
      case 'scheduled':
        return '📅 PROGRAMADO';
      case 'ended':
        return '⏹️ FINALIZADO';
      default:
        return status.toUpperCase();
    }
  };

  const renderStreamItem = ({ item }: { item: Stream }) => (
    <TouchableOpacity
      style={[styles.streamCard, item.status === 'ended' && styles.streamCardEnded]}
      onPress={() => joinStream(item)}
      disabled={item.status === 'ended'}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <Ionicons name="videocam" size={32} color="#8B4513" />
          </View>
        )}

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>

        {/* Viewer Count for live streams */}
        {item.status === 'live' && (
          <View style={styles.viewerCount}>
            <Ionicons name="eye" size={12} color="white" />
            <Text style={styles.viewerCountText}>{item.currentParticipants}</Text>
          </View>
        )}
      </View>

      {/* Stream Info */}
      <View style={styles.streamInfo}>
        <Text style={styles.streamTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.sellerName}>
          👨‍💼 {item.sellerName}
        </Text>

        <Text style={styles.streamDescription} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Stream Meta */}
        <View style={styles.streamMeta}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>

          {item.products && item.products.length > 0 && (
            <View style={styles.productTag}>
              <Ionicons name="bag" size={12} color="#8B4513" />
              <Text style={styles.productCount}>{item.products.length}</Text>
            </View>
          )}
        </View>

        {/* Scheduled time */}
        {item.status === 'scheduled' && item.startTime && (
          <Text style={styles.scheduledTime}>
            ⏰ {new Date(item.startTime).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {item.status === 'live' && (
          <TouchableOpacity style={styles.joinButton} onPress={() => joinStream(item)}>
            <Ionicons name="play" size={16} color="white" />
            <Text style={styles.joinButtonText}>Ver</Text>
          </TouchableOpacity>
        )}

        {item.status === 'scheduled' && (
          <TouchableOpacity style={styles.scheduleButton}>
            <Ionicons name="notifications" size={16} color="#8B4513" />
            <Text style={styles.scheduleButtonText}>Recordar</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (filterType: 'all' | 'live' | 'scheduled', label: string, icon: string) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === filterType && styles.filterButtonActive]}
      onPress={() => setFilter(filterType)}
    >
      <Ionicons
        name={icon as any}
        size={18}
        color={filter === filterType ? 'white' : '#8B4513'}
      />
      <Text style={[
        styles.filterButtonText,
        filter === filterType && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Cargando transmisiones...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📺 Transmisiones en Vivo</Text>
        <Text style={styles.headerSubtitle}>Descubre café en tiempo real</Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {renderFilterButton('all', 'Todas', 'grid')}
        {renderFilterButton('live', 'En Vivo', 'radio-button-on')}
        {renderFilterButton('scheduled', 'Programadas', 'time')}
      </View>

      {/* Streams List */}
      {error && !loading ? (
        <View style={styles.errorContainer}>
          <Ionicons name="wifi-off" size={64} color="#ccc" />
          <Text style={styles.errorTitle}>Error de conexión</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadStreams}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={streams}
          renderItem={renderStreamItem}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.streamsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="videocam-off" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No hay transmisiones</Text>
              <Text style={styles.emptyMessage}>
                {filter === 'live'
                  ? 'No hay transmisiones en vivo en este momento'
                  : filter === 'scheduled'
                  ? 'No hay transmisiones programadas'
                  : 'No hay transmisiones disponibles'}
              </Text>
              <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                <Ionicons name="refresh" size={20} color="#8B4513" />
                <Text style={styles.refreshButtonText}>Actualizar</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#8B4513',
    padding: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#8B4513',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#8B4513',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B4513',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  streamsList: {
    padding: 16,
    paddingBottom: 32,
  },
  streamCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  streamCardEnded: {
    opacity: 0.6,
  },
  thumbnailContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  viewerCount: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  viewerCountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  streamInfo: {
    padding: 16,
  },
  streamTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
    marginBottom: 8,
  },
  streamDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  streamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '500',
  },
  productTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  productCount: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '500',
  },
  scheduledTime: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  joinButton: {
    backgroundColor: '#ff4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scheduleButton: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B4513',
    gap: 6,
  },
  scheduleButtonText: {
    color: '#8B4513',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B4513',
    gap: 6,
  },
  refreshButtonText: {
    color: '#8B4513',
    fontSize: 14,
    fontWeight: '500',
  },
});
