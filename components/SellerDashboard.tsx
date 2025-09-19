import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Dimensions,
  SafeAreaView,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AlpasoApiService from '../services/AlpasoApiService';
import { useAuth } from '../App';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalStreams: number;
  totalViewers: number;
  totalRevenue: number;
  avgRating: number;
  todayStats: {
    streams: number;
    viewers: number;
    revenue: number;
  };
}

interface StreamMetrics {
  id: string;
  title: string;
  date: string;
  viewers: number;
  duration: string;
  sales: number;
  engagement: number;
  status: 'live' | 'scheduled' | 'ended';
}

interface SellerProduct {
  id: string;
  name: string;
  price: number;
  livePrice?: number;
  stock: number;
  sold: number;
  image: string;
  status: 'active' | 'inactive';
  description?: string;
  category?: string;
}

interface NewStreamData {
  title: string;
  description: string;
  category: string;
  scheduledTime: string;
  maxParticipants: number;
  isImmediate: boolean;
  selectedProducts: string[];
}

const STREAM_CATEGORIES = [
  { id: 'espresso-latte-art', label: 'Espresso & Latte Art' },
  { id: 'cold-brew-specialty-drinks', label: 'Cold Brew & Specialty Drinks' },
  { id: 'french-press-pour-over', label: 'French Press & Pour Over' },
  { id: 'brewing-techniques', label: 'Brewing Techniques' },
  { id: 'coffee-tasting-cupping', label: 'Coffee Tasting & Cupping' },
  { id: 'roasting-bean-selection', label: 'Roasting & Bean Selection' },
];

const SellerDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [streams, setStreams] = useState<StreamMetrics[]>([]);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewStreamModal, setShowNewStreamModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [creatingStream, setCreatingStream] = useState(false);

  // New stream form data
  const [newStreamData, setNewStreamData] = useState<NewStreamData>({
    title: '',
    description: '',
    category: 'espresso-latte-art',
    scheduledTime: '',
    maxParticipants: 100,
    isImmediate: true,
    selectedProducts: [],
  });

  const { user } = useAuth();

  const loadDashboardData = async () => {
    try {
      const [statsData, streamsData, productsData] = await Promise.all([
        AlpasoApiService.getSellerStats(),
        AlpasoApiService.getSellerStreams(),
        AlpasoApiService.getSellerProducts(),
      ]);

      setStats(statsData);
      setStreams(streamsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleCreateStream = () => {
    setShowNewStreamModal(true);
  };

  const handleManageProducts = () => {
    setShowProductModal(true);
  };

  const renderStatsCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsContent}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>{title}</Text>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
        <Text style={[styles.statsValue, { color }]}>{value}</Text>
      </View>
    </View>
  );

  const renderStreamItem = (stream: StreamMetrics) => (
    <TouchableOpacity key={stream.id} style={styles.streamItem}>
      <View style={styles.streamHeader}>
        <Text style={styles.streamTitle} numberOfLines={1}>
          {stream.title}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(stream.status) }]}>
          <Text style={styles.statusText}>{stream.status.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.streamMetrics}>
        <View style={styles.metricItem}>
          <Ionicons name="eye" size={16} color="#666" />
          <Text style={styles.metricText}>{stream.viewers}</Text>
        </View>
        <View style={styles.metricItem}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.metricText}>{stream.duration}</Text>
        </View>
        <View style={styles.metricItem}>
          <Ionicons name="card" size={16} color="#666" />
          <Text style={styles.metricText}>${stream.sales}</Text>
        </View>
      </View>
      <Text style={styles.streamDate}>{stream.date}</Text>
    </TouchableOpacity>
  );

  const renderProductItem = (product: SellerProduct) => (
    <TouchableOpacity key={product.id} style={styles.productItem}>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {product.name}
        </Text>
        <View style={styles.productMetrics}>
          <Text style={styles.productPrice}>${product.price}</Text>
          <Text style={styles.productStock}>Stock: {product.stock}</Text>
          <Text style={styles.productSold}>Vendidos: {product.sold}</Text>
        </View>
        <View style={[styles.productStatus, { backgroundColor: product.status === 'active' ? '#4CAF50' : '#f44336' }]}>
          <Text style={styles.productStatusText}>{product.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return '#f44336';
      case 'scheduled':
        return '#ff9800';
      case 'ended':
        return '#4CAF50';
      default:
        return '#666';
    }
  };

  const handleCreateStreamSubmit = async () => {
    setCreatingStream(true);
    try {
      // Aquí llamarías a tu servicio API para crear la transmisión
      // await AlpasoApiService.createStream(newStreamData);

      // Simulación de espera
      setTimeout(() => {
        setShowNewStreamModal(false);
        Alert.alert('Éxito', 'Transmisión creada exitosamente');
        loadDashboardData();
      }, 2000);
    } catch (error) {
      console.error('Error creating stream:', error);
      Alert.alert('Error', 'No se pudo crear la transmisión');
    } finally {
      setCreatingStream(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📊 Panel de Vendedor</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings" size={24} color="#8B4513" />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleCreateStream}>
            <Ionicons name="videocam" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Nueva Transmisión</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleManageProducts}>
            <Ionicons name="cube" size={20} color="#8B4513" />
            <Text style={styles.secondaryButtonText}>Gestionar Productos</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsGrid}>
            {renderStatsCard('Total Streams', stats.totalStreams, 'videocam', '#8B4513')}
            {renderStatsCard('Total Viewers', stats.totalViewers, 'people', '#4CAF50')}
            {renderStatsCard('Revenue', `$${stats.totalRevenue}`, 'card', '#2196F3')}
            {renderStatsCard('Rating', stats.avgRating.toFixed(1), 'star', '#ff9800')}
          </View>
        )}

        {/* Today's Stats */}
        {stats && (
          <View style={styles.todayStats}>
            <Text style={styles.sectionTitle}>📈 Estadísticas de Hoy</Text>
            <View style={styles.todayStatsGrid}>
              {renderStatsCard('Streams Hoy', stats.todayStats.streams, 'play', '#8B4513')}
              {renderStatsCard('Viewers Hoy', stats.todayStats.viewers, 'eye', '#4CAF50')}
              {renderStatsCard('Revenue Hoy', `$${stats.todayStats.revenue}`, 'cash', '#2196F3')}
            </View>
          </View>
        )}

        {/* Streams Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎥 Mis Transmisiones</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver Todas</Text>
            </TouchableOpacity>
          </View>
          {streams.length > 0 ? (
            streams.slice(0, 5).map(renderStreamItem)
          ) : (
            <Text style={styles.emptyText}>No tienes transmisiones aún</Text>
          )}
        </View>

        {/* Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📦 Mis Productos</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver Todos</Text>
            </TouchableOpacity>
          </View>
          {products.length > 0 ? (
            products.slice(0, 5).map(renderProductItem)
          ) : (
            <Text style={styles.emptyText}>No tienes productos registrados</Text>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <Modal visible={showNewStreamModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nueva Transmisión</Text>
            <TouchableOpacity onPress={() => setShowNewStreamModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            {/* Formulario de nueva transmisión - Versión simplificada móvil */}

            {/* Título */}
            <TextInput
              style={styles.input}
              placeholder="Título de la transmisión"
              value={newStreamData.title}
              onChangeText={(text) => setNewStreamData({ ...newStreamData, title: text })}
            />

            {/* Categoría */}
            <View style={styles.row}>
              <Text style={styles.label}>Categoría</Text>
              <View style={styles.selectContainer}>
                {STREAM_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      newStreamData.category === category.id && styles.categoryButtonSelected,
                    ]}
                    onPress={() => setNewStreamData({ ...newStreamData, category: category.id })}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        newStreamData.category === category.id && styles.categoryButtonTextSelected,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Botón Agregar Productos */}
            <View style={styles.productSection}>
              <Text style={styles.label}>Productos</Text>
              <TouchableOpacity
                style={styles.addProductButton}
                onPress={() => {
                  Alert.alert('Seleccionar Productos', 'Aquí iría el selector de productos');
                }}
              >
                <Ionicons name="add-circle" size={20} color="#4CAF50" />
                <Text style={styles.addProductButtonText}>Agregar Productos</Text>
              </TouchableOpacity>

              {/* Productos seleccionados */}
              <View style={styles.selectedProductsContainer}>
                {newStreamData.selectedProducts.length === 0 ? (
                  <Text style={styles.emptyProductsText}>No hay productos seleccionados</Text>
                ) : (
                  newStreamData.selectedProducts.map((productId) => {
                    const product = products.find((p) => p.id === productId);
                    return (
                      product && (
                        <View key={product.id} style={styles.selectedProduct}>
                          <Text style={styles.selectedProductText}>{product.name}</Text>
                          <TouchableOpacity
                            style={styles.removeProductButton}
                            onPress={() =>
                              setNewStreamData({
                                ...newStreamData,
                                selectedProducts: newStreamData.selectedProducts.filter((id) => id !== productId),
                              })
                            }
                          >
                            <Ionicons name="close-circle" size={16} color="#f44336" />
                          </TouchableOpacity>
                        </View>
                      )
                    );
                  })
                )}
              </View>
            </View>

            {/* Descripción - OCULTO */}
            {/* <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descripción de la transmisión"
              value={newStreamData.description}
              onChangeText={(text) => setNewStreamData({ ...newStreamData, description: text })}
              multiline
              numberOfLines={3}
            /> */}

            {/* Hora programada - OCULTO */}
            {/* <TextInput
              style={styles.input}
              placeholder="Hora programada (YYYY-MM-DD HH:mm)"
              value={newStreamData.scheduledTime}
              onChangeText={(text) => setNewStreamData({ ...newStreamData, scheduledTime: text })}
            /> */}

            {/* Máximo de participantes - OCULTO */}
            {/* <View style={styles.row}>
              <Text style={styles.label}>Máx. Participantes</Text>
              <TextInput
                style={styles.inputSmall}
                placeholder="100"
                keyboardType="numeric"
                value={String(newStreamData.maxParticipants)}
                onChangeText={(text) => setNewStreamData({ ...newStreamData, maxParticipants: Number(text) || 100 })}
              />
            </View> */}

            {/* Botón Crear */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateStreamSubmit}
              disabled={creatingStream || !newStreamData.title.trim()}
            >
              {creatingStream ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Crear Transmisión</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showProductModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Gestionar Productos</Text>
            <TouchableOpacity onPress={() => setShowProductModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          {/* Aquí iría el formulario de gestión de productos */}
          <Text style={styles.modalContent}>Formulario para gestionar productos</Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  settingsButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#8B4513',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B4513',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#8B4513',
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    width: (width - 44) / 2, // 2 columns with gaps
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsContent: {
    flex: 1,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  todayStats: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  todayStatsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#8B4513',
    fontWeight: '500',
  },
  streamItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  streamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  streamTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  streamMetrics: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: '#666',
  },
  streamDate: {
    fontSize: 12,
    color: '#999',
  },
  productItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  productMetrics: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  productStock: {
    fontSize: 12,
    color: '#666',
  },
  productSold: {
    fontSize: 12,
    color: '#4CAF50',
  },
  productStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 32,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    color: '#666',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    width: '100%',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputSmall: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    width: '40%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 8,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  categoryButtonSelected: {
    backgroundColor: '#8B4513',
  },
  categoryButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  productSection: {
    marginBottom: 16,
    width: '100%',
  },
  selectedProductsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  selectedProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selectedProductText: {
    color: '#2e7d32',
    fontWeight: '500',
    marginRight: 8,
  },
  removeProductButton: {
    padding: 4,
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f0fe',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    justifyContent: 'center',
  },
  addProductButtonText: {
    color: '#1e88e5',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#8B4513',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SellerDashboard;
