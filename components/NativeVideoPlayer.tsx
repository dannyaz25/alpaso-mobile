import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Audio } from 'expo-av';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

interface NativeVideoPlayerProps {
  streamId: string;
  isHost: boolean;
  roomUrl: string;
  token: string;
  onError?: (error: any) => void;
  onStreamEnd?: () => void;
}

export const NativeVideoPlayer: React.FC<NativeVideoPlayerProps> = ({
  streamId,
  isHost,
  roomUrl,
  token,
  onError,
  onStreamEnd,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('front');
  const [streamStatus, setStreamStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    console.log('📱 [NATIVE VIDEO] Initializing with:', {
      streamId,
      isHost,
      roomUrl: roomUrl?.substring(0, 50) + '...',
      hasToken: !!token,
    });

    initializePlayer();
  }, []);

  const initializePlayer = async () => {
    try {
      await requestPermissions();
      await setupAudio();

      if (isHost) {
        await initializeHostMode();
      } else {
        await initializeViewerMode();
      }

      setIsLoading(false);
    } catch (error) {
      console.error('❌ [NATIVE VIDEO] Error initializing player:', error);
      setIsLoading(false);
      onError?.(error);
    }
  };

  const requestPermissions = async () => {
    console.log('🔐 [NATIVE VIDEO] Requesting permissions...');

    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: audioStatus } = await Audio.requestPermissionsAsync();

    if (cameraStatus !== 'granted' || audioStatus !== 'granted') {
      setHasPermission(false);
      Alert.alert(
        'Permisos requeridos',
        'Esta aplicación necesita acceso a la cámara y micrófono para funcionar correctamente.',
        [{ text: 'OK' }]
      );
      return;
    }

    setHasPermission(true);
    console.log('✅ [NATIVE VIDEO] Permissions granted');
  };

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
      console.log('✅ [NATIVE VIDEO] Audio setup completed');
    } catch (error) {
      console.error('❌ [NATIVE VIDEO] Audio setup error:', error);
    }
  };

  const initializeHostMode = async () => {
    try {
      console.log('🎥 [NATIVE VIDEO] Initializing host mode...');

      // Simular conexión a Daily.co para host
      setStreamStatus('connecting');

      // En un caso real, aquí conectarías con Daily.co API
      setTimeout(() => {
        setStreamStatus('connected');
        setIsStreaming(true);
        console.log('✅ [NATIVE VIDEO] Host mode initialized');
      }, 2000);

    } catch (error) {
      console.error('❌ [NATIVE VIDEO] Host mode error:', error);
      throw error;
    }
  };

  const initializeViewerMode = async () => {
    try {
      console.log('👁️ [NATIVE VIDEO] Initializing viewer mode...');

      // Simular conexión para viewer
      setStreamStatus('connecting');

      setTimeout(() => {
        setStreamStatus('connected');
        console.log('✅ [NATIVE VIDEO] Viewer mode initialized');
      }, 1500);

    } catch (error) {
      console.error('❌ [NATIVE VIDEO] Viewer mode error:', error);
      throw error;
    }
  };

  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
    console.log('📷 [NATIVE VIDEO] Camera toggled:', !isCameraOn);
  };

  const toggleMicrophone = () => {
    setIsMicOn(!isMicOn);
    console.log('🎤 [NATIVE VIDEO] Microphone toggled:', !isMicOn);
  };

  const switchCamera = () => {
    setCameraType(cameraType === 'front' ? 'back' : 'front');
    console.log('🔄 [NATIVE VIDEO] Camera switched to:', cameraType === 'front' ? 'back' : 'front');
  };

  const endStream = () => {
    Alert.alert(
      'Terminar transmisión',
      '¿Estás seguro de que quieres terminar la transmisión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Terminar',
          style: 'destructive',
          onPress: () => {
            setIsStreaming(false);
            setStreamStatus('disconnected');
            console.log('🛑 [NATIVE VIDEO] Stream ended');
            onStreamEnd?.();
          },
        },
      ]
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Solicitando permisos...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="camera-off" size={50} color="#e74c3c" />
        <Text style={styles.errorText}>Sin acceso a cámara</Text>
        <Text style={styles.errorSubtext}>
          Esta aplicación necesita permisos de cámara y micrófono para funcionar.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>
          {isHost ? 'Iniciando transmisión...' : 'Conectando a transmisión...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusIndicator}>
          <View style={[
            styles.statusDot,
            { backgroundColor: streamStatus === 'connected' ? '#27ae60' : '#e74c3c' }
          ]} />
          <Text style={styles.statusText}>
            {streamStatus === 'connected' ? 'EN VIVO' :
             streamStatus === 'connecting' ? 'CONECTANDO...' : 'DESCONECTADO'}
          </Text>
        </View>

        {isHost && (
          <TouchableOpacity style={styles.endButton} onPress={endStream}>
            <Text style={styles.endButtonText}>Terminar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Video Area */}
      <View style={styles.videoContainer}>
        {isHost && isCameraOn ? (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={cameraType}
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Icon
              name={isHost ? "camera-off" : "videocam"}
              size={60}
              color="#95a5a6"
            />
            <Text style={styles.placeholderText}>
              {isHost ? 'Cámara desactivada' : 'Transmisión en vivo'}
            </Text>
          </View>
        )}

        {/* Controls Overlay */}
        {isHost && (
          <View style={styles.controlsOverlay}>
            <TouchableOpacity
              style={[styles.controlButton, !isCameraOn && styles.controlButtonOff]}
              onPress={toggleCamera}
            >
              <Icon
                name={isCameraOn ? "videocam" : "videocam-off"}
                size={24}
                color="#ffffff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, !isMicOn && styles.controlButtonOff]}
              onPress={toggleMicrophone}
            >
              <Icon
                name={isMicOn ? "mic" : "mic-off"}
                size={24}
                color="#ffffff"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
              <Icon name="camera-reverse" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Stream Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.streamTitle}>Transmisión ID: {streamId}</Text>
        <Text style={styles.streamInfo}>
          {isHost ? 'Modo: Anfitrión' : 'Modo: Espectador'}
        </Text>
        {streamStatus === 'connected' && (
          <Text style={styles.streamInfo}>✅ Conectado exitosamente</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
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
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#95a5a6',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  endButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  endButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
  },
  placeholderText: {
    color: '#95a5a6',
    fontSize: 16,
    marginTop: 10,
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  controlButtonOff: {
    backgroundColor: '#e74c3c',
  },
  infoContainer: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  streamTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  streamInfo: {
    color: '#95a5a6',
    fontSize: 14,
    marginBottom: 3,
  },
});

export default NativeVideoPlayer;
