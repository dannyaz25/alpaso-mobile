import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración para conectar desde móvil a tu computadora
const API_BASE_URL = 'http://192.168.1.33:5003'; // Tu IP local + puerto del backend

class AlpasoApiService {
  private token: string | null = null;

  constructor() {
    this.loadToken();
  }

  private async loadToken() {
    try {
      this.token = await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error loading token:', error);
    }
  }

  private async saveToken(token: string) {
    try {
      await AsyncStorage.setItem('auth_token', token);
      this.token = token;
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };
  }

  // Streams API
  async getLiveStreams() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/streams/live`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching live streams:', error);
      throw error;
    }
  }

  async getAllStreams() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/streams`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all streams:', error);
      throw error;
    }
  }

  async getStreamById(streamId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/streams/${streamId}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching stream:', error);
      throw error;
    }
  }

  async createStream(streamData: {
    title: string;
    description: string;
    category: string;
    scheduledTime?: string;
    maxParticipants: number;
    products: string[];
  }) {
    try {
      console.log('🚀 Creating stream with data:', streamData);

      const payload = {
        title: streamData.title,
        description: streamData.description,
        category: streamData.category,
        scheduledTime: streamData.scheduledTime || null,
        maxParticipants: streamData.maxParticipants,
        products: streamData.products || [],
      };

      const response = await axios.post(`${API_BASE_URL}/api/streams`, payload, {
        headers: this.getHeaders(),
      });

      console.log('✅ Stream created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating stream:', error);
      throw error;
    }
  }

  async startStream(streamId: string) {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/streams/${streamId}/start`, {}, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error starting stream:', error);
      throw error;
    }
  }

  async endStream(streamId: string) {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/streams/${streamId}/end`, {}, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error ending stream:', error);
      throw error;
    }
  }

  // Products API
  async getProducts() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  async getProductById(productId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products/${productId}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  // Auth API
  async login(email: string, password: string) {
    try {
      console.log('🔐 Intentando login con:', { email, API_BASE_URL });
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      console.log('📥 Respuesta del backend:', response.data);

      if (response.data.token && response.data.user) {
        await this.saveToken(response.data.token);
        console.log('✅ Token guardado exitosamente');
        console.log('👤 Usuario recibido del backend:', response.data.user);

        return {
          success: true,
          user: response.data.user, // Usar directamente el usuario del backend
          token: response.data.token,
          message: response.data.message || 'Login exitoso'
        };
      } else {
        console.error('❌ No se recibió token o usuario en la respuesta');
        console.error('📦 Respuesta completa:', response.data);
        throw new Error('Respuesta incompleta del servidor');
      }
    } catch (error: any) {
      console.error('❌ Error during login:', error);
      if (error.response) {
        console.error('📥 Error response:', error.response.data);
        throw new Error(error.response.data.message || 'Credenciales incorrectas');
      }
      throw new Error('Error de conexión. Verifica tu internet.');
    }
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    userType: string;
  }) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, userData);

      if (response.data.token) {
        await this.saveToken(response.data.token);
      }

      return response.data;
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  }

  async getUserProfile() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await AsyncStorage.removeItem('auth_token');
      this.token = null;
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  // Seller Dashboard API
  async getSellerStats() {
    try {
      const [streamsResponse, analyticsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/streams/seller/my-streams`, {
          headers: this.getHeaders(),
        }),
        axios.get(`${API_BASE_URL}/api/streams/analytics/summary`, {
          headers: this.getHeaders(),
        }).catch(() => ({ data: {} })) // Fallback si no existe la ruta
      ]);

      const streams = streamsResponse.data.streams || [];

      // Calcular estadísticas basadas en datos reales
      const totalStreams = streams.length;
      const totalViewers = streams.reduce((sum: number, stream: any) =>
        sum + (stream.currentParticipants || 0), 0);
      const totalRevenue = analyticsResponse.data?.totalRevenue ||
        streams.reduce((sum: number, stream: any) => sum + (stream.metrics?.revenue || 0), 0);
      const avgRating = analyticsResponse.data?.avgRating || 4.5;

      // Estadísticas del día actual
      const today = new Date().toISOString().split('T')[0];
      const todayStreams = streams.filter((stream: any) =>
        stream.startTime && stream.startTime.startsWith(today)
      );

      const todayStats = {
        streams: todayStreams.length,
        viewers: todayStreams.reduce((sum: number, stream: any) =>
          sum + (stream.currentParticipants || 0), 0),
        revenue: todayStreams.reduce((sum: number, stream: any) =>
          sum + (stream.metrics?.revenue || 0), 0)
      };

      return {
        totalStreams,
        totalViewers,
        totalRevenue,
        avgRating,
        todayStats
      };
    } catch (error) {
      console.error('Error fetching seller stats:', error);
      // Retornar datos mock si falla
      return {
        totalStreams: 0,
        totalViewers: 0,
        totalRevenue: 0,
        avgRating: 0,
        todayStats: {
          streams: 0,
          viewers: 0,
          revenue: 0
        }
      };
    }
  }

  async getSellerStreams() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/streams/seller/my-streams`, {
        headers: this.getHeaders(),
      });

      const streams = response.data.streams || [];

      return streams.map((stream: any) => ({
        id: stream._id || stream.id,
        title: stream.title,
        date: stream.startedAt ? new Date(stream.startedAt).toLocaleDateString() :
              stream.createdAt ? new Date(stream.createdAt).toLocaleDateString() : '',
        viewers: stream.currentParticipants || 0,
        duration: this.calculateDuration(stream.startedAt, stream.endedAt),
        sales: stream.metrics?.revenue || 0,
        engagement: stream.metrics?.engagement || 0,
        status: stream.status
      }));
    } catch (error) {
      console.error('Error fetching seller streams:', error);
      return [];
    }
  }

  async getSellerProducts() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products/seller/my-products`, {
        headers: this.getHeaders(),
      });

      return response.data.products || [];
    } catch (error) {
      console.error('Error fetching seller products:', error);
      // Retornar productos mock para desarrollo
      return [
        {
          id: '1',
          name: 'Café Premium Colombiano',
          price: 25.99,
          livePrice: 22.99,
          stock: 50,
          sold: 15,
          image: '',
          status: 'active',
          description: 'Café premium de origen colombiano',
          category: 'coffee'
        },
        {
          id: '2',
          name: 'Espresso Blend',
          price: 28.99,
          livePrice: 25.99,
          stock: 30,
          sold: 8,
          image: '',
          status: 'active',
          description: 'Mezcla perfecta para espresso',
          category: 'coffee'
        }
      ];
    }
  }

  async createProduct(productData: {
    name: string;
    price: number;
    description: string;
    category: string;
    stock: number;
    image?: string;
  }) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/products`, productData, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(productId: string, productData: any) {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/products/${productId}`, productData, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(productId: string) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/products/${productId}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Helper methods
  private calculateDuration(startTime?: string, endTime?: string): string {
    if (!startTime) return '0m';

    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  }

  // Method to check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    await this.loadToken();
    return !!this.token;
  }

  // Method to get current user role
  async getUserRole(): Promise<string | null> {
    try {
      const profile = await this.getUserProfile();
      return profile.user?.role || profile.user?.userType || null;
    } catch (error) {
      return null;
    }
  }
}

export default new AlpasoApiService();
