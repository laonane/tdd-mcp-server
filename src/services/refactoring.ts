import {
  RefactoredCode,
  Refactoring,
} from '../types/tdd.js';

interface RefactoringParams {
  sourceCode: string;
  refactorType: 'extract_method' | 'remove_duplication' | 'improve_naming' | 'simplify_conditional' | 'extract_class' | 'move_method';
  preserveTests: boolean;
  refactoringGoals: string[];
}

export class RefactoringService {
  async refactorCode(params: RefactoringParams): Promise<RefactoredCode> {
    const { sourceCode, refactorType, preserveTests, refactoringGoals } = params;

    // Analyze the source code
    const analysis = this.analyzeCode(sourceCode);
    
    // Generate refactoring suggestions
    const refactorings = await this.generateRefactorings(
      sourceCode,
      refactorType,
      analysis,
      refactoringGoals
    );

    // Apply refactorings
    const refactoredCode = this.applyRefactorings(sourceCode, refactorings);

    // Verify that tests are preserved if requested
    if (preserveTests) {
      this.verifyTestCompatibility(sourceCode, refactoredCode);
    }

    return {
      originalCode: sourceCode,
      refactoredCode,
      refactorings,
      preservesTests: preserveTests,
      metadata: {
        refactoredAt: new Date(),
        refactoringGoals,
      },
    };
  }

  private analyzeCode(sourceCode: string): CodeAnalysis {
    return {
      language: this.detectLanguage(sourceCode),
      complexity: this.calculateComplexity(sourceCode),
      duplications: this.findDuplications(sourceCode),
      longMethods: this.findLongMethods(sourceCode),
      largeClasses: this.findLargeClasses(sourceCode),
      badNaming: this.findBadNaming(sourceCode),
      complexConditionals: this.findComplexConditionals(sourceCode),
    };
  }

  private detectLanguage(sourceCode: string): string {
    // Simple language detection based on syntax patterns
    if (sourceCode.includes('function ') || sourceCode.includes('const ') || sourceCode.includes('let ')) {
      if (sourceCode.includes(': ') && sourceCode.includes('interface ')) {
        return 'typescript';
      }
      return 'javascript';
    } else if (sourceCode.includes('def ') || sourceCode.includes('class ') && sourceCode.includes('self')) {
      return 'python';
    } else if (sourceCode.includes('public class ') || sourceCode.includes('private ') || sourceCode.includes('public ')) {
      return 'java';
    } else if (sourceCode.includes('public class ') && sourceCode.includes('using ')) {
      return 'csharp';
    } else if (sourceCode.includes('func ') || sourceCode.includes('type ') || sourceCode.includes('package ')) {
      return 'go';
    } else if (sourceCode.includes('fn ') || sourceCode.includes('impl ') || sourceCode.includes('struct ')) {
      return 'rust';
    }
    
    return 'unknown';
  }

  private calculateComplexity(sourceCode: string): number {
    // Simplified cyclomatic complexity calculation
    let complexity = 1; // Base complexity
    
    // Count decision points
    const decisionPatterns = [
      /if\s*\(/g,
      /else\s+if/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /switch\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /\&\&/g,
      /\|\|/g,
      /\?/g, // Ternary operator
    ];

    for (const pattern of decisionPatterns) {
      const matches = sourceCode.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private findDuplications(sourceCode: string): DuplicationInfo[] {
    const duplications: DuplicationInfo[] = [];
    const lines = sourceCode.split('\n');
    const minBlockSize = 3;

    // Simple duplication detection
    for (let i = 0; i < lines.length - minBlockSize; i++) {
      for (let j = i + minBlockSize; j < lines.length - minBlockSize; j++) {
        const blockSize = this.findMatchingBlock(lines, i, j);
        if (blockSize >= minBlockSize) {
          duplications.push({
            startLine1: i + 1,
            endLine1: i + blockSize,
            startLine2: j + 1,
            endLine2: j + blockSize,
            size: blockSize,
            content: lines.slice(i, i + blockSize).join('\n'),
          });
        }
      }
    }

    // Remove overlapping duplications
    return this.removeDuplicationOverlaps(duplications);
  }

  private findMatchingBlock(lines: string[], start1: number, start2: number): number {
    let blockSize = 0;
    
    while (start1 + blockSize < lines.length && 
           start2 + blockSize < lines.length && 
           lines[start1 + blockSize].trim() === lines[start2 + blockSize].trim() &&
           lines[start1 + blockSize].trim() !== '') {
      blockSize++;
    }
    
    return blockSize;
  }

  private removeDuplicationOverlaps(duplications: DuplicationInfo[]): DuplicationInfo[] {
    // Sort by size (largest first) and remove overlaps
    const sorted = duplications.sort((a, b) => b.size - a.size);
    const result: DuplicationInfo[] = [];
    
    for (const dup of sorted) {
      const overlaps = result.some(existing => 
        this.duplicationsOverlap(dup, existing)
      );
      
      if (!overlaps) {
        result.push(dup);
      }
    }
    
    return result;
  }

  private duplicationsOverlap(dup1: DuplicationInfo, dup2: DuplicationInfo): boolean {
    return (dup1.startLine1 <= dup2.endLine1 && dup1.endLine1 >= dup2.startLine1) ||
           (dup1.startLine2 <= dup2.endLine2 && dup1.endLine2 >= dup2.startLine2);
  }

  private findLongMethods(sourceCode: string): MethodInfo[] {
    const methods: MethodInfo[] = [];
    const language = this.detectLanguage(sourceCode);
    
    let methodPattern: RegExp;
    
    switch (language) {
      case 'javascript':
      case 'typescript':
        methodPattern = /function\s+(\w+)\s*\([^)]*\)\s*\{|(\w+)\s*\([^)]*\)\s*\{|(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{/g;
        break;
      case 'python':
        methodPattern = /def\s+(\w+)\s*\([^)]*\):/g;
        break;
      case 'java':
      case 'csharp':
        methodPattern = /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\([^)]*\)\s*\{/g;
        break;
      default:
        methodPattern = /function\s+(\w+)/g;
    }

    const lines = sourceCode.split('\n');
    let match;
    
    while ((match = methodPattern.exec(sourceCode)) !== null) {
      const methodName = match[1] || match[2] || match[3] || 'unknown';
      const startIndex = match.index;
      const startLine = sourceCode.substring(0, startIndex).split('\n').length;
      
      // Find method end (simplified)
      const methodEndIndex = this.findMethodEnd(sourceCode, startIndex, language);
      const endLine = sourceCode.substring(0, methodEndIndex).split('\n').length;
      const methodLength = endLine - startLine + 1;
      
      if (methodLength > 20) { // Methods longer than 20 lines are considered long
        methods.push({
          name: methodName,
          startLine,
          endLine,
          length: methodLength,
          complexity: this.calculateMethodComplexity(
            sourceCode.substring(startIndex, methodEndIndex)
          ),
        });
      }
    }

    return methods;
  }

  private findMethodEnd(sourceCode: string, startIndex: number, language: string): number {
    // Simplified method end detection
    if (language === 'python') {
      // For Python, find the next unindented line or function
      const lines = sourceCode.substring(startIndex).split('\n');
      let baseIndent = -1;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '') continue;
        
        const indent = line.length - line.trimLeft().length;
        
        if (baseIndent === -1 && line.trim() !== '') {
          baseIndent = indent;
        }
        
        if (indent <= 0 && line.trim() !== '' && !line.startsWith(' ')) {
          return startIndex + lines.slice(0, i).join('\n').length;
        }
      }
    } else {
      // For brace-based languages, count braces
      let braceCount = 0;
      let inString = false;
      let stringChar = '';
      
      for (let i = startIndex; i < sourceCode.length; i++) {
        const char = sourceCode[i];
        
        if (inString) {
          if (char === stringChar && sourceCode[i - 1] !== '\\') {
            inString = false;
          }
          continue;
        }
        
        if (char === '"' || char === "'" || char === '`') {
          inString = true;
          stringChar = char;
          continue;
        }
        
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            return i + 1;
          }
        }
      }
    }
    
    return sourceCode.length;
  }

  private calculateMethodComplexity(methodCode: string): number {
    return this.calculateComplexity(methodCode);
  }

  private findLargeClasses(sourceCode: string): ClassInfo[] {
    const classes: ClassInfo[] = [];
    const language = this.detectLanguage(sourceCode);
    
    let classPattern: RegExp;
    
    switch (language) {
      case 'javascript':
      case 'typescript':
        classPattern = /class\s+(\w+)(?:\s+extends\s+\w+)?\s*\{/g;
        break;
      case 'python':
        classPattern = /class\s+(\w+)(?:\([^)]*\))?\s*:/g;
        break;
      case 'java':
      case 'csharp':
        classPattern = /(?:public|private|protected)?\s*class\s+(\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+[\w,\s]+)?\s*\{/g;
        break;
      default:
        classPattern = /class\s+(\w+)/g;
    }

    let match;
    
    while ((match = classPattern.exec(sourceCode)) !== null) {
      const className = match[1];
      const startIndex = match.index;
      const startLine = sourceCode.substring(0, startIndex).split('\n').length;
      
      const classEndIndex = this.findClassEnd(sourceCode, startIndex, language);
      const endLine = sourceCode.substring(0, classEndIndex).split('\n').length;
      const classLength = endLine - startLine + 1;
      
      // Count methods in class
      const classCode = sourceCode.substring(startIndex, classEndIndex);
      const methods = this.countMethodsInClass(classCode, language);
      
      if (classLength > 100 || methods > 10) { // Large class threshold
        classes.push({
          name: className,
          startLine,
          endLine,
          length: classLength,
          methodCount: methods,
        });
      }
    }

    return classes;
  }

  private findClassEnd(sourceCode: string, startIndex: number, language: string): number {
    // Similar to findMethodEnd but for classes
    return this.findMethodEnd(sourceCode, startIndex, language);
  }

  private countMethodsInClass(classCode: string, language: string): number {
    const methods = this.findLongMethods(classCode);
    return methods.length;
  }

  private findBadNaming(sourceCode: string): NamingIssue[] {
    const issues: NamingIssue[] = [];
    
    // Find variables/methods with bad names
    const badNames = [
      /\b[a-z]\b/g, // Single letter variables
      /\b(data|info|item|thing|stuff|temp|tmp)\d*\b/g, // Generic names
      /\b[A-Z]{2,}\b/g, // All caps (excluding constants)
    ];

    for (const pattern of badNames) {
      let match;
      while ((match = pattern.exec(sourceCode)) !== null) {
        const line = sourceCode.substring(0, match.index).split('\n').length;
        issues.push({
          name: match[0],
          line,
          type: 'variable',
          issue: 'Poor naming convention',
          suggestion: `Consider using a more descriptive name instead of "${match[0]}"`,
        });
      }
    }

    return issues;
  }

  private findComplexConditionals(sourceCode: string): ConditionalInfo[] {
    const conditionals: ConditionalInfo[] = [];
    
    // Find complex if statements
    const complexIfPattern = /if\s*\([^)]*(?:\&\&|\|\|)[^)]*(?:\&\&|\|\|)[^)]*\)/g;
    let match;
    
    while ((match = complexIfPattern.exec(sourceCode)) !== null) {
      const line = sourceCode.substring(0, match.index).split('\n').length;
      const conditionCount = (match[0].match(/(\&\&|\|\|)/g) || []).length + 1;
      
      conditionals.push({
        line,
        condition: match[0],
        complexity: conditionCount,
        suggestion: 'Consider extracting conditions into separate boolean variables',
      });
    }

    return conditionals;
  }

  private async generateRefactorings(
    sourceCode: string,
    refactorType: string,
    analysis: CodeAnalysis,
    goals: string[]
  ): Promise<Refactoring[]> {
    const refactorings: Refactoring[] = [];

    switch (refactorType) {
      case 'extract_method':
        refactorings.push(...this.generateExtractMethodRefactorings(sourceCode, analysis));
        break;
      case 'remove_duplication':
        refactorings.push(...this.generateRemoveDuplicationRefactorings(sourceCode, analysis));
        break;
      case 'improve_naming':
        refactorings.push(...this.generateImproveNamingRefactorings(sourceCode, analysis));
        break;
      case 'simplify_conditional':
        refactorings.push(...this.generateSimplifyConditionalRefactorings(sourceCode, analysis));
        break;
      case 'extract_class':
        refactorings.push(...this.generateExtractClassRefactorings(sourceCode, analysis));
        break;
      case 'move_method':
        refactorings.push(...this.generateMoveMethodRefactorings(sourceCode, analysis));
        break;
    }

    return refactorings;
  }

  private generateExtractMethodRefactorings(sourceCode: string, analysis: CodeAnalysis): Refactoring[] {
    const refactorings: Refactoring[] = [];
    
    for (const method of analysis.longMethods) {
      const lines = sourceCode.split('\n');
      const methodLines = lines.slice(method.startLine - 1, method.endLine);
      const methodCode = methodLines.join('\n');
      
      // Find code blocks that could be extracted
      const extractableBlocks = this.findExtractableBlocks(methodCode);
      
      for (const block of extractableBlocks) {
        refactorings.push({
          type: 'extract_method',
          description: `Extract method from lines ${method.startLine + block.startLine} to ${method.startLine + block.endLine}`,
          before: block.code,
          after: this.generateExtractedMethod(block.code, analysis.language),
          rationale: 'Reduce method length and improve readability',
          impact: 'medium',
        });
      }
    }

    return refactorings;
  }

  private generateRemoveDuplicationRefactorings(sourceCode: string, analysis: CodeAnalysis): Refactoring[] {
    const refactorings: Refactoring[] = [];
    
    for (const duplication of analysis.duplications) {
      refactorings.push({
        type: 'remove_duplication',
        description: `Remove code duplication between lines ${duplication.startLine1}-${duplication.endLine1} and ${duplication.startLine2}-${duplication.endLine2}`,
        before: duplication.content,
        after: this.generateDuplicationRemoval(duplication.content, analysis.language),
        rationale: 'Eliminate code duplication and improve maintainability',
        impact: 'high',
      });
    }

    return refactorings;
  }

  private generateImproveNamingRefactorings(sourceCode: string, analysis: CodeAnalysis): Refactoring[] {
    const refactorings: Refactoring[] = [];
    
    for (const naming of analysis.badNaming) {
      const suggestion = this.generateNamingSuggestion(naming.name, sourceCode);
      
      refactorings.push({
        type: 'improve_naming',
        description: `Improve naming: "${naming.name}" → "${suggestion}"`,
        before: naming.name,
        after: suggestion,
        rationale: naming.suggestion,
        impact: 'low',
      });
    }

    return refactorings;
  }

  private generateSimplifyConditionalRefactorings(sourceCode: string, analysis: CodeAnalysis): Refactoring[] {
    const refactorings: Refactoring[] = [];
    
    for (const conditional of analysis.complexConditionals) {
      const simplifiedCondition = this.simplifyCondition(conditional.condition);
      
      refactorings.push({
        type: 'simplify_conditional',
        description: `Simplify complex conditional at line ${conditional.line}`,
        before: conditional.condition,
        after: simplifiedCondition,
        rationale: conditional.suggestion,
        impact: 'medium',
      });
    }

    return refactorings;
  }

  private generateExtractClassRefactorings(sourceCode: string, analysis: CodeAnalysis): Refactoring[] {
    const refactorings: Refactoring[] = [];
    
    for (const largeClass of analysis.largeClasses) {
      refactorings.push({
        type: 'extract_class',
        description: `Extract class from large class "${largeClass.name}" (${largeClass.length} lines, ${largeClass.methodCount} methods)`,
        before: `Class ${largeClass.name} with ${largeClass.methodCount} methods`,
        after: `Split into ${largeClass.name} and ${largeClass.name}Helper classes`,
        rationale: 'Reduce class size and improve single responsibility principle',
        impact: 'high',
      });
    }

    return refactorings;
  }

  private generateMoveMethodRefactorings(sourceCode: string, analysis: CodeAnalysis): Refactoring[] {
    // This would involve more complex analysis to determine which methods should be moved
    return [];
  }

  private findExtractableBlocks(methodCode: string): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const lines = methodCode.split('\n');
    const minBlockSize = 5;

    // Simple heuristic: find blocks of consecutive non-trivial lines
    let blockStart = -1;
    let blockEnd = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.length > 0 && !line.startsWith('//') && !line.startsWith('*')) {
        if (blockStart === -1) {
          blockStart = i;
        }
        blockEnd = i;
      } else {
        if (blockStart !== -1 && blockEnd - blockStart + 1 >= minBlockSize) {
          blocks.push({
            startLine: blockStart,
            endLine: blockEnd,
            code: lines.slice(blockStart, blockEnd + 1).join('\n'),
          });
        }
        blockStart = -1;
        blockEnd = -1;
      }
    }

    return blocks;
  }

  private generateExtractedMethod(blockCode: string, language: string): string {
    const methodName = 'extractedMethod';
    
    switch (language) {
      case 'javascript':
      case 'typescript':
        return `private ${methodName}() {\n${blockCode}\n}\n\n// Replace original block with:\n${methodName}();`;
      case 'python':
        return `def ${methodName}(self):\n    ${blockCode.replace(/\n/g, '\n    ')}\n\n# Replace original block with:\nself.${methodName}()`;
      case 'java':
      case 'csharp':
        return `private void ${methodName}() {\n${blockCode}\n}\n\n// Replace original block with:\n${methodName}();`;
      default:
        return `// Extract this block into a separate method:\n${blockCode}`;
    }
  }

  private generateDuplicationRemoval(duplicatedCode: string, language: string): string {
    const methodName = 'sharedMethod';
    
    return `// Extract duplicated code into:\n${this.generateExtractedMethod(duplicatedCode, language)}`;
  }

  private generateNamingSuggestion(badName: string, sourceCode: string): string {
    // Simple naming suggestions
    const suggestions: Record<string, string> = {
      'data': 'userData',
      'info': 'userInfo',
      'item': 'listItem',
      'thing': 'object',
      'stuff': 'items',
      'temp': 'temporary',
      'tmp': 'temporary',
    };

    return suggestions[badName.toLowerCase()] || `${badName}Data`;
  }

  private simplifyCondition(condition: string): string {
    // Extract complex conditions into boolean variables
    const parts = condition.split(/(\&\&|\|\|)/).filter(part => part.trim() !== '');
    
    let result = '// Extract conditions:\n';
    const variables: string[] = [];
    
    for (let i = 0; i < parts.length; i += 2) {
      const conditionPart = parts[i].trim();
      if (conditionPart !== '&&' && conditionPart !== '||') {
        const varName = `isCondition${Math.floor(i / 2) + 1}`;
        result += `const ${varName} = ${conditionPart};\n`;
        variables.push(varName);
      }
    }
    
    result += `\nif (${variables.join(' && ')}) {`;
    return result;
  }

  private applyRefactorings(sourceCode: string, refactorings: Refactoring[]): string {
    let refactoredCode = sourceCode;
    
    // Apply refactorings (this is a simplified implementation)
    // In a real implementation, you would need more sophisticated code transformation
    for (const refactoring of refactorings) {
      if (refactoring.type === 'improve_naming') {
        // Simple find and replace for naming
        const regex = new RegExp(`\\b${refactoring.before}\\b`, 'g');
        refactoredCode = refactoredCode.replace(regex, refactoring.after);
      }
    }

    return refactoredCode;
  }

  private verifyTestCompatibility(originalCode: string, refactoredCode: string): void {
    // This would involve checking that the refactored code maintains the same public interface
    // For now, this is a placeholder
    
    const originalMethods = this.extractPublicMethods(originalCode);
    const refactoredMethods = this.extractPublicMethods(refactoredCode);
    
    for (const method of originalMethods) {
      if (!refactoredMethods.includes(method)) {
        throw new Error(`Refactoring would break tests: method "${method}" is no longer available`);
      }
    }
  }

  private extractPublicMethods(code: string): string[] {
    const methods: string[] = [];
    const methodPattern = /(?:public\s+)?(?:function\s+)?(\w+)\s*\(/g;
    let match;
    
    while ((match = methodPattern.exec(code)) !== null) {
      methods.push(match[1]);
    }
    
    return methods;
  }
}

// Type definitions for analysis results
interface CodeAnalysis {
  language: string;
  complexity: number;
  duplications: DuplicationInfo[];
  longMethods: MethodInfo[];
  largeClasses: ClassInfo[];
  badNaming: NamingIssue[];
  complexConditionals: ConditionalInfo[];
}

interface DuplicationInfo {
  startLine1: number;
  endLine1: number;
  startLine2: number;
  endLine2: number;
  size: number;
  content: string;
}

interface MethodInfo {
  name: string;
  startLine: number;
  endLine: number;
  length: number;
  complexity: number;
}

interface ClassInfo {
  name: string;
  startLine: number;
  endLine: number;
  length: number;
  methodCount: number;
}

interface NamingIssue {
  name: string;
  line: number;
  type: string;
  issue: string;
  suggestion: string;
}

interface ConditionalInfo {
  line: number;
  condition: string;
  complexity: number;
  suggestion: string;
}

interface CodeBlock {
  startLine: number;
  endLine: number;
  code: string;
}