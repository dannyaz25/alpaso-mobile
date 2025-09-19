import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, FlatList, RefreshControl, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AlpasoApiService from './services/AlpasoApiService';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import UserProfileScreen from './components/UserProfileScreen';
import SellerDashboard from './components/SellerDashboard';
import NewStreamModal from './components/NewStreamModal';
import LiveScreen from './components/LiveScreen';
import LiveStreamScreen from './components/LiveStreamScreen';
import StreamingVideoPlayer from './components/StreamingVideoPlayer';

// Screens Components
function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Bienvenido a Alpaso Coffee</Text>
          <Text style={styles.heroSubtitle}>
            Descubre el mundo del café premium con transmisiones en vivo,
            productos artesanales y workshops exclusivos
          </Text>

          <View style={styles.ctaButtons}>
            <TouchableOpacity style={styles.ctaButton}>
              <Ionicons name="play-circle" size={20} color="white" />
              <Text style={styles.ctaButtonText}>Ver Transmisión en Vivo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.ctaButton, styles.ctaButtonSecondary]}>
              <Ionicons name="bag" size={20} color="#8B4513" />
              <Text style={[styles.ctaButtonText, styles.ctaButtonTextSecondary]}>
                Explorar Catálogo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="cafe" size={24} color="white" />
            </View>
            <Text style={styles.featureTitle}>Café Premium</Text>
            <Text style={styles.featureDescription}>
              Selecciones cuidadosamente elegidas de los mejores granos
              de café del mundo, tostados a la perfección.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="videocam" size={24} color="white" />
            </View>
            <Text style={styles.featureTitle}>Transmisiones en Vivo</Text>
            <Text style={styles.featureDescription}>
              Únete a nuestros baristas expertos en sesiones en vivo
              y aprende técnicas de preparación mientras compras.
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="people" size={24} color="white" />
            </View>
            <Text style={styles.featureTitle}>Workshops Exclusivos</Text>
            <Text style={styles.featureDescription}>
              Mejora tus habilidades cafeteras con nuestros workshops
              presenciales y aprende de los mejores profesionales.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


function CatalogScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = async () => {
    try {
      const data = await AlpasoApiService.getProducts();
      setProducts(data.products || []);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los productos');
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const renderProductItem = ({ item }) => (
    <TouchableOpacity style={styles.productCard}>
      <View style={styles.productImage}>
        <Ionicons name="cafe" size={40} color="#8B4513" />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.price}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description || 'Producto de alta calidad'}
        </Text>
        <TouchableOpacity style={styles.addToCartButton}>
          <Ionicons name="cart" size={16} color="white" />
          <Text style={styles.addToCartText}>Agregar al Carrito</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>☕ Catálogo de Productos</Text>
        <TouchableOpacity style={styles.cartButton}>
          <Ionicons name="cart" size={24} color="#8B4513" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Cargando productos...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item._id || item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.productsList}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cafe-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No hay productos disponibles</Text>
              <Text style={styles.emptySubtext}>¡Próximamente tendremos café increíble!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// Auth Context para manejar el estado de autenticación
const AuthContext = React.createContext({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

// Hook para usar el contexto de autenticación - EXPORTADO
export function useAuth() {
  return React.useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isAuth = await AlpasoApiService.isAuthenticated();
      if (isAuth) {
        const profile = await AlpasoApiService.getUserProfile();
        setUser(profile.user);
      }
    } catch (error) {
      console.log('No authenticated user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await AlpasoApiService.login(email, password);
      if (response.user) {
        setUser(response.user);
        return true;
      }
    } catch (error) {
      throw error;
    }
    return false;
  };

  const logout = async () => {
    await AlpasoApiService.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


// Componente de perfil mejorado
function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', onPress: logout },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.profileContent}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#8B4513" />
          </View>
          <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.userTypeBadge}>
            <Text style={styles.userTypeText}>
              {user?.userType === 'seller' ? '👨‍💼 Vendedor' : '🛍️ Comprador'}
            </Text>
          </View>
        </View>

        <View style={styles.profileOptions}>
          <TouchableOpacity style={styles.profileOption}>
            <Ionicons name="person-circle" size={24} color="#8B4513" />
            <Text style={styles.profileOptionText}>Editar Perfil</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileOption}>
            <Ionicons name="bag" size={24} color="#8B4513" />
            <Text style={styles.profileOptionText}>Mis Pedidos</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileOption}>
            <Ionicons name="heart" size={24} color="#8B4513" />
            <Text style={styles.profileOptionText}>Favoritos</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileOption}>
            <Ionicons name="settings" size={24} color="#8B4513" />
            <Text style={styles.profileOptionText}>Configuración</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileOption}>
            <Ionicons name="help-circle" size={24} color="#8B4513" />
            <Text style={styles.profileOptionText}>Ayuda y Soporte</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.profileOption, styles.logoutOption]} onPress={handleLogout}>
            <Ionicons name="log-out" size={24} color="#f44336" />
            <Text style={[styles.profileOptionText, styles.logoutText]}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Navegador principal
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator para las pantallas de streaming
function StreamStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LiveList" component={LiveScreen} />
      <Stack.Screen name="LiveStreamScreen" component={LiveStreamScreen} />
      <Stack.Screen name="StreamPlayer" component={LiveStreamScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { user } = useAuth();
  const isSeller = user?.userType === 'seller' || user?.role === 'instructor';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Live') {
            iconName = focused ? 'videocam' : 'videocam-outline';
          } else if (route.name === 'Catalog') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'SellerDashboard') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8B4513',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Live" component={StreamStack} options={{ title: 'En Vivo' }} />
      <Tab.Screen name="Catalog" component={CatalogScreen} options={{ title: 'Catálogo' }} />
      {isSeller && (
        <Tab.Screen
          name="SellerDashboard"
          component={SellerDashboard}
          options={{ title: 'Dashboard' }}
        />
      )}
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <AuthNavigator />
        </NavigationContainer>
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AuthNavigator() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <MainTabs /> : <AuthStack />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  heroSection: {
    backgroundColor: '#8B4513',
    borderRadius: 20,
    padding: 32,
    marginBottom: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.9,
    lineHeight: 22,
  },
  ctaButtons: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'white',
    gap: 8,
  },
  ctaButtonSecondary: {
    backgroundColor: 'white',
  },
  ctaButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  ctaButtonTextSecondary: {
    color: '#8B4513',
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featureIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#8B4513',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  profileContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  actionButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Stream styles
  streamsList: {
    padding: 16,
  },
  streamCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  streamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveIndicator: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewerCount: {
    color: '#666',
    fontSize: 12,
  },
  streamTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  streamDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  streamSeller: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: '500',
  },
  streamFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  streamTags: {
    flexDirection: 'row',
    gap: 4,
  },
  tag: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#333',
  },
  joinButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  joinButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Product styles
  productsList: {
    padding: 16,
  },
  productCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  addToCartButton: {
    backgroundColor: '#8B4513',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Profile styles
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  userTypeBadge: {
    backgroundColor: '#e0f7fa',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  userTypeText: {
    fontSize: 14,
    color: '#00796b',
    fontWeight: '500',
  },
  profileOptions: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileOptionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  logoutOption: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 16,
  },
  logoutText: {
    color: '#f44336',
  },
  // Loading and Empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  refreshButton: {
    padding: 8,
  },
  cartButton: {
    padding: 8,
  },
});
