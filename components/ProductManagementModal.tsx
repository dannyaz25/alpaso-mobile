import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AlpasoApiService from '../services/AlpasoApiService';

interface Product {
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

interface ProductManagementModalProps {
  visible: boolean;
  onClose: () => void;
  onProductsUpdated: () => void;
}

const ProductManagementModal: React.FC<ProductManagementModalProps> = ({
  visible,
  onClose,
  onProductsUpdated,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    category: 'coffee',
    stock: '',
  });

  useEffect(() => {
    if (visible) {
      loadProducts();
    }
  }, [visible]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const productsData = await AlpasoApiService.getSellerProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.price || !newProduct.stock) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const productData = {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        description: newProduct.description,
        category: newProduct.category,
        stock: parseInt(newProduct.stock),
      };

      await AlpasoApiService.createProduct(productData);

      Alert.alert('Éxito', 'Producto creado exitosamente');
      resetNewProductForm();
      setShowNewProductForm(false);
      loadProducts();
      onProductsUpdated();
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', 'No se pudo crear el producto');
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    try {
      await AlpasoApiService.updateProduct(product.id, product);
      Alert.alert('Éxito', 'Producto actualizado exitosamente');
      setEditingProduct(null);
      loadProducts();
      onProductsUpdated();
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'No se pudo actualizar el producto');
    }
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar "${productName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AlpasoApiService.deleteProduct(productId);
              Alert.alert('Éxito', 'Producto eliminado exitosamente');
              loadProducts();
              onProductsUpdated();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          },
        },
      ]
    );
  };

  const toggleProductStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      await AlpasoApiService.updateProduct(product.id, {
        ...product,
        status: newStatus,
      });
      loadProducts();
      onProductsUpdated();
    } catch (error) {
      console.error('Error updating product status:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado del producto');
    }
  };

  const resetNewProductForm = () => {
    setNewProduct({
      name: '',
      price: '',
      description: '',
      category: 'coffee',
      stock: '',
    });
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productItem}>
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>${item.price}</Text>
          {item.livePrice && (
            <Text style={styles.livePrice}>Live: ${item.livePrice}</Text>
          )}
        </View>
        <View style={styles.productActions}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              { backgroundColor: item.status === 'active' ? '#4CAF50' : '#f44336' },
            ]}
            onPress={() => toggleProductStatus(item)}
          >
            <Text style={styles.statusButtonText}>
              {item.status === 'active' ? 'Activo' : 'Inactivo'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditingProduct(item)}
          >
            <Ionicons name="pencil" size={16} color="#8B4513" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteProduct(item.id, item.name)}
          >
            <Ionicons name="trash" size={16} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.productMetrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Stock</Text>
          <Text style={styles.metricValue}>{item.stock}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Vendidos</Text>
          <Text style={styles.metricValue}>{item.sold}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Categoria</Text>
          <Text style={styles.metricValue}>{item.category}</Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </View>
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Gestionar Productos</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowNewProductForm(true)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>Nuevo Producto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButton} onPress={loadProducts}>
            <Ionicons name="refresh" size={20} color="#8B4513" />
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
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.productsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No tienes productos registrados</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setShowNewProductForm(true)}
                >
                  <Text style={styles.emptyButtonText}>Crear primer producto</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}

        {/* Modal para nuevo producto */}
        <Modal
          visible={showNewProductForm}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Nuevo Producto</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowNewProductForm(false);
                  resetNewProductForm();
                }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContent}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nombre del Producto *</Text>
                <TextInput
                  style={styles.input}
                  value={newProduct.name}
                  onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
                  placeholder="Ej: Café Premium Colombiano"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Precio *</Text>
                <TextInput
                  style={styles.input}
                  value={newProduct.price}
                  onChangeText={(text) => setNewProduct({ ...newProduct, price: text })}
                  placeholder="25.99"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Stock Inicial *</Text>
                <TextInput
                  style={styles.input}
                  value={newProduct.stock}
                  onChangeText={(text) => setNewProduct({ ...newProduct, stock: text })}
                  placeholder="50"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Categoría</Text>
                <View style={styles.categoryButtons}>
                  {['coffee', 'equipment', 'accessories'].map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        newProduct.category === category && styles.categoryButtonSelected,
                      ]}
                      onPress={() => setNewProduct({ ...newProduct, category })}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          newProduct.category === category && styles.categoryButtonTextSelected,
                        ]}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newProduct.description}
                  onChangeText={(text) => setNewProduct({ ...newProduct, description: text })}
                  placeholder="Describe las características del producto..."
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>

            <View style={styles.formFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowNewProductForm(false);
                  resetNewProductForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleCreateProduct}>
                <Text style={styles.submitButtonText}>Crear Producto</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal para editar producto */}
        {editingProduct && (
          <Modal visible={!!editingProduct} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.formContainer}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Editar Producto</Text>
                <TouchableOpacity onPress={() => setEditingProduct(null)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formContent}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Nombre del Producto</Text>
                  <TextInput
                    style={styles.input}
                    value={editingProduct.name}
                    onChangeText={(text) =>
                      setEditingProduct({ ...editingProduct, name: text })
                    }
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Precio</Text>
                  <TextInput
                    style={styles.input}
                    value={editingProduct.price.toString()}
                    onChangeText={(text) =>
                      setEditingProduct({ ...editingProduct, price: parseFloat(text) || 0 })
                    }
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Stock</Text>
                  <TextInput
                    style={styles.input}
                    value={editingProduct.stock.toString()}
                    onChangeText={(text) =>
                      setEditingProduct({ ...editingProduct, stock: parseInt(text) || 0 })
                    }
                    keyboardType="numeric"
                  />
                </View>
              </ScrollView>

              <View style={styles.formFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditingProduct(null)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => handleUpdateProduct(editingProduct)}
                >
                  <Text style={styles.submitButtonText}>Guardar Cambios</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B4513',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsList: {
    padding: 16,
  },
  productItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  livePrice: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff3e0',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#ffebee',
  },
  productMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Form styles
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  formContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#8B4513',
    backgroundColor: 'white',
  },
  categoryButtonSelected: {
    backgroundColor: '#8B4513',
  },
  categoryButtonText: {
    color: '#8B4513',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: 'white',
  },
  formFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#8B4513',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProductManagementModal;
