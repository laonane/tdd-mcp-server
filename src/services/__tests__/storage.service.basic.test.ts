import { StorageService } from '../storage.service';
import { Feature, FeatureStatus, FeaturePriority } from '../../types/storage';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

// Mock fs-extra
jest.mock('fs-extra');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('StorageService - Basic Tests', () => {
  let storageService: StorageService;
  let mockProjectId: string;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProjectId = 'test-project-123';
    storageService = new StorageService();
    
    // Setup default mocks
    mockFs.ensureDir.mockResolvedValue(undefined);
    mockFs.pathExists.mockResolvedValue(false);
    mockFs.appendFile.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.readdir.mockResolvedValue([]);
  });

  describe('saveFeature', () => {
    it('should save a valid feature', async () => {
      // Arrange
      const mockFeature: Feature = {
        id: 'feature-123',
        projectId: mockProjectId,
        name: 'User Authentication',
        description: 'Implement user login',
        status: FeatureStatus.IN_PROGRESS,
        priority: FeaturePriority.HIGH,
        acceptanceCriteria: ['User can login'],
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z')
      };

      // Act
      await storageService.saveFeature(mockFeature);

      // Assert
      expect(mockFs.ensureDir).toHaveBeenCalled();
      expect(mockFs.appendFile).toHaveBeenCalled();
    });

    it('should reject invalid feature data', async () => {
      // Arrange
      const invalidFeature = {
        name: 'Test Feature'
        // Missing required fields
      } as any;

      // Act & Assert
      await expect(storageService.saveFeature(invalidFeature))
        .rejects.toThrow('Invalid feature data');
    });
  });

  describe('listFeatures', () => {
    it('should return empty array when no file exists', async () => {
      // Arrange
      mockFs.pathExists.mockResolvedValue(false);

      // Act
      const result = await storageService.listFeatures(mockProjectId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should parse features from JSONL file', async () => {
      // Arrange
      const mockFeature: Feature = {
        id: 'feature-123',
        projectId: mockProjectId,
        name: 'User Authentication',
        description: 'Implement user login',
        status: FeatureStatus.IN_PROGRESS,
        priority: FeaturePriority.HIGH,
        acceptanceCriteria: ['User can login'],
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z')
      };
      
      const jsonlContent = JSON.stringify(mockFeature) + '\n';
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue(jsonlContent);

      // Act
      const result = await storageService.listFeatures(mockProjectId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockFeature.id);
    });
  });
});