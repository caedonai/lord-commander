# Lord Commander Mobile Companion

A React Native mobile companion app for the Lord Commander CLI development toolkit.

## Features

### 🏠 Dashboard (HomeScreen)
- **Quick Actions Grid**: Fast access to common CLI operations
  - New Project: Initialize new CLI projects
  - Run Command: Execute CLI commands  
  - Monitor Logs: Real-time CLI output monitoring
  - Project Status: Check project health
- **Recent Projects**: List of recently accessed projects with status indicators
- **Clean iOS-style UI** with modern design patterns

### ⚡ Commands (CommandsScreen)  
- **Search & Filter**: Find CLI commands quickly
- **Category Organization**: Commands grouped by type (project, build, testing, deployment, generator)
- **Interactive Command Execution**: Tap to run commands with confirmation dialogs
- **Usage Examples**: Each command shows proper usage syntax
- **Command Details**: Full descriptions and categories for each CLI tool

### 📁 Projects (ProjectsScreen)
- **Project Management**: View and manage all CLI projects
- **Status Indicators**: Visual status (active, building, error, inactive)
- **Path Information**: Full project paths with monospace formatting  
- **Quick Actions**: Build, test, deploy options for each project
- **Refresh Control**: Pull-to-refresh project list
- **Create New**: Quick project initialization

### ⚙️ Settings (SettingsScreen)
- **CLI Configuration**: Set default terminal, editor, project paths
- **App Preferences**: Notifications, auto-updates, dark mode
- **Security**: Biometric authentication, SSH key management  
- **Support**: Documentation, feedback, about information
- **Advanced**: Cache management, settings export, app reset

## Technology Stack

- **React Native 0.73** with Expo 50
- **React Navigation 6** with bottom tab navigation
- **TypeScript** for type safety
- **Expo Vector Icons** for consistent iconography
- **React Native Safe Area Context** for proper screen handling

## Getting Started

```bash
# Install dependencies
cd apps/companion-mobile-ui
pnpm install

# Start development server
expo start

# Run on specific platforms
expo start --ios
expo start --android  
expo start --web
```

## Project Structure

```
apps/companion-mobile-ui/
├── src/
│   ├── screens/           # Main app screens
│   │   ├── HomeScreen.tsx       # Dashboard with quick actions
│   │   ├── CommandsScreen.tsx   # CLI command browser
│   │   ├── ProjectsScreen.tsx   # Project management
│   │   └── SettingsScreen.tsx   # App configuration  
│   └── navigation/        # React Navigation setup
│       └── AppNavigator.tsx     # Bottom tab navigation
├── App.tsx               # Main app component
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── babel.config.js       # Babel configuration 
└── app.json             # Expo app configuration
```

## Integration with CLI

This mobile app serves as a **companion interface** for the Lord Commander CLI toolkit:

- **Remote Command Execution**: Run CLI commands from mobile interface
- **Project Monitoring**: Real-time status updates for CLI projects  
- **Workflow Management**: Mobile-optimized CLI development workflows
- **Quick Access**: Common CLI operations available via quick actions

## Development Notes

- Built for iOS, Android, and Web platforms
- Modern React Native practices with hooks and functional components
- TypeScript strict mode enabled for enhanced code quality
- Follows Expo best practices for cross-platform compatibility
- Designed for CLI developers who want mobile access to their tools

## Future Enhancements

- Real-time CLI command execution and output streaming
- Push notifications for build status and deployment updates  
- Integration with VS Code and other development tools
- Project templates and scaffolding from mobile interface
- SSH key management and Git integration
- Performance monitoring and analytics dashboard