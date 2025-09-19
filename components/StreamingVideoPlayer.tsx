import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  TextInput,
  FlatList,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import AlpasoApiService from '../services/AlpasoApiService';

const { width, height } = Dimensions.get('window');

interface StreamingVideoPlayerProps {
  streamId: string;
  isHost?: boolean;
  onError?: (error: any) => void;
  onStreamEnd?: () => void;
}

const StreamingVideoPlayer: React.FC<StreamingVideoPlayerProps> = ({
  streamId,
  isHost = false,
  onError,
  onStreamEnd,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamData, setStreamData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    loadStreamData();
  }, [streamId]);

  const loadStreamData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎥 [MOBILE] Loading stream data for:', streamId);

      // Obtener datos del stream desde el backend
      const response = await AlpasoApiService.getStream(streamId);
      console.log('📱 [MOBILE] Stream data loaded:', response);

      if (response.success && response.stream) {
        setStreamData(response.stream);
        setViewerCount(response.stream.currentParticipants || 0);

        // Si es host, verificar que el token de acceso esté disponible
        if (isHost && response.accessToken) {
          console.log('🎯 [MOBILE] Host mode - access token received');
        }

        setIsConnected(true);
      } else {
        throw new Error('No se pudieron cargar los datos del stream');
      }
    } catch (err: any) {
      console.error('❌ [MOBILE] Error loading stream:', err);
      const errorMessage = err.message || 'Error desconocido al cargar el stream';
      setError(errorMessage);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  const generateDailyWebViewHTML = () => {
    const roomUrl = streamData?.roomUrl || '';
    const token = streamData?.accessToken || '';
    const userName = isHost ? 'Host' : 'Viewer';

    // HTML optimizado para móvil con Daily.co
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>Alpaso Live Stream</title>
          <script src="https://unpkg.com/@daily-co/daily-js"></script>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #000;
              overflow: hidden;
            }
            #daily-container {
              width: 100vw;
              height: 100vh;
              position: relative;
            }
            #daily-iframe {
              width: 100%;
              height: 100%;
              border: none;
            }
            .loading {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              color: white;
              text-align: center;
            }
            .error {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              color: #ff6b6b;
              text-align: center;
              padding: 20px;
              background: rgba(0,0,0,0.8);
              border-radius: 10px;
            }
            .controls {
              position: absolute;
              bottom: 20px;
              left: 50%;
              transform: translateX(-50%);
              display: flex;
              gap: 10px;
              background: rgba(0,0,0,0.7);
              padding: 10px;
              border-radius: 25px;
            }
            .control-btn {
              width: 44px;
              height: 44px;
              border-radius: 22px;
              border: none;
              background: #8B4513;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              font-size: 18px;
            }
            .control-btn:hover {
              background: #a0552a;
            }
            .stats {
              position: absolute;
              top: 20px;
              right: 20px;
              background: rgba(0,0,0,0.7);
              color: white;
              padding: 8px 12px;
              border-radius: 15px;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div id="daily-container">
            <div class="loading" id="loading">
              <div>🔄 Conectando al stream...</div>
              <div style="font-size: 12px; margin-top: 10px;">Alpaso Live</div>
            </div>

            <div class="stats" id="stats" style="display: none;">
              👥 <span id="participant-count">0</span> espectadores
            </div>

            ${isHost ? `
            <div class="controls" id="controls" style="display: none;">
              <button class="control-btn" id="toggle-camera" title="Cámara">📹</button>
              <button class="control-btn" id="toggle-mic" title="Micrófono">🎤</button>
              <button class="control-btn" id="end-stream" title="Terminar" style="background: #ff4444;">⏹️</button>
            </div>
            ` : ''}
          </div>

          <script>
            console.log('🚀 [MOBILE DAILY] Starting Daily.co initialization...');

            let call = null;
            let isHost = ${isHost};
            let isCameraOn = true;
            let isMicOn = true;

            async function initializeDaily() {
              try {
                console.log('📱 [MOBILE DAILY] Creating call object...');

                const roomUrl = '${roomUrl}';
                const token = '${token}';

                if (!roomUrl) {
                  throw new Error('Room URL no disponible');
                }

                // Configuración optimizada para móvil
                call = window.DailyIframe.createCallObject({
                  iframeStyle: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    zIndex: 1
                  },
                  showLeaveButton: false,
                  showFullscreenButton: false,
                  theme: {
                    accent: '#8B4513',
                    accentText: '#FFFFFF',
                    background: '#000000',
                    backgroundAccent: '#1a1a1a',
                    baseText: '#FFFFFF',
                    border: '#333333',
                    mainAreaBg: '#000000',
                    mainAreaBgAccent: '#1a1a1a',
                    mainAreaText: '#FFFFFF',
                    supportiveText: '#cccccc'
                  }
                });

                console.log('🔗 [MOBILE DAILY] Joining room:', roomUrl);

                const joinConfig = {
                  url: roomUrl,
                  userName: '${userName}',
                  startVideoOff: !isHost,
                  startAudioOff: !isHost
                };

                if (token && isHost) {
                  joinConfig.token = token;
                }

                // Event listeners
                call.on('joined-meeting', () => {
                  console.log('✅ [MOBILE DAILY] Successfully joined meeting');
                  hideLoading();
                  showStats();
                  if (isHost) showControls();
                  notifyReactNative('joined', { isHost });
                });

                call.on('participant-joined', (event) => {
                  console.log('👤 [MOBILE DAILY] Participant joined:', event);
                  updateParticipantCount();
                });

                call.on('participant-left', (event) => {
                  console.log('👋 [MOBILE DAILY] Participant left:', event);
                  updateParticipantCount();
                });

                call.on('error', (event) => {
                  console.error('❌ [MOBILE DAILY] Call error:', event);
                  showError('Error en la transmisión: ' + (event.errorMsg || 'Error desconocido'));
                  notifyReactNative('error', event);
                });

                call.on('left-meeting', () => {
                  console.log('📤 [MOBILE DAILY] Left meeting');
                  notifyReactNative('left', {});
                });

                // Unirse al call
                await call.join(joinConfig);

                // Setup controls para hosts
                if (isHost) {
                  setupHostControls();
                }

              } catch (error) {
                console.error('❌ [MOBILE DAILY] Initialization error:', error);
                showError('No se pudo conectar: ' + error.message);
                notifyReactNative('error', { message: error.message });
              }
            }

            function hideLoading() {
              const loading = document.getElementById('loading');
              if (loading) loading.style.display = 'none';
            }

            function showStats() {
              const stats = document.getElementById('stats');
              if (stats) stats.style.display = 'block';
              updateParticipantCount();
            }

            function showControls() {
              const controls = document.getElementById('controls');
              if (controls) controls.style.display = 'flex';
            }

            function showError(message) {
              hideLoading();
              const container = document.getElementById('daily-container');
              container.innerHTML = \`
                <div class="error">
                  <div style="font-size: 18px; margin-bottom: 10px;">⚠️ Error</div>
                  <div>\${message}</div>
                  <button onclick="location.reload()" style="
                    margin-top: 15px;
                    padding: 10px 20px;
                    background: #8B4513;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                  ">Reintentar</button>
                </div>
              \`;
            }

            function updateParticipantCount() {
              if (call) {
                const participants = call.participants();
                const count = Object.keys(participants).length;
                const countElement = document.getElementById('participant-count');
                if (countElement) {
                  countElement.textContent = count;
                }
                notifyReactNative('participantCount', { count });
              }
            }

            function setupHostControls() {
              const toggleCamera = document.getElementById('toggle-camera');
              const toggleMic = document.getElementById('toggle-mic');
              const endStream = document.getElementById('end-stream');

              if (toggleCamera) {
                toggleCamera.addEventListener('click', async () => {
                  try {
                    isCameraOn = !isCameraOn;
                    await call.setLocalVideo(isCameraOn);
                    toggleCamera.textContent = isCameraOn ? '📹' : '📹🚫';
                    notifyReactNative('cameraToggled', { isOn: isCameraOn });
                  } catch (error) {
                    console.error('Error toggling camera:', error);
                  }
                });
              }

              if (toggleMic) {
                toggleMic.addEventListener('click', async () => {
                  try {
                    isMicOn = !isMicOn;
                    await call.setLocalAudio(isMicOn);
                    toggleMic.textContent = isMicOn ? '🎤' : '🎤🚫';
                    notifyReactNative('micToggled', { isOn: isMicOn });
                  } catch (error) {
                    console.error('Error toggling microphone:', error);
                  }
                });
              }

              if (endStream) {
                endStream.addEventListener('click', () => {
                  if (confirm('¿Estás seguro de que quieres terminar la transmisión?')) {
                    call.leave();
                    notifyReactNative('streamEnded', {});
                  }
                });
              }
            }

            function notifyReactNative(event, data) {
              try {
                window.ReactNativeWebView?.postMessage(JSON.stringify({
                  type: 'dailyEvent',
                  event: event,
                  data: data
                }));
              } catch (error) {
                console.error('Error notifying React Native:', error);
              }
            }

            // Initialize when page loads
            document.addEventListener('DOMContentLoaded', initializeDaily);

            // Also initialize immediately in case DOMContentLoaded already fired
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', initializeDaily);
            } else {
              initializeDaily();
            }
          </script>
        </body>
      </html>
    `;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('📱 [MOBILE] WebView message:', message);

      if (message.type === 'dailyEvent') {
        switch (message.event) {
          case 'joined':
            setIsConnected(true);
            setError(null);
            break;
          case 'participantCount':
            setViewerCount(message.data.count);
            break;
          case 'error':
            setError(message.data.message || 'Error en la transmisión');
            onError?.(message.data);
            break;
          case 'streamEnded':
            onStreamEnd?.();
            break;
          case 'left':
            setIsConnected(false);
            break;
          case 'cameraToggled':
            setIsVideoOn(message.data.isOn);
            break;
          case 'micToggled':
            setIsMuted(!message.data.isOn);
            break;
        }
      }
    } catch (err) {
      console.error('Error parsing WebView message:', err);
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;

    try {
      // Aquí enviarías el mensaje al backend para distribuir en el chat
      const newMessage = {
        id: Date.now().toString(),
        text: chatMessage,
        sender: isHost ? 'Host' : 'Viewer',
        timestamp: new Date().toISOString(),
      };

      setChatMessages(prev => [...prev, newMessage]);
      setChatMessage('');

      // Notificar al WebView si es necesario
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'chatMessage',
        message: newMessage
      }));

    } catch (error) {
      console.error('Error sending chat message:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    }
  };

  const renderChatMessage = ({ item }: { item: any }) => (
    <View style={styles.chatMessage}>
      <Text style={styles.chatSender}>{item.sender}</Text>
      <Text style={styles.chatText}>{item.text}</Text>
      <Text style={styles.chatTime}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Cargando transmisión...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#ff6b6b" />
        <Text style={styles.errorTitle}>Error en la transmisión</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStreamData}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Video Player */}
      <View style={styles.videoContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: generateDailyWebViewHTML() }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error:', nativeEvent);
            setError('Error al cargar el reproductor de video');
          }}
          onLoadStart={() => console.log('🔄 [MOBILE] WebView loading started')}
          onLoadEnd={() => console.log('✅ [MOBILE] WebView loading completed')}
        />

        {/* Stream Info Overlay */}
        <View style={styles.streamInfo}>
          <View style={styles.liveIndicator}>
            <Text style={styles.liveText}>🔴 EN VIVO</Text>
          </View>
          <View style={styles.viewerCount}>
            <Ionicons name="eye" size={16} color="white" />
            <Text style={styles.viewerCountText}>{viewerCount}</Text>
          </View>
        </View>

        {/* Mobile Controls */}
        <View style={styles.mobileControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowChat(!showChat)}
          >
            <Ionicons name="chatbubble" size={24} color="white" />
          </TouchableOpacity>

          {isHost && (
            <>
              <TouchableOpacity style={styles.controlButton}>
                <Ionicons name="people" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.controlButton}>
                <Ionicons name="settings" size={24} color="white" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Chat Panel */}
      {showChat && (
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Chat en vivo</Text>
            <TouchableOpacity onPress={() => setShowChat(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={chatMessages}
            renderItem={renderChatMessage}
            keyExtractor={(item) => item.id}
            style={styles.chatMessages}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.chatInput}>
            <TextInput
              style={styles.chatTextInput}
              value={chatMessage}
              onChangeText={setChatMessage}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !chatMessage.trim() && styles.sendButtonDisabled]}
              onPress={sendChatMessage}
              disabled={!chatMessage.trim()}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Stream Details */}
      {streamData && (
        <ScrollView style={styles.streamDetails}>
          <Text style={styles.streamTitle}>{streamData.title}</Text>
          <Text style={styles.streamDescription}>{streamData.description}</Text>

          {streamData.products && streamData.products.length > 0 && (
            <View style={styles.productsSection}>
              <Text style={styles.sectionTitle}>Productos destacados</Text>
              {streamData.products.map((product: any, index: number) => (
                <TouchableOpacity key={index} style={styles.productCard}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>${product.price}</Text>
                  </View>
                  <TouchableOpacity style={styles.buyButton}>
                    <Text style={styles.buyButtonText}>Comprar</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 32,
  },
  errorTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    color: '#ccc',
    fontSize: 16,
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
  videoContainer: {
    height: height * 0.4, // 40% de la pantalla para el video
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  streamInfo: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveIndicator: {
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  liveText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewerCount: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewerCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mobileControls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'column',
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chatMessages: {
    flex: 1,
    padding: 16,
  },
  chatMessage: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  chatSender: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 4,
  },
  chatText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  chatTime: {
    fontSize: 10,
    color: '#999',
  },
  chatInput: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-end',
  },
  chatTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  streamDetails: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  streamTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    padding: 16,
    paddingBottom: 8,
  },
  streamDescription: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 16,
    paddingBottom: 16,
    lineHeight: 22,
  },
  productsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  buyButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default StreamingVideoPlayer;
