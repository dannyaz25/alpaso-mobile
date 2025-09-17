import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:5003'; // Tu backend de Alpaso

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

  // Auth API
  async login(email: string, password: string) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      if (response.data.token) {
        await this.saveToken(response.data.token);
      }

      return response.data;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }

  async register(userData: any) {
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
