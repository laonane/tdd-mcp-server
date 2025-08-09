import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { 
  Feature, 
  TDDSession, 
  TestMethod, 
  FileAssociation,
  FeatureStatus,
  TDDStage,
  TestExecutionResult,
  IStorageService,
  FeatureSchema,
  TDDSessionSchema,
  TestMethodSchema,
  FileAssociationSchema
} from '../types/storage';

export class StorageService implements IStorageService {
  private readonly baseStoragePath: string;

  constructor() {
    this.baseStoragePath = path.join(os.homedir(), '.tdd-flow', 'projects');
  }

  private getProjectPath(projectId: string): string {
    return path.join(this.baseStoragePath, projectId);
  }

  private getFeaturesPath(projectId: string): string {
    return path.join(this.getProjectPath(projectId), 'features.jsonl');
  }

  private getSessionsPath(projectId: string): string {
    return path.join(this.getProjectPath(projectId), 'tdd-sessions.jsonl');
  }

  private getTestMethodsPath(projectId: string): string {
    return path.join(this.getProjectPath(projectId), 'test-methods.jsonl');
  }

  private getFileAssociationsPath(projectId: string): string {
    return path.join(this.getProjectPath(projectId), 'session-files.jsonl');
  }

  private async ensureProjectDirectory(projectId: string): Promise<void> {
    const projectPath = this.getProjectPath(projectId);
    await fs.ensureDir(projectPath);
  }

  private async readJsonlFile<T>(filePath: string): Promise<T[]> {
    if (!(await fs.pathExists(filePath))) {
      return [];
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const items: T[] = [];

    for (const line of lines) {
      try {
        const item = JSON.parse(line);
        // Convert date strings back to Date objects
        this.restoreDates(item);
        items.push(item);
      } catch (error) {
        // Skip malformed JSON lines
        console.warn(`Skipping malformed JSON line: ${line}`);
      }
    }

    return items;
  }

  private restoreDates(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    const dateFields = ['createdAt', 'updatedAt', 'startedAt', 'completedAt', 'lastExecutedAt', 'lastModified'];
    
    for (const field of dateFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        obj[field] = new Date(obj[field]);
      }
    }

    // Recursively process nested objects
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object') {
        this.restoreDates(obj[key]);
      }
    }
  }

  private async writeJsonlFile<T>(filePath: string, items: T[]): Promise<void> {
    const content = items.map(item => JSON.stringify(item)).join('\n') + (items.length > 0 ? '\n' : '');
    await fs.writeFile(filePath, content);
  }

  private async appendToJsonlFile<T>(filePath: string, item: T): Promise<void> {
    const jsonLine = JSON.stringify(item) + '\n';
    await fs.appendFile(filePath, jsonLine);
  }

  private validateFeature(feature: any): void {
    const result = FeatureSchema.safeParse(feature);
    if (!result.success) {
      throw new Error(`Invalid feature data: ${result.error.message}`);
    }
  }

  // Feature Management
  async saveFeature(feature: Feature): Promise<void> {
    this.validateFeature(feature);
    await this.ensureProjectDirectory(feature.projectId);
    const filePath = this.getFeaturesPath(feature.projectId);
    await this.appendToJsonlFile(filePath, feature);
  }

  async loadFeature(id: string): Promise<Feature | null> {
    // We need to search through all projects to find the feature
    // For now, we'll extract projectId from the feature ID pattern or search all projects
    const projects = await this.listProjects();
    
    for (const projectId of projects) {
      const features = await this.listFeatures(projectId);
      const feature = features.find(f => f.id === id);
      if (feature) {
        return feature;
      }
    }
    
    return null;
  }

  async listFeatures(projectId: string): Promise<Feature[]> {
    const filePath = this.getFeaturesPath(projectId);
    const allFeatures = await this.readJsonlFile<Feature>(filePath);
    return allFeatures.filter(feature => feature.projectId === projectId);
  }

  async deleteFeature(id: string): Promise<boolean> {
    const projects = await this.listProjects();
    
    for (const projectId of projects) {
      const filePath = this.getFeaturesPath(projectId);
      const features = await this.readJsonlFile<Feature>(filePath);
      const featureIndex = features.findIndex(f => f.id === id);
      
      if (featureIndex !== -1) {
        features.splice(featureIndex, 1);
        await this.writeJsonlFile(filePath, features);
        return true;
      }
    }
    
    return false;
  }

  async updateFeatureStatus(id: string, status: FeatureStatus): Promise<boolean> {
    const projects = await this.listProjects();
    
    for (const projectId of projects) {
      const filePath = this.getFeaturesPath(projectId);
      const features = await this.readJsonlFile<Feature>(filePath);
      const feature = features.find(f => f.id === id);
      
      if (feature) {
        feature.status = status;
        feature.updatedAt = new Date();
        await this.writeJsonlFile(filePath, features);
        return true;
      }
    }
    
    return false;
  }

  // TDD Session Management
  async saveTDDSession(session: TDDSession): Promise<void> {
    const result = TDDSessionSchema.safeParse(session);
    if (!result.success) {
      throw new Error(`Invalid TDD session data: ${result.error.message}`);
    }
    
    await this.ensureProjectDirectory(session.projectId);
    const filePath = this.getSessionsPath(session.projectId);
    await this.appendToJsonlFile(filePath, session);
  }

  async loadTDDSession(id: string): Promise<TDDSession | null> {
    const projects = await this.listProjects();
    
    for (const projectId of projects) {
      const sessions = await this.listTDDSessions(projectId);
      const session = sessions.find(s => s.id === id);
      if (session) {
        return session;
      }
    }
    
    return null;
  }

  async listTDDSessions(projectId: string): Promise<TDDSession[]> {
    const filePath = this.getSessionsPath(projectId);
    return await this.readJsonlFile<TDDSession>(filePath);
  }

  async updateTDDSessionStage(id: string, stage: TDDStage): Promise<boolean> {
    const projects = await this.listProjects();
    
    for (const projectId of projects) {
      const filePath = this.getSessionsPath(projectId);
      const sessions = await this.readJsonlFile<TDDSession>(filePath);
      const session = sessions.find(s => s.id === id);
      
      if (session) {
        session.stage = stage;
        session.updatedAt = new Date();
        await this.writeJsonlFile(filePath, sessions);
        return true;
      }
    }
    
    return false;
  }

  // Test Method Management
  async registerTestMethod(method: TestMethod): Promise<void> {
    const result = TestMethodSchema.safeParse(method);
    if (!result.success) {
      throw new Error(`Invalid test method data: ${result.error.message}`);
    }
    
    await this.ensureProjectDirectory(method.projectId);
    const filePath = this.getTestMethodsPath(method.projectId);
    await this.appendToJsonlFile(filePath, method);
  }

  async loadTestMethod(id: string): Promise<TestMethod | null> {
    const projects = await this.listProjects();
    
    for (const projectId of projects) {
      const methods = await this.listTestMethods(''); // We need to search all features
      const method = methods.find(m => m.id === id);
      if (method) {
        return method;
      }
    }
    
    return null;
  }

  async listTestMethods(featureId: string): Promise<TestMethod[]> {
    // For now, we'll search through all projects
    // In a real implementation, we might need to pass projectId as well
    const projects = await this.listProjects();
    const allMethods: TestMethod[] = [];
    
    for (const projectId of projects) {
      const filePath = this.getTestMethodsPath(projectId);
      const methods = await this.readJsonlFile<TestMethod>(filePath);
      const filteredMethods = featureId ? methods.filter(m => m.featureId === featureId) : methods;
      allMethods.push(...filteredMethods);
    }
    
    return allMethods;
  }

  async updateTestExecutionResult(methodId: string, result: TestExecutionResult): Promise<boolean> {
    const projects = await this.listProjects();
    
    for (const projectId of projects) {
      const filePath = this.getTestMethodsPath(projectId);
      const methods = await this.readJsonlFile<TestMethod>(filePath);
      const method = methods.find(m => m.id === methodId);
      
      if (method) {
        method.executionResults = result;
        method.lastExecutedAt = new Date();
        method.status = result.passed ? 'passed' : 'failed';
        await this.writeJsonlFile(filePath, methods);
        return true;
      }
    }
    
    return false;
  }

  async updateTestMethodStatus(methodId: string, status: string): Promise<boolean> {
    const projects = await this.listProjects();
    
    for (const projectId of projects) {
      const filePath = this.getTestMethodsPath(projectId);
      const methods = await this.readJsonlFile<TestMethod>(filePath);
      const method = methods.find(m => m.id === methodId);
      
      if (method) {
        method.status = status as any; // Type assertion for now
        await this.writeJsonlFile(filePath, methods);
        return true;
      }
    }
    
    return false;
  }

  // File Association Management
  async saveFileAssociation(association: FileAssociation): Promise<void> {
    const result = FileAssociationSchema.safeParse(association);
    if (!result.success) {
      throw new Error(`Invalid file association data: ${result.error.message}`);
    }
    
    await this.ensureProjectDirectory(association.projectId);
    const filePath = this.getFileAssociationsPath(association.projectId);
    await this.appendToJsonlFile(filePath, association);
  }

  async listFileAssociations(featureId: string): Promise<FileAssociation[]> {
    const projects = await this.listProjects();
    const allAssociations: FileAssociation[] = [];
    
    for (const projectId of projects) {
      const filePath = this.getFileAssociationsPath(projectId);
      const associations = await this.readJsonlFile<FileAssociation>(filePath);
      const filteredAssociations = associations.filter(a => a.featureId === featureId);
      allAssociations.push(...filteredAssociations);
    }
    
    return allAssociations;
  }

  async deleteFileAssociation(id: string): Promise<boolean> {
    const projects = await this.listProjects();
    
    for (const projectId of projects) {
      const filePath = this.getFileAssociationsPath(projectId);
      const associations = await this.readJsonlFile<FileAssociation>(filePath);
      const associationIndex = associations.findIndex(a => a.id === id);
      
      if (associationIndex !== -1) {
        associations.splice(associationIndex, 1);
        await this.writeJsonlFile(filePath, associations);
        return true;
      }
    }
    
    return false;
  }

  // Helper method to list all projects
  private async listProjects(): Promise<string[]> {
    if (!(await fs.pathExists(this.baseStoragePath))) {
      return [];
    }
    
    const items = await fs.readdir(this.baseStoragePath, { withFileTypes: true });
    return items.filter(item => item.isDirectory()).map(item => item.name);
  }
}