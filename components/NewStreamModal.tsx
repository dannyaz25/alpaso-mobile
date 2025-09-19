import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AlpasoApiService from '../services/AlpasoApiService';

interface NewStreamModalProps {
  visible: boolean;
  onClose: () => void;
  onStreamCreated: () => void;
}

const NewStreamModal: React.FC<NewStreamModalProps> = ({
  visible,
  onClose,
  onStreamCreated,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'espresso-latte-art',
    scheduledTime: '',
    maxParticipants: 100,
    isScheduled: false,
  });
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'espresso-latte-art', label: 'Espresso & Latte Art' },
    { value: 'cold-brew-specialty', label: 'Cold Brew & Specialty' },
    { value: 'french-press-pour-over', label: 'French Press & Pour Over' },
    { value: 'brewing-techniques', label: 'Brewing Techniques' },
    { value: 'coffee-tasting-cupping', label: 'Coffee Tasting & Cupping' },
    { value: 'roasting-bean-selection', label: 'Roasting & Bean Selection' },
  ];

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'El título es requerido');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Error', 'La descripción es requerida');
      return;
    }

    setLoading(true);
    try {
      const streamData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        maxParticipants: formData.maxParticipants,
        products: [], // Por ahora vacío, se puede extender
        ...(formData.isScheduled && formData.scheduledTime && {
          scheduledTime: formData.scheduledTime,
        }),
      };

      await AlpasoApiService.createStream(streamData);

      Alert.alert(
        'Éxito',
        'Transmisión creada exitosamente',
        [
          {
            text: 'OK',
            onPress: () => {
              onStreamCreated();
              onClose();
              resetForm();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating stream:', error);
      Alert.alert('Error', 'No se pudo crear la transmisión');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'espresso-latte-art',
      scheduledTime: '',
      maxParticipants: 100,
      isScheduled: false,
    });
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // Mínimo 30 minutos en el futuro
    return now.toISOString().slice(0, 16);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Nueva Transmisión</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Título *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Ej: Masterclass de Latte Art"
              maxLength={100}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe lo que enseñarás en esta transmisión..."
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.categoryChip,
                      formData.category === category.value && styles.categoryChipSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, category: category.value })}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        formData.category === category.value && styles.categoryTextSelected,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.switchContainer}>
              <Text style={styles.label}>Programar para después</Text>
              <Switch
                value={formData.isScheduled}
                onValueChange={(value) => setFormData({ ...formData, isScheduled: value })}
                trackColor={{ false: '#ccc', true: '#8B4513' }}
                thumbColor={formData.isScheduled ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {formData.isScheduled && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Fecha y Hora</Text>
              <TextInput
                style={styles.input}
                value={formData.scheduledTime}
                onChangeText={(text) => setFormData({ ...formData, scheduledTime: text })}
                placeholder={getCurrentDateTime()}
              />
              <Text style={styles.helperText}>
                Formato: YYYY-MM-DD HH:MM (mínimo 30 minutos en el futuro)
              </Text>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Máximo de Participantes</Text>
            <View style={styles.participantsContainer}>
              <TouchableOpacity
                style={styles.participantsButton}
                onPress={() =>
                  setFormData({
                    ...formData,
                    maxParticipants: Math.max(10, formData.maxParticipants - 10),
                  })
                }
              >
                <Ionicons name="remove" size={20} color="#8B4513" />
              </TouchableOpacity>
              <Text style={styles.participantsValue}>{formData.maxParticipants}</Text>
              <TouchableOpacity
                style={styles.participantsButton}
                onPress={() =>
                  setFormData({
                    ...formData,
                    maxParticipants: Math.min(500, formData.maxParticipants + 10),
                  })
                }
              >
                <Ionicons name="add" size={20} color="#8B4513" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Creando...' : formData.isScheduled ? 'Programar' : 'Ir en Vivo Ahora'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: 400,
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
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#8B4513',
    backgroundColor: 'white',
  },
  categoryChipSelected: {
    backgroundColor: '#8B4513',
  },
  categoryText: {
    color: '#8B4513',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: 'white',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  participantsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  participantsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 60,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 16,
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
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NewStreamModal;
