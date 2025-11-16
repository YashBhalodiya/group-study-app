import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { CreateMeetingData, MeetingFormErrors } from '../../types/meeting';

interface CreateMeetingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (meetingData: CreateMeetingData) => Promise<void>;
  colors: any;
}

export const CreateMeetingModal: React.FC<CreateMeetingModalProps> = ({
  visible,
  onClose,
  onSubmit,
  colors,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [dateTime, setDateTime] = useState(new Date(Date.now() + 3600000)); // Default to 1 hour from now
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState<MeetingFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setMeetingLink('');
    setDateTime(new Date(Date.now() + 3600000));
    setErrors({});
    setSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: MeetingFormErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!meetingLink.trim()) {
      newErrors.meetingLink = 'Meeting link is required';
    } else {
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(meetingLink.trim())) {
        newErrors.meetingLink = 'Please enter a valid URL';
      }
    }

    const now = new Date();
    if (dateTime <= now) {
      newErrors.dateTime = 'Meeting date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const meetingData: CreateMeetingData = {
        title: title.trim(),
        description: description.trim(),
        meetingLink: meetingLink.trim(),
        dateTime,
      };

      await onSubmit(meetingData);
      handleClose();
      Alert.alert('Success', 'Meeting created successfully!');
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      Alert.alert('Error', error.message || 'Failed to create meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      // Merge selected date with current time
      const newDateTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        dateTime.getHours(),
        dateTime.getMinutes()
      );
      setDateTime(newDateTime);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      // Merge current date with selected time
      const newDateTime = new Date(
        dateTime.getFullYear(),
        dateTime.getMonth(),
        dateTime.getDate(),
        selectedTime.getHours(),
        selectedTime.getMinutes()
      );
      setDateTime(newDateTime);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Create Meeting
            </Text>
            <TouchableOpacity onPress={handleClose} disabled={submitting}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Meeting Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: errors.title ? '#FF6B6B' : colors.border,
                  },
                ]}
                placeholder="e.g., Math Study Session"
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (errors.title) setErrors({ ...errors, title: undefined });
                }}
                editable={!submitting}
                maxLength={100}
              />
              {errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Description <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: errors.description ? '#FF6B6B' : colors.border,
                  },
                ]}
                placeholder="Describe the meeting agenda..."
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  if (errors.description) setErrors({ ...errors, description: undefined });
                }}
                multiline
                numberOfLines={4}
                editable={!submitting}
                maxLength={500}
              />
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
            </View>

            {/* Meeting Link Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Meeting Link <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: errors.meetingLink ? '#FF6B6B' : colors.border,
                  },
                ]}
                placeholder="https://meet.google.com/xxx or https://zoom.us/j/xxx"
                placeholderTextColor={colors.textSecondary}
                value={meetingLink}
                onChangeText={(text) => {
                  setMeetingLink(text);
                  if (errors.meetingLink) setErrors({ ...errors, meetingLink: undefined });
                }}
                editable={!submitting}
                autoCapitalize="none"
                keyboardType="url"
              />
              {errors.meetingLink && (
                <Text style={styles.errorText}>{errors.meetingLink}</Text>
              )}
            </View>

            {/* Date & Time Pickers */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Date & Time <Text style={styles.required}>*</Text>
              </Text>
              
              <View style={styles.dateTimeRow}>
                {/* Date Picker */}
                <TouchableOpacity
                  style={[
                    styles.dateTimeButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                  disabled={submitting}
                >
                  <MaterialIcons name="event" size={20} color={colors.primary} />
                  <Text style={[styles.dateTimeText, { color: colors.text }]}>
                    {formatDate(dateTime)}
                  </Text>
                </TouchableOpacity>

                {/* Time Picker */}
                <TouchableOpacity
                  style={[
                    styles.dateTimeButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => setShowTimePicker(true)}
                  disabled={submitting}
                >
                  <MaterialIcons name="access-time" size={20} color={colors.primary} />
                  <Text style={[styles.dateTimeText, { color: colors.text }]}>
                    {formatTime(dateTime)}
                  </Text>
                </TouchableOpacity>
              </View>

              {errors.dateTime && (
                <Text style={styles.errorText}>{errors.dateTime}</Text>
              )}
            </View>

            {/* Date Picker Modal */}
            {showDatePicker && (
              <DateTimePicker
                value={dateTime}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            {/* Time Picker Modal */}
            {showTimePicker && (
              <DateTimePicker
                value={dateTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
            )}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleClose}
              disabled={submitting}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                { backgroundColor: colors.primary },
                submitting && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={[styles.buttonText, styles.submitButtonText]}>
                {submitting ? 'Creating...' : 'Create Meeting'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  form: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  required: {
    color: '#FF6B6B',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dateTimeText: {
    fontSize: 14,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  submitButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#fff',
  },
});
