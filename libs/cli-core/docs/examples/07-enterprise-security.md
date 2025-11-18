# Enterprise Security Framework

> 🔒 Production-ready security patterns for professional CLI tools

The lord-commander SDK includes a comprehensive security framework designed for enterprise environments. This guide covers essential security patterns, threat mitigation, and best practices.

## 🛡️ Security Overview

The SDK provides **974+ security tests** covering:
- Input validation and sanitization
- Path traversal prevention  
- Command injection protection
- Memory exhaustion safeguards
- Information disclosure prevention
- Error handling security
- Framework detection security

## Input Validation Framework

### Project Name Validation

```typescript
import { validateProjectName } from '@caedonai/sdk/core';

async function createProject() {
  // Basic validation
  const result = validateProjectName('my-awesome-project');
  
  if (result.isValid) {
    console.log(`Valid project name: ${result.value}`);
  } else {
    console.error(`Invalid: ${result.error}`);
    return;
  }
  
  // Advanced validation with auto-sanitization
  const advancedResult = validateProjectName('My Project!@#', {
    autoSanitize: true,    // Clean invalid characters
    strictMode: false,     // Allow more flexible names
    maxLength: 50         // Custom length limit
  });
  
  if (advancedResult.isValid) {
    console.log(`Sanitized: ${advancedResult.sanitized}`); // "my-project"
  }
}
```

### Package Manager Validation

```typescript
import { validatePackageManager } from '@caedonai/sdk/core';

async function selectPackageManager(userInput: string) {
  const result = validatePackageManager(userInput);
  
  if (result.isValid) {
    console.log(`Using ${result.value}`); // pnpm, npm, or yarn
  } else {
    // Suggest alternatives
    console.error('Invalid package manager');
    console.log('Supported: pnpm, npm, yarn');
  }
}
```

### Command Argument Sanitization

```typescript
import { sanitizeCommandArgs } from '@caedonai/sdk/core';

async function runUserCommand(args: string[]) {
  // Sanitize potentially dangerous arguments
  const safeArgs = sanitizeCommandArgs(args, {
    strictMode: true,        // Strict validation
    allowShellOperators: false, // Block pipes, redirects
    maxArguments: 10         // Limit argument count
  });
  
  // Run with sanitized arguments
  await execa('git', safeArgs);
}

// Usage examples
runUserCommand(['add', '.']);              // ✅ Safe
runUserCommand(['add', '; rm -rf /']);     // ❌ Blocked
runUserCommand(['add', '$(malicious)']);   // ❌ Blocked
```

## Path Security Validation

### Secure Path Handling

```typescript
import { sanitizePath } from '@caedonai/sdk/core';

async function processUserPath(userPath: string) {
  const result = sanitizePath(userPath, {
    allowTraversal: false,      // Block ../../../
    workingDirectory: process.cwd(), // Restrict to working dir
    allowAbsolute: false        // Block absolute paths
  });
  
  if (result.isValid) {
    // Safe to use the path
    await fs.ensureDir(result.sanitized);
  } else {
    throw new Error(`Unsafe path: ${result.error}`);
  }
}

// Security examples
processUserPath('./src/components');     // ✅ Safe relative path
processUserPath('../../../etc/passwd');  // ❌ Blocked traversal
processUserPath('C:\\Windows\\System32'); // ❌ Blocked absolute
processUserPath('\\\\server\\share');    // ❌ Blocked UNC path
```

### Command Path Security

```typescript
import { createCLI } from '@caedonai/sdk/core';

// ✅ Secure command paths
await createCLI({
  name: 'my-cli',
  version: '1.0.0',
  description: 'Secure CLI',
  commandsPath: [
    './commands',              // ✅ Safe relative
    'src/commands',            // ✅ Safe relative
    './plugins/commands'       // ✅ Safe nested
  ]
});

// ❌ Blocked security violations
try {
  await createCLI({
    commandsPath: [
      '../../../etc',          // ❌ Path traversal
      'C:\\Windows\\System32', // ❌ Absolute path
      '\\\\server\\share'      // ❌ UNC path
    ]
  });
} catch (error) {
  // Security error with detailed information
  console.error(error.message);
}
```

## Error Handling Security

### Information Disclosure Protection

```typescript
import { 
  sanitizeErrorMessage,
  shouldShowDetailedErrors,
  isDebugMode
} from '@caedonai/sdk/core';

function handleError(error: Error) {
  if (shouldShowDetailedErrors()) {
    // Development: show full details
    console.error('Stack:', error.stack);
    console.error('Full error:', error);
  } else {
    // Production: sanitized output only
    const safeMessage = sanitizeErrorMessage(error.message);
    console.error('Error:', safeMessage);
  }
}

// Automatic sanitization of sensitive data
const error = new Error('Database connection failed: postgresql://user:secret123@localhost:5432/db');
const sanitized = sanitizeErrorMessage(error.message);
// Output: "Database connection failed: postgresql://[CREDENTIALS_REMOVED]@localhost:5432/db"
```

### Custom Error Handlers with Security

```typescript
import { createCLI, sanitizeErrorMessage } from '@caedonai/sdk/core';

await createCLI({
  name: 'secure-cli',
  version: '1.0.0',
  description: 'CLI with secure error handling',
  
  errorHandler: async (error) => {
    // Sanitize before logging
    const safeMessage = sanitizeErrorMessage(error.message);
    
    // Log to secure audit system
    await logToSecureAuditTrail({
      timestamp: new Date().toISOString(),
      error: safeMessage,
      userId: getCurrentUserId(),
      sessionId: getSessionId()
    });
    
    // Show user-friendly message
    console.error(`Operation failed: ${safeMessage}`);
    process.exit(1);
  }
});
```

## Memory Safety Protection

### DoS Attack Prevention

```typescript
import { 
  sanitizeErrorObject,
  getObjectMemorySize,
  truncateErrorMessage
} from '@caedonai/sdk/core';

function processLargeData(data: unknown) {
  // Check memory size before processing
  const memorySize = getObjectMemorySize(data);
  
  if (memorySize > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('Data too large for processing');
  }
  
  // Sanitize error objects to prevent memory exhaustion
  try {
    // Process data...
  } catch (error) {
    const sanitizedError = sanitizeErrorObject(error, {
      maxMessageLength: 500,
      maxStackFrames: 10,
      maxObjectSize: 10240 // 10KB
    });
    
    throw sanitizedError;
  }
}
```

### Resource Usage Monitoring

```typescript
function monitorMemoryUsage() {
  const usage = process.memoryUsage();
  const heapMB = Math.round(usage.heapUsed / 1024 / 1024);
  
  if (heapMB > 100) { // 100MB threshold
    console.warn(`⚠️ High memory usage: ${heapMB}MB`);
    
    // Trigger garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
}

// Monitor during long-running operations
setInterval(monitorMemoryUsage, 30000); // Every 30 seconds
```

## Framework Detection Security

### Secure Framework Validation

```typescript
import { detectFramework, validateFrameworkConfig } from '@caedonai/sdk/plugins';

async function secureFrameworkDetection(projectPath: string) {
  try {
    // Detect framework with security validation
    const framework = await detectFramework(projectPath, {
      validateDependencies: true,  // Check dependency integrity
      scanConfigFiles: true,      // Analyze configuration security
      checkScripts: true         // Validate npm scripts
    });
    
    if (framework.securityWarnings.length > 0) {
      console.warn('Security concerns detected:');
      framework.securityWarnings.forEach(warning => {
        console.warn(`⚠️ ${warning}`);
      });
      
      const proceed = await prompts.confirm({
        message: 'Continue despite security warnings?'
      });
      
      if (!proceed) {
        process.exit(1);
      }
    }
    
    return framework;
    
  } catch (error) {
    if (error.message.includes('SECURITY_VIOLATION')) {
      console.error('🚨 Security violation detected');
      console.error('Project contains potentially malicious configuration');
      process.exit(1);
    }
    
    throw error;
  }
}
```

## Log Injection Prevention

### Secure Logging Patterns

```typescript
import { 
  sanitizeLogOutput,
  sanitizeLogOutputAdvanced,
  analyzeLogSecurity
} from '@caedonai/sdk/core';

function secureLogger(message: string, data?: unknown) {
  // Basic sanitization
  const safeMessage = sanitizeLogOutput(message, {
    maxLogLength: 1000,
    allowColors: true,
    strictMode: false
  });
  
  // Advanced sanitization for sensitive data
  if (data) {
    const sanitizedData = sanitizeLogOutputAdvanced(JSON.stringify(data), {
      maxLogLength: 2000,
      allowColors: false,
      strictMode: true,
      preserveFormatting: false
    });
    
    // Analyze security before logging
    const analysis = analyzeLogSecurity(sanitizedData);
    
    if (analysis.riskLevel === 'high') {
      console.warn('🚨 High-risk log content blocked');
      return;
    }
    
    console.log(safeMessage, sanitizedData);
  } else {
    console.log(safeMessage);
  }
}

// Usage examples
secureLogger('User action completed', { userId: 'user123' }); // ✅ Safe
secureLogger('Raw input: \\x1b[31mDangerous\\x1b[0m');       // ✅ ANSI stripped
secureLogger('SQL: SELECT * FROM users WHERE id = ?');       // ✅ Safe pattern
```

## Universal Input Validation

### Comprehensive Validation Function

```typescript
import { validateInput } from '@caedonai/sdk/core';

async function validateUserInput(type: string, value: string) {
  const result = validateInput(type, value, {
    maxLength: 100,
    strictMode: true,
    autoSanitize: false,
    customPatterns: {
      // Custom validation patterns
      email: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/,
      domain: /^[a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?$/
    }
  });
  
  if (!result.isValid) {
    throw new Error(`Invalid ${type}: ${result.error}`);
  }
  
  return result.value;
}

// Usage examples
await validateUserInput('project-name', 'my-awesome-project');
await validateUserInput('email', 'user@example.com');  
await validateUserInput('domain', 'api.company.com');
```

## Security Best Practices

### 1. Input Validation Checklist

```typescript
// ✅ Always validate user inputs
const projectName = validateProjectName(userInput);

// ✅ Sanitize file paths
const safePath = sanitizePath(userPath, { allowTraversal: false });

// ✅ Clean command arguments
const safeArgs = sanitizeCommandArgs(args, { strictMode: true });

// ✅ Validate configuration
const config = validateConfig(userConfig);
```

### 2. Error Handling Checklist

```typescript
// ✅ Sanitize error messages
const safeError = sanitizeErrorMessage(error.message);

// ✅ Environment-aware error details
if (shouldShowDetailedErrors()) {
  console.error(error.stack);
} else {
  console.error(safeError);
}

// ✅ Limit error object size
const sanitizedError = sanitizeErrorObject(error);
```

### 3. Resource Management Checklist

```typescript
// ✅ Monitor memory usage
const memorySize = getObjectMemorySize(data);
if (memorySize > threshold) throw new Error('Too large');

// ✅ Truncate long messages  
const truncated = truncateErrorMessage(message, 500);

// ✅ Set processing limits
const config = { maxMessageLength: 1000, maxStackFrames: 10 };
```

### 4. Logging Security Checklist

```typescript
// ✅ Sanitize log output
const safeLog = sanitizeLogOutput(message);

// ✅ Analyze security risk
const analysis = analyzeLogSecurity(content);

// ✅ Block high-risk content
if (analysis.riskLevel === 'high') return;
```

## Security Testing Examples

### Validation Testing

```typescript
import { validateProjectName } from '@caedonai/sdk/core';

// Test various attack vectors
const testCases = [
  { input: '../../../etc/passwd', shouldFail: true },
  { input: 'C:\\Windows\\System32', shouldFail: true },
  { input: '\\\\server\\share', shouldFail: true },
  { input: 'normal-project-name', shouldFail: false },
  { input: 'project with spaces', shouldFail: false }
];

for (const test of testCases) {
  const result = validateProjectName(test.input);
  const passed = test.shouldFail ? !result.isValid : result.isValid;
  
  console.log(`${passed ? '✅' : '❌'} ${test.input}`);
}
```

### Error Sanitization Testing

```typescript
import { sanitizeErrorMessage } from '@caedonai/sdk/core';

const sensitiveErrors = [
  'Database error: postgresql://user:secret@host:5432/db',
  'API key invalid: sk-1234567890abcdef',
  'File not found: /home/user/.ssh/id_rsa',
  'Authentication failed for token: eyJhbGciOiJIUzI1NiIs...'
];

for (const error of sensitiveErrors) {
  const sanitized = sanitizeErrorMessage(error);
  console.log('Original:', error);
  console.log('Sanitized:', sanitized);
  console.log('---');
}
```

## Production Security Configuration

### Enterprise Security Config

```typescript
import { createCLI } from '@caedonai/sdk/core';

await createCLI({
  name: 'enterprise-cli',
  version: '1.0.0',
  description: 'Production CLI with enterprise security',
  
  // Secure configuration
  commandsPath: './commands', // Single, controlled path
  
  // Built-in command restrictions
  builtinCommands: {
    completion: false, // Disable shell completion in production
    hello: false,      // Disable example commands
    version: false     // Use custom version handling
  },
  
  // Custom error handling with security
  errorHandler: async (error) => {
    // Log to secure audit trail
    await auditLogger.logSecurityEvent({
      type: 'CLI_ERROR',
      message: sanitizeErrorMessage(error.message),
      timestamp: new Date().toISOString(),
      sessionId: getSecureSessionId(),
      userId: getCurrentUserId()
    });
    
    // User-friendly output only
    console.error('Operation failed. Check logs for details.');
    process.exit(1);
  }
});
```

---

*🔒 **Security First**: The lord-commander SDK prioritizes security without compromising developer experience. All security features are production-tested and ready for enterprise environments.*