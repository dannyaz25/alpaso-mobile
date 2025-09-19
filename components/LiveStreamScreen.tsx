import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import NativeVideoPlayer from './NativeVideoPlayer';
import AlpasoApiService from '../services/AlpasoApiService';
import { useAuth } from '../App';

interface LiveStreamScreenProps {
  route: {
    params: {
      streamId: string;
      isHost?: boolean;
      roomUrl?: string;
      token?: string;
    };
  };
}

export default function LiveStreamScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { streamId, isHost = false, roomUrl, token } = route.params as any;

  const [streamData, setStreamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchStreamData();

    // Configurar el header para ocultar la barra de estado en fullscreen
    StatusBar.setHidden(isFullscreen, 'slide');

    return () => {
      StatusBar.setHidden(false, 'slide');
    };
  }, [streamId, isFullscreen]);

  const fetchStreamData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📱 [LIVE SCREEN] Fetching stream data for:', streamId);

      // Obtener información del stream desde el backend
      const response = await AlpasoApiService.getStream(streamId);

      console.log('✅ [LIVE SCREEN] getStream response:', response);

      // Manejar respuesta directa sin wrapper success/stream
      if (response && response._id) {
        setStreamData(response);
        console.log('✅ [LIVE SCREEN] Stream data loaded:', response.title);
      } else if (response.success && response.stream) {
        setStreamData(response.stream);
        console.log('✅ [LIVE SCREEN] Stream data loaded:', response.stream.title);
      } else {
        throw new Error('Stream no encontrado');
      }

    } catch (err: any) {
      console.error('❌ [LIVE SCREEN] Error fetching stream data:', err);
      setError(err.message || 'Error al cargar la información del stream');

      // Mostrar alert y regresar a la pantalla anterior
      Alert.alert(
        'Error',
        'No se pudo cargar la transmisión. Intenta nuevamente.',
        [
          {
            text: 'Volver',
            onPress: () => navigation.goBack(),
          },
          {
            text: 'Reintentar',
            onPress: () => fetchStreamData(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStreamError = (error: any) => {
    console.error('❌ [LIVE SCREEN] Stream error:', error);

    Alert.alert(
      'Error en la transmisión',
      'Hubo un problema con la transmisión en vivo.',
      [
        {
          text: 'Reintentar',
          onPress: () => fetchStreamData(),
        },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const handleStreamEnd = () => {
    console.log('🏁 [LIVE SCREEN] Stream ended');

    Alert.alert(
      'Transmisión finalizada',
      isHost
        ? 'Has terminado la transmisión exitosamente.'
        : 'La transmisión ha finalizado.',
      [
        {
          text: 'Continuar',
          onPress: () => {
            if (isHost) {
              // Navegar al dashboard del vendedor
              navigation.navigate('SellerDashboard' as never);
            } else {
              // Regresar a la lista de transmisiones
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const handleBackPress = () => {
    if (isHost) {
      Alert.alert(
        'Salir de la transmisión',
        '¿Estás seguro de que quieres salir? Esto terminará la transmisión para todos los espectadores.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Terminar transmisión',
            style: 'destructive',
            onPress: () => {
              // Aquí podrías llamar al backend para terminar oficialmente el stream
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const navigateToProfile = () => {
    // Navegar al perfil del vendedor/host
    if (streamData?.sellerId) {
      // Implementar navegación al perfil del vendedor
      console.log('Navigating to seller profile:', streamData.sellerId);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Cargando transmisión...</Text>
      </SafeAreaView>
    );
  }

  if (error && !streamData) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Ionicons name="alert-circle" size={64} color="#ff6b6b" />
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchStreamData}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header - Solo mostrar si no está en fullscreen */}
      {!isFullscreen && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.streamTitle} numberOfLines={1}>
              {streamData?.title || 'Transmisión en vivo'}
            </Text>
            <Text style={styles.streamSubtitle}>
              {isHost ? 'Tu transmisión' : `Por ${streamData?.sellerName || 'Usuario'}`}
            </Text>
          </View>

          <TouchableOpacity style={styles.headerButton} onPress={toggleFullscreen}>
            <Ionicons name="expand" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Video Player Principal */}
      <View style={[styles.videoPlayerContainer, isFullscreen && styles.fullscreenVideo]}>
        <NativeVideoPlayer
          streamId={streamId}
          isHost={isHost}
          roomUrl={streamData?.roomUrl || roomUrl || ''}
          token={token || 'mock-token'}
          onError={handleStreamError}
          onStreamEnd={handleStreamEnd}
        />

        {/* Controles superpuestos en fullscreen */}
        {isFullscreen && (
          <View style={styles.fullscreenControls}>
            <TouchableOpacity style={styles.fullscreenButton} onPress={toggleFullscreen}>
              <Ionicons name="contract" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Stream Info - Solo mostrar si no está en fullscreen */}
      {!isFullscreen && streamData && (
        <View style={styles.streamInfo}>
          <View style={styles.streamStats}>
            <View style={styles.statItem}>
              <Ionicons name="eye" size={16} color="#95a5a6" />
              <Text style={styles.statText}>
                {streamData.currentParticipants || 0} viendo
              </Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="time" size={16} color="#95a5a6" />
              <Text style={styles.statText}>
                {streamData.status === 'live' ? 'EN VIVO' : streamData.status?.toUpperCase()}
              </Text>
            </View>
          </View>

          {streamData.description && (
            <Text style={styles.streamDescription} numberOfLines={3}>
              {streamData.description}
            </Text>
          )}

          {/* Acciones adicionales */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={navigateToProfile}>
              <Ionicons name="person-circle" size={20} color="#8B4513" />
              <Text style={styles.actionButtonText}>Ver perfil</Text>
            </TouchableOpacity>

            {!isHost && (
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="heart" size={20} color="#8B4513" />
                <Text style={styles.actionButtonText}>Me gusta</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share" size={20} color="#8B4513" />
              <Text style={styles.actionButtonText}>Compartir</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullscreenContainer: {
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  errorTitle: {
    color: '#ff6b6b',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  errorMessage: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 15,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  headerButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginHorizontal: 15,
  },
  streamTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  streamSubtitle: {
    color: '#95a5a6',
    fontSize: 12,
    marginTop: 2,
  },
  videoPlayerContainer: {
    flex: 1,
    position: 'relative',
  },
  fullscreenVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  fullscreenControls: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 20,
  },
  fullscreenButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 25,
  },
  streamInfo: {
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  streamStats: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    color: '#95a5a6',
    fontSize: 14,
    marginLeft: 5,
  },
  streamDescription: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#8B4513',
  },
  actionButtonText: {
    color: '#8B4513',
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '500',
  },
});
