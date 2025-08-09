import { FeatureManagementService } from '../feature-management.service';
import { StorageService } from '../storage.service';
import { 
  Feature, 
  FeatureStatus, 
  FeaturePriority, 
  CreateFeatureParams,
  UpdateFeatureStatusParams,
  LinkFeatureFilesParams
} from '../../types/storage';

// Mock StorageService
jest.mock('../storage.service');
const MockStorageService = StorageService as jest.MockedClass<typeof StorageService>;

describe('FeatureManagementService', () => {
  let featureManagementService: FeatureManagementService;
  let mockStorageService: jest.Mocked<StorageService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageService = new MockStorageService() as jest.Mocked<StorageService>;
    featureManagementService = new FeatureManagementService(mockStorageService);
  });

  describe('createFeature', () => {
    it('should create a feature with all required fields', async () => {
      // Arrange
      const params: CreateFeatureParams = {
        name: 'User Authentication',
        description: 'Implement user login and registration system',
        acceptanceCriteria: [
          'User can register with email and password',
          'User can login with valid credentials',
          'User receives error message for invalid credentials'
        ],
        priority: FeaturePriority.HIGH,
        projectId: 'project-123',
        tags: ['authentication', 'security'],
        estimatedHours: 20,
        assignee: 'john.doe'
      };

      const expectedFeature: Partial<Feature> = {
        name: params.name,
        description: params.description,
        acceptanceCriteria: params.acceptanceCriteria,
        priority: params.priority,
        projectId: params.projectId,
        status: FeatureStatus.PLANNING,
        tags: params.tags,
        estimatedHours: params.estimatedHours,
        assignee: params.assignee
      };

      mockStorageService.saveFeature.mockResolvedValue(undefined);

      // Act
      const result = await featureManagementService.createFeature(params);

      // Assert
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.name).toBe(expectedFeature.name);
      expect(result.description).toBe(expectedFeature.description);
      expect(result.status).toBe(FeatureStatus.PLANNING);
      expect(result.priority).toBe(expectedFeature.priority);
      expect(mockStorageService.saveFeature).toHaveBeenCalledWith(
        expect.objectContaining(expectedFeature)
      );
    });

    it('should create feature with default values when optional fields are missing', async () => {
      // Arrange
      const params: CreateFeatureParams = {
        name: 'Simple Feature',
        description: 'A simple feature description',
        acceptanceCriteria: ['Feature works correctly']
      };

      const currentProjectId = 'default-project';
      featureManagementService.setCurrentProject(currentProjectId);

      mockStorageService.saveFeature.mockResolvedValue(undefined);

      // Act
      const result = await featureManagementService.createFeature(params);

      // Assert
      expect(result.projectId).toBe(currentProjectId);
      expect(result.priority).toBe(FeaturePriority.MEDIUM);
      expect(result.status).toBe(FeatureStatus.PLANNING);
      expect(result.tags).toEqual([]);
      expect(result.assignee).toBeUndefined();
      expect(result.estimatedHours).toBeUndefined();
    });

    it('should throw error when name is empty', async () => {
      // Arrange
      const params: CreateFeatureParams = {
        name: '',
        description: 'Description',
        acceptanceCriteria: ['Criteria']
      };

      // Act & Assert
      await expect(featureManagementService.createFeature(params))
        .rejects.toThrow('Feature name cannot be empty');
    });

    it('should throw error when acceptance criteria is empty', async () => {
      // Arrange
      const params: CreateFeatureParams = {
        name: 'Feature Name',
        description: 'Description',
        acceptanceCriteria: []
      };

      // Act & Assert
      await expect(featureManagementService.createFeature(params))
        .rejects.toThrow('Feature must have at least one acceptance criteria');
    });
  });

  describe('updateFeatureStatus', () => {
    const mockFeature: Feature = {
      id: 'feature-123',
      projectId: 'project-123',
      name: 'Test Feature',
      description: 'Test Description',
      status: FeatureStatus.PLANNING,
      priority: FeaturePriority.MEDIUM,
      acceptanceCriteria: ['Test criteria'],
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z')
    };

    it('should update feature status successfully', async () => {
      // Arrange
      const params: UpdateFeatureStatusParams = {
        featureId: 'feature-123',
        status: FeatureStatus.IN_PROGRESS,
        progress: {
          testsWritten: 5,
          testsPass: 3,
          implementationFiles: ['auth.service.ts']
        },
        notes: 'Started working on authentication logic'
      };

      mockStorageService.loadFeature.mockResolvedValue(mockFeature);
      mockStorageService.saveFeature.mockResolvedValue(undefined);

      // Act
      const result = await featureManagementService.updateFeatureStatus(params);

      // Assert
      expect(result.status).toBe(FeatureStatus.IN_PROGRESS);
      expect(result.progress).toEqual(params.progress);
      expect(result.updatedAt).not.toEqual(mockFeature.updatedAt);
      expect(mockStorageService.saveFeature).toHaveBeenCalledWith(
        expect.objectContaining({
          id: params.featureId,
          status: params.status,
          progress: params.progress
        })
      );
    });

    it('should throw error when feature not found', async () => {
      // Arrange
      const params: UpdateFeatureStatusParams = {
        featureId: 'non-existent-feature',
        status: FeatureStatus.IN_PROGRESS
      };

      mockStorageService.loadFeature.mockResolvedValue(null);

      // Act & Assert
      await expect(featureManagementService.updateFeatureStatus(params))
        .rejects.toThrow('Feature not found: non-existent-feature');
    });
  });

  describe('linkFeatureFiles', () => {
    it('should create file associations for a feature', async () => {
      // Arrange
      const params: LinkFeatureFilesParams = {
        featureId: 'feature-123',
        filePaths: ['src/auth.service.ts', 'src/__tests__/auth.service.test.ts'],
        fileType: 'implementation'
      };

      mockStorageService.saveFileAssociation.mockResolvedValue(undefined);

      // Act
      const result = await featureManagementService.linkFeatureFiles(params);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].featureId).toBe(params.featureId);
      expect(result[0].filePath).toBe(params.filePaths[0]);
      expect(result[0].fileType).toBe(params.fileType);
      expect(result[1].filePath).toBe(params.filePaths[1]);
      expect(mockStorageService.saveFileAssociation).toHaveBeenCalledTimes(2);
    });

    it('should throw error for empty file paths', async () => {
      // Arrange
      const params: LinkFeatureFilesParams = {
        featureId: 'feature-123',
        filePaths: [],
        fileType: 'test'
      };

      // Act & Assert
      await expect(featureManagementService.linkFeatureFiles(params))
        .rejects.toThrow('At least one file path must be provided');
    });
  });

  describe('findSimilarFeatures', () => {
    const mockFeatures: Feature[] = [
      {
        id: 'feature-1',
        projectId: 'project-123',
        name: 'User Authentication System',
        description: 'Login and registration for users',
        status: FeatureStatus.COMPLETED,
        priority: FeaturePriority.HIGH,
        acceptanceCriteria: ['User can login', 'User can register'],
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['authentication', 'security', 'user']
      },
      {
        id: 'feature-2',
        projectId: 'project-123',
        name: 'Password Reset Feature',
        description: 'Allow users to reset their passwords',
        status: FeatureStatus.IN_PROGRESS,
        priority: FeaturePriority.MEDIUM,
        acceptanceCriteria: ['User can request password reset'],
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['authentication', 'password', 'email']
      },
      {
        id: 'feature-3',
        projectId: 'project-123',
        name: 'Product Catalog',
        description: 'Display products to customers',
        status: FeatureStatus.PLANNING,
        priority: FeaturePriority.LOW,
        acceptanceCriteria: ['Show product list'],
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['catalog', 'products', 'display']
      }
    ];

    it('should find features similar by name and description', async () => {
      // Arrange
      const query = 'user authentication login';
      mockStorageService.listFeatures.mockResolvedValue(mockFeatures);

      // Act
      const result = await featureManagementService.findSimilarFeatures(query, 'project-123', 10, 0.1);

      // Assert
      expect(result.length).toBeGreaterThanOrEqual(1);
      if (result.length >= 2) {
        expect(result[0].feature.id).toBe('feature-1');
        expect(result[1].feature.id).toBe('feature-2');
        expect(result[0].similarity).toBeGreaterThan(result[1].similarity);
      }
      expect(result[0].similarity).toBeGreaterThan(0.5);
    });

    it('should find features similar by tags', async () => {
      // Arrange
      const query = 'authentication security';
      mockStorageService.listFeatures.mockResolvedValue(mockFeatures);

      // Act
      const result = await featureManagementService.findSimilarFeatures(query, 'project-123', 10, 0.1);

      // Assert
      expect(result.length).toBeGreaterThanOrEqual(1);
      if (result.length >= 2) {
        expect(result.some(r => r.feature.id === 'feature-1')).toBe(true);
        expect(result.some(r => r.feature.id === 'feature-2')).toBe(true);
      }
      expect(result.every(r => r.similarity > 0)).toBe(true);
    });

    it('should return empty array when no similar features found', async () => {
      // Arrange
      const query = 'completely different unrelated topic';
      mockStorageService.listFeatures.mockResolvedValue(mockFeatures);

      // Act
      const result = await featureManagementService.findSimilarFeatures(query, 'project-123');

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should limit results to specified maximum', async () => {
      // Arrange
      const query = 'user authentication password';
      mockStorageService.listFeatures.mockResolvedValue(mockFeatures);

      // Act
      const result = await featureManagementService.findSimilarFeatures(query, 'project-123', 1);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].feature.id).toBe('feature-1'); // Should return the most similar
    });
  });

  describe('getCurrentProject and setCurrentProject', () => {
    it('should set and get current project', () => {
      // Arrange
      const projectId = 'project-456';

      // Act
      featureManagementService.setCurrentProject(projectId);
      const result = featureManagementService.getCurrentProject();

      // Assert
      expect(result).toBe(projectId);
    });

    it('should return undefined when no current project is set', () => {
      // Act
      const result = featureManagementService.getCurrentProject();

      // Assert
      expect(result).toBeUndefined();
    });
  });
});