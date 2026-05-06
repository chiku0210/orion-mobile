import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSettingsStore } from '../store';
import { useChatStore } from '../store';
import { useAuthStore } from '../store';
import { COLORS } from '../utils';

const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    isWakeWordEnabled,
    isTtsEnabled,
    isBackgroundServiceEnabled,
    setWakeWordEnabled,
    setTtsEnabled,
    setBackgroundServiceEnabled,
  } = useSettingsStore();

  const { clearMessages } = useChatStore();
  const { logout } = useAuthStore();

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearMessages },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Text-to-Speech (TTS)</Text>
            <Switch
              value={isTtsEnabled}
              onValueChange={setTtsEnabled}
              trackColor={{ true: COLORS.primary }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Background Service</Text>
            <Switch
              value={isBackgroundServiceEnabled}
              onValueChange={setBackgroundServiceEnabled}
              trackColor={{ true: COLORS.primary }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conversation</Text>
          <TouchableOpacity style={styles.row} onPress={handleClearHistory}>
            <Text style={[styles.rowLabel, { color: COLORS.error }]}>Clear History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.row} onPress={handleLogout}>
            <Text style={[styles.rowLabel, { color: COLORS.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    height: 60,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  backButton: { padding: 8 },
  backText: { color: '#FFFFFF', fontSize: 16 },
  content: { flex: 1 },
  section: { marginTop: 24, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#C6C6C8' },
  sectionTitle: { fontSize: 13, color: '#6D6D72', textTransform: 'uppercase', marginLeft: 16, marginBottom: 8, marginTop: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderColor: '#C6C6C8',
  },
  rowLabel: { fontSize: 17, color: '#000000' },
});

export default SettingsScreen;
