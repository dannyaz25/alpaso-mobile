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

function LiveScreen() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStreams = async () => {
    try {
      const data = await AlpasoApiService.getLiveStreams();
      setStreams(data.streams || []);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las transmisiones en vivo');
      console.error('Error loading streams:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStreams();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStreams();
  };

  const renderStreamItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.streamCard}>
      <View style={styles.streamHeader}>
        <View style={styles.liveIndicator}>
          <Text style={styles.liveText}>EN VIVO</Text>
        </View>
        <Text style={styles.viewerCount}>{item.currentParticipants} espectadores</Text>
      </View>
      <Text style={styles.streamTitle}>{item.title}</Text>
      <Text style={styles.streamDescription}>{item.description}</Text>
      <Text style={styles.streamSeller}>Por: {item.sellerName}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text>Cargando transmisiones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {streams.length > 0 ? (
        <FlatList
          data={streams}
          renderItem={renderStreamItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.streamsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.centerContent}>
          <Ionicons name="videocam-outline" size={64} color="#8B4513" />
          <Text style={styles.sectionTitle}>No hay transmisiones activas</Text>
          <Text style={styles.sectionDescription}>
            Las transmisiones en vivo aparecerán aquí cuando estén disponibles
          </Text>
          <TouchableOpacity style={styles.actionButton} onPress={onRefresh}>
            <Text style={styles.actionButtonText}>Actualizar</Text>
          </TouchableOpacity>
        </View>
      )}
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

  const addToCart = async (productId: string) => {
    try {
      await AlpasoApiService.addToCart(productId);
      Alert.alert('Éxito', 'Producto agregado al carrito');
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar al carrito');
    }
  };

  const renderProductItem = ({ item }: { item: any }) => (
    <View style={styles.productCard}>
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>${item.price}</Text>
      <Text style={styles.productDescription}>{item.description}</Text>
      <TouchableOpacity
        style={styles.addToCartButton}
        onPress={() => addToCart(item._id)}
      >
        <Text style={styles.addToCartText}>Agregar al Carrito</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text>Cargando productos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {products.length > 0 ? (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.productsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.centerContent}>
          <Ionicons name="storefront-outline" size={64} color="#8B4513" />
          <Text style={styles.sectionTitle}>Catálogo no disponible</Text>
          <Text style={styles.sectionDescription}>
            Los productos aparecerán aquí cuando estén disponibles
          </Text>
          <TouchableOpacity style={styles.actionButton} onPress={onRefresh}>
            <Text style={styles.actionButtonText}>Actualizar</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = AlpasoApiService.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const userData = await AlpasoApiService.getUserProfile();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleRegisterSuccess = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthScreen('login');
  };

  const handleUserUpdate = (updatedUser: any) => {
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If user is authenticated, show profile screen
  if (isAuthenticated && user) {
    return (
      <SafeAreaView style={styles.container}>
        <UserProfileScreen
          user={user}
          onLogout={handleLogout}
          onUserUpdate={handleUserUpdate}
        />
      </SafeAreaView>
    );
  }

  // If not authenticated, show login or register screen
  return (
    <SafeAreaView style={styles.container}>
      {authScreen === 'login' ? (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setAuthScreen('register')}
        />
      ) : (
        <RegisterScreen
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setAuthScreen('login')}
        />
      )}
    </SafeAreaView>
  );
}

// Navigation Setup
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Inicio') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'En Vivo') {
            iconName = focused ? 'videocam' : 'videocam-outline';
          } else if (route.name === 'Catálogo') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8B4513',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#8B4513',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="En Vivo" component={LiveScreen} />
      <Tab.Screen name="Catálogo" component={CatalogScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
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
});
