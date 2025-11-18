import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Project {
  id: string;
  name: string;
  path: string;
  status: 'active' | 'inactive' | 'building' | 'error';
  lastAccessed: string;
  framework: string;
  description?: string;
}

export function ProjectsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [projects, _setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'lord-commander-poc',
      path: '/Users/fabiomarcellus/Documents/GitHub/lord-commander-poc',
      status: 'active',
      lastAccessed: '2 minutes ago',
      framework: 'NX Monorepo',
      description: 'CLI development toolkit with monorepo structure',
    },
    {
      id: '2',
      name: 'dashboard-ui',
      path: '/Users/fabiomarcellus/Documents/GitHub/lord-commander-poc/apps/dashboard-ui',
      status: 'inactive',
      lastAccessed: '1 hour ago',
      framework: 'Next.js',
      description: 'Admin dashboard interface',
    },
    {
      id: '3',
      name: 'mobile-companion',
      path: '/Users/fabiomarcellus/Documents/GitHub/lord-commander-poc/apps/companion-mobile-ui',
      status: 'building',
      lastAccessed: 'Just now',
      framework: 'React Native',
      description: 'Mobile companion app for CLI workflows',
    },
  ]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate API call to refresh projects
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return '#34C759';
      case 'building':
        return '#FF9500';
      case 'error':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'checkmark-circle';
      case 'building':
        return 'build-outline';
      case 'error':
        return 'alert-circle';
      default:
        return 'pause-circle';
    }
  };

  const openProject = (project: Project) => {
    Alert.alert(`Open ${project.name}`, `Open project in:\n${project.path}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Terminal',
        onPress: () => Alert.alert('Opening', `Opening terminal at ${project.path}`),
      },
      {
        text: 'VS Code',
        onPress: () => Alert.alert('Opening', `Opening VS Code for ${project.name}`),
      },
    ]);
  };

  const projectActions = (project: Project) => {
    Alert.alert(`${project.name} Actions`, 'Choose an action:', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Build', onPress: () => Alert.alert('Building', `Building ${project.name}...`) },
      {
        text: 'Test',
        onPress: () => Alert.alert('Testing', `Running tests for ${project.name}...`),
      },
      { text: 'Deploy', onPress: () => Alert.alert('Deploying', `Deploying ${project.name}...`) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projects</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => Alert.alert('New Project', 'Create a new project')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Projects List */}
      <ScrollView
        style={styles.projectsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {projects.map((project) => (
          <TouchableOpacity
            key={project.id}
            style={styles.projectCard}
            onPress={() => openProject(project)}
          >
            <View style={styles.projectHeader}>
              <View style={styles.projectInfo}>
                <Text style={styles.projectName}>{project.name}</Text>
                <Text style={styles.projectFramework}>{project.framework}</Text>
              </View>
              <View style={styles.projectStatus}>
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: getStatusColor(project.status) },
                  ]}
                />
                <Ionicons
                  name={getStatusIcon(project.status)}
                  size={20}
                  color={getStatusColor(project.status)}
                />
              </View>
            </View>

            {project.description && (
              <Text style={styles.projectDescription}>{project.description}</Text>
            )}

            <View style={styles.projectPath}>
              <Ionicons name="folder-outline" size={14} color="#8E8E93" />
              <Text style={styles.projectPathText} numberOfLines={1}>
                {project.path}
              </Text>
            </View>

            <View style={styles.projectFooter}>
              <Text style={styles.lastAccessed}>Last accessed: {project.lastAccessed}</Text>
              <TouchableOpacity
                style={styles.actionsButton}
                onPress={() => projectActions(project)}
              >
                <Ionicons name="ellipsis-horizontal" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        {projects.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color="#8E8E93" />
            <Text style={styles.emptyStateText}>No projects found</Text>
            <Text style={styles.emptyStateSubtext}>Create or import a project to get started</Text>
            <TouchableOpacity
              style={styles.createProjectButton}
              onPress={() => Alert.alert('Create Project', 'Initialize a new project')}
            >
              <Text style={styles.createProjectButtonText}>Create New Project</Text>
            </TouchableOpacity>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectsContainer: {
    flex: 1,
    padding: 20,
  },
  projectCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  projectFramework: {
    fontSize: 12,
    color: '#007AFF',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  projectStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  projectDescription: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 12,
    lineHeight: 20,
  },
  projectPath: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  projectPathText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#1c1c1e',
    marginLeft: 6,
    flex: 1,
  },
  projectFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastAccessed: {
    fontSize: 12,
    color: '#8e8e93',
  },
  actionsButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8e8e93',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  createProjectButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createProjectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
