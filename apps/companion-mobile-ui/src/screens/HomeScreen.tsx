import { Ionicons } from '@expo/vector-icons';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

export function HomeScreen() {
  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'New Project',
      subtitle: 'Initialize a new CLI project',
      icon: 'add-circle',
      color: '#007AFF',
      onPress: () => Alert.alert('New Project', 'Initialize new project'),
    },
    {
      id: '2',
      title: 'Run Command',
      subtitle: 'Execute CLI commands',
      icon: 'play-circle',
      color: '#34C759',
      onPress: () => Alert.alert('Run Command', 'Execute command'),
    },
    {
      id: '3',
      title: 'Monitor Logs',
      subtitle: 'View application logs',
      icon: 'list-circle',
      color: '#FF9500',
      onPress: () => Alert.alert('Monitor Logs', 'View logs'),
    },
    {
      id: '4',
      title: 'Project Status',
      subtitle: 'Check project health',
      icon: 'checkmark-circle',
      color: '#32D74B',
      onPress: () => Alert.alert('Project Status', 'Check status'),
    },
  ];

  const recentProjects = [
    { id: 'p1', name: 'my-cli-app', path: '/Users/dev/projects/my-cli-app', status: 'active' },
    { id: 'p2', name: 'backend-api', path: '/Users/dev/projects/backend-api', status: 'idle' },
    { id: 'p3', name: 'mobile-app', path: '/Users/dev/projects/mobile-app', status: 'building' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Lord Commander</Text>
          <Text style={styles.welcomeSubtitle}>
            Mobile companion for your CLI development workflow
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={action.onPress}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon} size={24} color="white" />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Projects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Projects</Text>
          {recentProjects.map((project) => (
            <TouchableOpacity key={project.id} style={styles.projectCard}>
              <View style={styles.projectInfo}>
                <Text style={styles.projectName}>{project.name}</Text>
                <Text style={styles.projectPath}>{project.path}</Text>
              </View>
              <View
                style={[styles.projectStatus, { backgroundColor: getStatusColor(project.status) }]}
              >
                <Text style={styles.projectStatusText}>{project.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return '#34C759';
    case 'building':
      return '#FF9500';
    case 'idle':
      return '#8E8E93';
    default:
      return '#8E8E93';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  welcomeSection: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'white',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    gap: 10,
  },
  quickActionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    width: '47%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 5,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'center',
  },
  projectCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 5,
  },
  projectPath: {
    fontSize: 12,
    color: '#8e8e93',
  },
  projectStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  projectStatusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
});
