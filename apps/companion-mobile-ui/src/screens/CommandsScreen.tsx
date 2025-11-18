import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Command {
  id: string;
  name: string;
  description: string;
  category: string;
  usage: string;
}

export function CommandsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const commands: Command[] = [
    {
      id: '1',
      name: 'init',
      description: 'Initialize a new CLI project',
      category: 'project',
      usage: 'lord-commander init [project-name]',
    },
    {
      id: '2',
      name: 'build',
      description: 'Build the current project',
      category: 'build',
      usage: 'lord-commander build',
    },
    {
      id: '3',
      name: 'test',
      description: 'Run project tests',
      category: 'testing',
      usage: 'lord-commander test [options]',
    },
    {
      id: '4',
      name: 'deploy',
      description: 'Deploy project to production',
      category: 'deployment',
      usage: 'lord-commander deploy [environment]',
    },
    {
      id: '5',
      name: 'scaffold',
      description: 'Generate code scaffolding',
      category: 'generator',
      usage: 'lord-commander scaffold [type]',
    },
  ];

  const categories = ['all', 'project', 'build', 'testing', 'deployment', 'generator'];

  const filteredCommands = commands.filter((command) => {
    const matchesSearch =
      command.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      command.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || command.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const executeCommand = (command: Command) => {
    Alert.alert(`Execute: ${command.name}`, `Would you like to execute:\n${command.usage}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Execute', onPress: () => Alert.alert('Executed', `Running: ${command.usage}`) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search commands..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8E8E93"
          />
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.selectedCategoryButton,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.selectedCategoryButtonText,
              ]}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Commands List */}
      <ScrollView style={styles.commandsContainer} showsVerticalScrollIndicator={false}>
        {filteredCommands.map((command) => (
          <TouchableOpacity
            key={command.id}
            style={styles.commandCard}
            onPress={() => executeCommand(command)}
          >
            <View style={styles.commandHeader}>
              <View style={styles.commandInfo}>
                <Text style={styles.commandName}>{command.name}</Text>
                <Text style={styles.commandCategory}>{command.category}</Text>
              </View>
              <Ionicons name="play-circle-outline" size={24} color="#007AFF" />
            </View>
            <Text style={styles.commandDescription}>{command.description}</Text>
            <View style={styles.commandUsage}>
              <Text style={styles.commandUsageText}>{command.usage}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {filteredCommands.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="terminal-outline" size={48} color="#8E8E93" />
            <Text style={styles.emptyStateText}>No commands found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search or category filter
            </Text>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1c1c1e',
  },
  categoryContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  categoryContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
  },
  selectedCategoryButton: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1c1c1e',
  },
  selectedCategoryButtonText: {
    color: 'white',
  },
  commandsContainer: {
    flex: 1,
    padding: 20,
  },
  commandCard: {
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
  commandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commandInfo: {
    flex: 1,
  },
  commandName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  commandCategory: {
    fontSize: 12,
    color: '#007AFF',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  commandDescription: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 12,
    lineHeight: 20,
  },
  commandUsage: {
    backgroundColor: '#f2f2f7',
    borderRadius: 6,
    padding: 8,
  },
  commandUsageText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#1c1c1e',
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
  },
});
