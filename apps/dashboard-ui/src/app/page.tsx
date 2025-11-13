'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { useAppStore } from '../stores/app-store';

// CLI Core library integration
// Note: This would import from @lord-commander/cli-core once the library is properly built
// For now we'll demo the UI structure

export default function Index() {
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  const { sidebarOpen, setSidebarOpen, theme, setTheme } = useAppStore();

  const commands = [
    {
      id: 'hello',
      name: 'Hello Command',
      description: 'Display a greeting message',
      category: 'Basic',
    },
    {
      id: 'version',
      name: 'Version Command',
      description: 'Show the CLI version',
      category: 'Info',
    },
    {
      id: 'completion',
      name: 'Completion Command',
      description: 'Generate shell completion',
      category: 'Utility',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">LC</span>
              </div>
              <h1 className="text-xl font-bold">Lord Commander CLI</h1>
            </motion.div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
                ☰
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 280 : 0 }}
          className="border-r bg-muted/10 overflow-hidden"
        >
          <div className="p-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-4">
              Available Commands
            </h2>
            <div className="space-y-2">
              {commands.map((command) => (
                <motion.button
                  key={command.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCommand(command.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedCommand === command.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="font-medium">{command.name}</div>
                  <div className="text-sm opacity-70">{command.description}</div>
                  <div className="text-xs mt-1 opacity-50">{command.category}</div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <motion.h1
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-4xl font-bold mb-4"
              >
                Welcome to Lord Commander UI
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-muted-foreground"
              >
                A modern web interface for the Lord Commander CLI SDK
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {/* Feature Cards */}
              {[
                {
                  title: 'CLI Core Library',
                  description: 'Powered by @lord-commander/cli-core',
                  icon: '⚡',
                },
                {
                  title: 'React Query',
                  description: 'Efficient data fetching and caching',
                  icon: '🔄',
                },
                {
                  title: 'Zustand Store',
                  description: 'Lightweight state management',
                  icon: '🏪',
                },
                {
                  title: 'Framer Motion',
                  description: 'Smooth animations and transitions',
                  icon: '✨',
                },
                {
                  title: 'Tailwind CSS',
                  description: 'Utility-first CSS framework',
                  icon: '🎨',
                },
                {
                  title: 'TypeScript',
                  description: 'Type-safe development',
                  icon: '📝',
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 border rounded-lg bg-card hover:shadow-lg transition-shadow"
                >
                  <div className="text-2xl mb-2">{feature.icon}</div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Command Demo */}
            {selectedCommand && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 border rounded-lg bg-card"
              >
                <h3 className="text-lg font-semibold mb-4">
                  Command: {commands.find((c) => c.id === selectedCommand)?.name}
                </h3>
                <div className="bg-muted p-4 rounded font-mono text-sm">
                  <div className="text-green-600">$ lord-commander {selectedCommand}</div>
                  <div className="mt-2 text-muted-foreground">
                    {selectedCommand === 'hello' && 'Hello! Welcome to Lord Commander CLI 👋'}
                    {selectedCommand === 'version' && 'Lord Commander CLI v3.0.0'}
                    {selectedCommand === 'completion' &&
                      'Shell completion script generated successfully!'}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 mt-8">
              <Button size="lg">🚀 Get Started</Button>
              <Button variant="outline" size="lg">
                📚 View Docs
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
