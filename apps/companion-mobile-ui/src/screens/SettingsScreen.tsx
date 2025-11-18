import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type IconName = keyof typeof Ionicons.glyphMap;

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'switch' | 'navigation' | 'action';
  value?: boolean;
  onPress?: () => void;
  icon: IconName;
}

export function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [biometrics, setBiometrics] = useState(true);

  const settingSections = [
    {
      title: 'CLI Configuration',
      items: [
        {
          id: 'default-terminal',
          title: 'Default Terminal',
          subtitle: 'iTerm2',
          type: 'navigation' as const,
          icon: 'terminal',
          onPress: () => Alert.alert('Terminal Settings', 'Choose default terminal application'),
        },
        {
          id: 'default-editor',
          title: 'Default Editor',
          subtitle: 'VS Code',
          type: 'navigation' as const,
          icon: 'code-slash',
          onPress: () => Alert.alert('Editor Settings', 'Choose default code editor'),
        },
        {
          id: 'project-path',
          title: 'Default Project Path',
          subtitle: '~/Documents/GitHub',
          type: 'navigation' as const,
          icon: 'folder',
          onPress: () => Alert.alert('Path Settings', 'Set default project directory'),
        },
      ],
    },
    {
      title: 'App Preferences',
      items: [
        {
          id: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Build status and deployment alerts',
          type: 'switch' as const,
          value: notifications,
          icon: 'notifications',
          onPress: () => setNotifications(!notifications),
        },
        {
          id: 'auto-update',
          title: 'Auto Update CLI',
          subtitle: 'Automatically update lord-commander',
          type: 'switch' as const,
          value: autoUpdate,
          icon: 'download',
          onPress: () => setAutoUpdate(!autoUpdate),
        },
        {
          id: 'dark-mode',
          title: 'Dark Mode',
          subtitle: 'Use system preference',
          type: 'switch' as const,
          value: darkMode,
          icon: 'moon',
          onPress: () => setDarkMode(!darkMode),
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          id: 'biometrics',
          title: 'Biometric Authentication',
          subtitle: 'Use Face ID or Touch ID',
          type: 'switch' as const,
          value: biometrics,
          icon: 'finger-print',
          onPress: () => setBiometrics(!biometrics),
        },
        {
          id: 'ssh-keys',
          title: 'SSH Keys',
          subtitle: 'Manage SSH keys for repositories',
          type: 'navigation' as const,
          icon: 'key',
          onPress: () => Alert.alert('SSH Keys', 'Manage SSH keys'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'documentation',
          title: 'Documentation',
          subtitle: 'View help and guides',
          type: 'navigation' as const,
          icon: 'book',
          onPress: () => Alert.alert('Documentation', 'Opening documentation...'),
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          subtitle: 'Report issues or suggestions',
          type: 'navigation' as const,
          icon: 'chatbubble',
          onPress: () => Alert.alert('Feedback', 'Thank you for your feedback!'),
        },
        {
          id: 'about',
          title: 'About',
          subtitle: 'Version 1.0.0',
          type: 'navigation' as const,
          icon: 'information-circle',
          onPress: () => showAbout(),
        },
      ],
    },
    {
      title: 'Advanced',
      items: [
        {
          id: 'clear-cache',
          title: 'Clear Cache',
          subtitle: 'Clear app cache and temporary files',
          type: 'action' as const,
          icon: 'trash',
          onPress: () => clearCache(),
        },
        {
          id: 'export-settings',
          title: 'Export Settings',
          subtitle: 'Backup your configuration',
          type: 'action' as const,
          icon: 'share',
          onPress: () => exportSettings(),
        },
        {
          id: 'reset',
          title: 'Reset App',
          subtitle: 'Reset to default settings',
          type: 'action' as const,
          icon: 'refresh',
          onPress: () => resetApp(),
        },
      ],
    },
  ];

  const showAbout = () => {
    Alert.alert(
      'About Lord Commander Mobile',
      'Version: 1.0.0\nBuild: 2024.1.0\n\nA companion app for the Lord Commander CLI toolkit.\n\n© 2024 Lord Commander',
      [{ text: 'OK' }]
    );
  };

  const clearCache = () => {
    Alert.alert('Clear Cache', 'This will clear all cached data and temporary files. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => Alert.alert('Success', 'Cache cleared'),
      },
    ]);
  };

  const exportSettings = () => {
    Alert.alert('Export Settings', 'Settings exported to Files app');
  };

  const resetApp = () => {
    Alert.alert(
      'Reset App',
      'This will reset all settings to defaults. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => Alert.alert('Reset', 'App has been reset'),
        },
      ]
    );
  };

  const renderSettingItem = (item: SettingItem) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={item.onPress}
        disabled={item.type === 'switch'}
      >
        <View style={styles.settingIcon}>
          <Ionicons name={item.icon} size={20} color="#007AFF" />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          {item.subtitle && <Text style={styles.settingSubtitle}>{item.subtitle}</Text>}
        </View>
        <View style={styles.settingAction}>
          {item.type === 'switch' && (
            <Switch
              value={item.value}
              onValueChange={item.onPress}
              trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              thumbColor="white"
            />
          )}
          {item.type === 'navigation' && (
            <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
          )}
          {item.type === 'action' && <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Settings List */}
      <ScrollView style={styles.settingsContainer} showsVerticalScrollIndicator={false}>
        {settingSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <View key={item.id}>
                  {renderSettingItem(item)}
                  {itemIndex < section.items.length - 1 && <View style={styles.separator} />}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  settingsContainer: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6d6d70',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  sectionContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#f2f2f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#8e8e93',
  },
  settingAction: {
    marginLeft: 12,
  },
  separator: {
    height: 0.5,
    backgroundColor: '#e5e5ea',
    marginLeft: 60,
  },
});
