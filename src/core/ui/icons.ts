/**
 * Enhanced Icon System for Logger with Cross-Platform Fallbacks
 * 
 * This module extends the logger with comprehensive icon support,
 * automatic fallback detection, and security considerations.
 */

import { mainSymbols, fallbackSymbols } from 'figures';

/**
 * Extended icon set with semantic names
 */
export interface ExtendedIcons {
  // Basic status icons (already available via figures)
  tick: string;
  cross: string;
  warning: string;
  info: string;
  
  // Extended semantic icons
  rocket: string;
  cloud: string;
  box: string;
  folder: string;
  file: string;
  gear: string;
  lightning: string;
  shield: string;
  key: string;
  lock: string;
  globe: string;
  network: string;
  database: string;
  server: string;
  api: string;
  upload: string;
  download: string;
  sync: string;
  build: string;
  deploy: string;
  success: string;
  failure: string;
  pending: string;
  skip: string;
  
  // Decorative
  sparkle: string;
  diamond: string;
  crown: string;
  trophy: string;
}

/**
 * Platform capability detection
 */
export class PlatformCapabilities {
  private static _supportsUnicode: boolean | null = null;
  private static _supportsEmoji: boolean | null = null;
  
  /**
   * Detect if the current terminal supports Unicode characters
   */
  static supportsUnicode(): boolean {
    if (this._supportsUnicode !== null) {
      return this._supportsUnicode;
    }
    
    // Check various indicators for Unicode support
    const indicators = {
      // Modern terminals usually support Unicode
      isTTY: process.stdout?.isTTY || false,
      
      // VS Code integrated terminal
      isVSCode: process.env.TERM_PROGRAM === 'vscode',
      
      // Windows Terminal (modern)
      isWindowsTerminal: process.env.WT_SESSION !== undefined,
      
      // PowerShell 7+ has good Unicode support
      isPowerShell7: process.env.PSModulePath !== undefined && 
                     (process.env.PSVersionTable || '').includes('7'),
      
      // iTerm2, Terminal.app on macOS
      isModernMacTerminal: process.platform === 'darwin' && 
                          (process.env.TERM_PROGRAM === 'iTerm.app' || 
                           process.env.TERM_PROGRAM === 'Apple_Terminal'),
      
      // Modern Linux terminals
      isModernLinuxTerminal: process.platform === 'linux' && 
                            (process.env.COLORTERM === 'truecolor' || 
                             process.env.TERM?.includes('256color')),
      
      // CI environments (usually support basic Unicode)
      isCI: process.env.CI === 'true',
      
      // Explicitly disabled Unicode
      isUnicodeDisabled: process.env.DISABLE_UNICODE === 'true' ||
                        process.env.ASCII_ONLY === 'true',
                        
      // Very old Windows console (cmd.exe without Unicode support)
      isOldWindowsConsole: process.platform === 'win32' && 
                          !process.env.WT_SESSION && 
                          !process.env.ConEmuANSI && 
                          process.env.TERM_PROGRAM !== 'vscode'
    };
    
    // Determine Unicode support
    // In test environment, check for forced detection first
    if (process.env.FORCE_UNICODE_DETECTION === 'true') {
      this._supportsUnicode = true;
      return this._supportsUnicode;
    }
    
    // In test environment without force, default to false
    if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
      this._supportsUnicode = false;
      return this._supportsUnicode;
    }
    
    this._supportsUnicode = 
      !indicators.isUnicodeDisabled && 
      !indicators.isOldWindowsConsole &&
      (indicators.isTTY || indicators.isCI) &&
      (indicators.isVSCode || 
       indicators.isWindowsTerminal || 
       indicators.isPowerShell7 || 
       indicators.isModernMacTerminal || 
       indicators.isModernLinuxTerminal || 
       indicators.isCI);
    
    return this._supportsUnicode;
  }
  
  /**
   * Detect if the current terminal supports emoji
   */
  static supportsEmoji(): boolean {
    if (this._supportsEmoji !== null) {
      return this._supportsEmoji;
    }
    
    // Emoji support is more limited than Unicode
    const emojiIndicators = {
      // VS Code has good emoji support
      isVSCode: process.env.TERM_PROGRAM === 'vscode',
      
      // Modern Windows Terminal
      isWindowsTerminal: process.env.WT_SESSION !== undefined,
      
      // macOS terminals generally support emoji
      isMacOS: process.platform === 'darwin',
      
      // Some Linux terminals support emoji
      isLinuxWithEmoji: process.platform === 'linux' && 
                       (process.env.TERM_PROGRAM === 'gnome-terminal' ||
                        process.env.COLORTERM === 'truecolor'),
      
      // Explicitly disabled emoji
      isEmojiDisabled: process.env.DISABLE_EMOJI === 'true' ||
                      process.env.ASCII_ONLY === 'true',
      
      // CI environments usually don't display emoji well
      isCI: process.env.CI === 'true'
    };
    
    // In test environment, check for forced detection first
    if (process.env.FORCE_EMOJI_DETECTION === 'true') {
      this._supportsEmoji = true;
      return this._supportsEmoji;
    }
    
    if (process.env.FORCE_EMOJI_DETECTION === 'false') {
      this._supportsEmoji = false;
      return this._supportsEmoji;
    }
    
    // In test environment without force, default to false
    if (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true') {
      this._supportsEmoji = false;
      return this._supportsEmoji;
    }
    
    this._supportsEmoji = 
      this.supportsUnicode() &&
      !emojiIndicators.isEmojiDisabled &&
      !emojiIndicators.isCI &&
      (emojiIndicators.isVSCode || 
       emojiIndicators.isWindowsTerminal || 
       emojiIndicators.isMacOS || 
       emojiIndicators.isLinuxWithEmoji);
    
    return this._supportsEmoji;
  }
  
  /**
   * Reset cached detection (useful for testing)
   */
  static reset(): void {
    this._supportsUnicode = null;
    this._supportsEmoji = null;
  }
  
  /**
   * Get platform info for debugging
   */
  static getInfo() {
    return {
      platform: process.platform,
      isTTY: process.stdout.isTTY,
      termProgram: process.env.TERM_PROGRAM,
      term: process.env.TERM,
      colorTerm: process.env.COLORTERM,
      wtSession: process.env.WT_SESSION,
      isCI: process.env.CI,
      supportsUnicode: this.supportsUnicode(),
      supportsEmoji: this.supportsEmoji()
    };
  }
}

/**
 * Icon provider with automatic fallbacks
 */
export class IconProvider {
  private static icons: ExtendedIcons;
  
  /**
   * Get icons with appropriate fallbacks based on platform capabilities
   */
  static getIcons(): ExtendedIcons {
    if (this.icons) {
      return this.icons;
    }
    
    const supportsUnicode = PlatformCapabilities.supportsUnicode();
    const supportsEmoji = PlatformCapabilities.supportsEmoji();
    
    // Choose symbol set based on capabilities
    const symbols = supportsUnicode ? mainSymbols : fallbackSymbols;
    
    this.icons = {
      // Basic status (from figures)
      tick: symbols.tick,
      cross: symbols.cross,
      warning: symbols.warning,
      info: symbols.info,
      
      // Extended icons with smart fallbacks
      rocket: supportsEmoji ? '🚀' : (supportsUnicode ? '▲' : '^'),
      cloud: supportsEmoji ? '☁️' : (supportsUnicode ? '◯' : 'O'),
      box: supportsEmoji ? '📦' : (supportsUnicode ? symbols.square : '#'),
      folder: supportsEmoji ? '📁' : (supportsUnicode ? '◆' : '+'),
      file: supportsEmoji ? '📄' : (supportsUnicode ? '◻' : '-'),
      gear: supportsEmoji ? '⚙️' : (supportsUnicode ? '◉' : '*'),
      lightning: supportsEmoji ? '⚡' : (supportsUnicode ? '※' : '!'),
      shield: supportsEmoji ? '🛡️' : (supportsUnicode ? '◈' : '#'),
      key: supportsEmoji ? '🔑' : (supportsUnicode ? '♦' : 'K'),
      lock: supportsEmoji ? '🔒' : (supportsUnicode ? '■' : 'L'),
      globe: supportsEmoji ? '🌍' : (supportsUnicode ? '◯' : 'G'),
      network: supportsEmoji ? '🌐' : (supportsUnicode ? '◇' : 'N'),
      database: supportsEmoji ? '💾' : (supportsUnicode ? '◼' : 'D'),
      server: supportsEmoji ? '🖥️' : (supportsUnicode ? '▣' : 'S'),
      api: supportsEmoji ? '🔗' : (supportsUnicode ? '◊' : 'A'),
      upload: supportsEmoji ? '⬆️' : symbols.arrowUp,
      download: supportsEmoji ? '⬇️' : symbols.arrowDown,
      sync: supportsEmoji ? '🔄' : (supportsUnicode ? '◐' : '~'),
      build: supportsEmoji ? '🔨' : (supportsUnicode ? '▲' : 'B'),
      deploy: supportsEmoji ? '🚀' : symbols.play,
      success: supportsEmoji ? '✅' : symbols.tick,
      failure: supportsEmoji ? '❌' : symbols.cross,
      pending: supportsEmoji ? '⏳' : (supportsUnicode ? '◯' : 'P'),
      skip: supportsEmoji ? '⏭️' : (supportsUnicode ? '▶' : 'S'),
      
      // Decorative
      sparkle: supportsEmoji ? '✨' : (supportsUnicode ? '※' : '*'),
      diamond: supportsEmoji ? '💎' : symbols.lozenge,
      crown: supportsEmoji ? '👑' : (supportsUnicode ? '◆' : 'C'),
      trophy: supportsEmoji ? '🏆' : (supportsUnicode ? '♦' : 'T')
    };
    
    return this.icons;
  }
  
  /**
   * Get a specific icon with fallback
   */
  static get(iconName: keyof ExtendedIcons): string {
    return this.getIcons()[iconName];
  }
  
  /**
   * Reset cached icons (useful for testing different platforms)
   */
  static reset(): void {
    this.icons = undefined as any;
    PlatformCapabilities.reset();
  }
  
  /**
   * Test icon display (useful for debugging)
   */
  static testDisplay(): void {
    const icons = this.getIcons();
    const platform = PlatformCapabilities.getInfo();
    
    console.log('Platform Info:', platform);
    console.log('\\nIcon Test:');
    
    Object.entries(icons).forEach(([name, icon]) => {
      console.log(`${name.padEnd(12)} │ ${icon} │ ${icon.charCodeAt(0).toString(16)}`);
    });
  }
}

/**
 * Security considerations for icon usage
 */
export class IconSecurity {
  /**
   * Sanitize icon input to prevent injection attacks
   */
  static sanitizeIcon(input: string): string {
    if (typeof input !== 'string') return '';
    
    let sanitized = input;
    
    // Remove all ANSI escape sequences (comprehensive patterns)
    // CSI sequences: ESC [ parameters command
    sanitized = sanitized.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '');
    // OSC sequences: ESC ] ... BEL or ESC ] ... ST
    sanitized = sanitized.replace(/\x1b\][^\x07\x1b]*[\x07]/g, '');
    sanitized = sanitized.replace(/\x1b\][^\x9c\x1b]*\x9c/g, '');
    // String sequences: DCS, SOS, PM, APC
    sanitized = sanitized.replace(/\x1b[PX^_][^\x9c]*\x9c/g, '');
    // Single character sequences
    sanitized = sanitized.replace(/\x1b[=>c78HM]/g, '');
    // Character set sequences
    sanitized = sanitized.replace(/\x1b\([AB012]/g, '');
    
    // Remove any remaining escape characters
    sanitized = sanitized.replace(/\x1b/g, '');
    
    // Remove all control characters (0x00-0x1F and 0x7F-0x9F)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
    
    // Remove dangerous Unicode characters
    // Byte Order Mark and other format characters
    sanitized = sanitized.replace(/[\uFEFF\uFFFE\uFFFF]/g, '');
    // Private Use Areas
    sanitized = sanitized.replace(/[\uE000-\uF8FF]/g, '');
    // Zero-width and invisible characters (dangerous even in General Punctuation range)
    sanitized = sanitized.replace(/[\u200B\u200C\u200D\u2028\u2029]/g, '');
    
    // Only allow specific Unicode ranges for safety
    const allowedRanges = [
      // Basic Latin (printable)
      [0x0020, 0x007E],
      // Latin-1 Supplement  
      [0x00A0, 0x00FF],
      // General Punctuation
      [0x2000, 0x206F],
      // Arrows (for figures library symbols)
      [0x2190, 0x21FF],
      // Mathematical Operators
      [0x2200, 0x22FF],
      // Miscellaneous Technical
      [0x2300, 0x23FF],
      // Box Drawing
      [0x2500, 0x257F],
      // Block Elements
      [0x2580, 0x259F],
      // Geometric Shapes
      [0x25A0, 0x25FF],
      // Miscellaneous Symbols
      [0x2600, 0x26FF],
      // Dingbats
      [0x2700, 0x27BF],
      // Miscellaneous Symbols and Arrows (includes emoji arrows)
      [0x2B00, 0x2BFF],
      // Variation Selectors (for emoji variation selectors)
      [0xFE00, 0xFE0F],
      // Emoji ranges (basic)
      [0x1F300, 0x1F5FF],
      [0x1F600, 0x1F64F],
      [0x1F680, 0x1F6FF],
      [0x1F700, 0x1F77F],
    ];
    
    const filtered = Array.from(sanitized)
      .filter(char => {
        const code = char.codePointAt(0) || 0;
        return allowedRanges.some(([min, max]) => code >= min && code <= max);
      })
      .join('');
      
    // Limit length to prevent abuse and return sanitized result
    return filtered.slice(0, 10);
  }
  
  /**
   * Validate that an icon is safe to display
   */
  static isValidIcon(icon: string): boolean {
    if (typeof icon !== 'string' || !icon || icon.length > 10) return false;
    
    // Check for control characters
    if (/[\x00-\x1F\x7F-\x9F]/.test(icon)) return false;
    
    // Check for ANSI escape sequences (comprehensive check)
    if (/\x1b/.test(icon)) return false;
    
    // Check for dangerous Unicode characters
    if (/[\uFEFF\uFFFE\uFFFF]/.test(icon)) return false;
    
    // Icon should remain unchanged after sanitization (or be rejected)
    const sanitized = this.sanitizeIcon(icon);
    return sanitized.length > 0 && sanitized === icon;
  }
  
  /**
   * Get security analysis of icon usage
   */
  static analyzeIconSecurity(text: string) {
    // Handle invalid inputs safely
    if (typeof text !== 'string') {
      return {
        isSecure: false,
        issues: ['Invalid input type'],
        warnings: [],
        stats: {
          characterCount: 0,
          byteLength: 0,
          hasEmoji: false
        }
      };
    }
    
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // Check for potential issues
    if (/[\x00-\x1F\x7F-\x9F]/.test(text)) {
      issues.push('Contains control characters');
    }
    
    if (/\x1b/.test(text)) {
      issues.push('Contains ANSI escape sequences');
    }
    
    if (text.length > 100) {
      warnings.push('Text is very long');
    }
    
    const unicodeCount = Array.from(text).length;
    const byteLength = Buffer.byteLength(text, 'utf8');
    
    if (byteLength > unicodeCount * 4) {
      warnings.push('Contains complex Unicode that may not display correctly');
    }
    
    return {
      isSecure: issues.length === 0,
      issues,
      warnings,
      stats: {
        characterCount: unicodeCount,
        byteLength,
        hasEmoji: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(text)
      }
    };
  }
}

// Export common patterns
export const icons = IconProvider.getIcons();
export const platformInfo = PlatformCapabilities.getInfo();

// Note: Classes are already exported above, no need to re-export