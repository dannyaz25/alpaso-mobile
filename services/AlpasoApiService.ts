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
      console.error('Error fetching streams:', error);
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

  // Auth API con manejo mejorado de errores
  async login(email: string, password: string) {
    try {
      console.log('🔐 Intentando login con:', { email, API_BASE_URL });

      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      }, {
        timeout: 10000, // 10 segundos de timeout
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('✅ Respuesta del login:', response.data);

      // El backend devuelve { message: "Login successful", token, user }
      if (response.data.message === 'Login successful' && response.data.token) {
        await this.saveToken(response.data.token);
        return {
          success: true,
          token: response.data.token,
          user: response.data.user,
          message: response.data.message
        };
      } else {
        return { success: false, message: response.data.message || 'Credenciales incorrectas' };
      }
    } catch (error: any) {
      console.error('❌ Error during login:', error);

      // Manejo específico de errores de red
      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
        throw new Error('No se puede conectar al servidor. Verifica tu conexión.');
      } else if (error.response?.status === 401) {
        throw new Error('Credenciales incorrectas');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Error al iniciar sesión. Intenta de nuevo.');
      }
    }
  }

  async register(userData: any) {
    try {
      console.log('📝 Intentando registro con:', { email: userData.email, API_BASE_URL });

      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, userData, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('✅ Respuesta del registro:', response.data);

      if (response.data.token) {
        await this.saveToken(response.data.token);
        return { success: true, ...response.data };
      } else if (response.data.success) {
        return { success: true, ...response.data };
      } else {
        return { success: false, message: response.data.message || 'Error al crear la cuenta' };
      }
    } catch (error: any) {
      console.error('❌ Error during registration:', error);

      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
        throw new Error('No se puede conectar al servidor. Verifica tu conexión.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Error al crear la cuenta. Intenta de nuevo.');
      }
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

  // Cart API
  async getCart() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/cart`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  }

  async addToCart(productId: string, quantity: number = 1) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/cart/add`, {
        productId,
        quantity,
      }, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  async removeFromCart(productId: string) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/cart/remove/${productId}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      await this.loadToken();
    }
    return this.token;
  }
}

export default new AlpasoApiService();
