import { v4 as uuidv4 } from 'uuid';
import { StorageService } from './storage.service';
import { 
  Feature, 
  FeatureStatus, 
  FeaturePriority, 
  FileAssociation,
  CreateFeatureParams,
  UpdateFeatureStatusParams,
  LinkFeatureFilesParams
} from '../types/storage';

export interface SimilarFeature {
  feature: Feature;
  similarity: number;
  reasons: string[];
}

export class FeatureManagementService {
  private storageService: StorageService;
  private currentProjectId?: string;

  constructor(storageService?: StorageService) {
    this.storageService = storageService || new StorageService();
  }

  /**
   * 创建新的功能特性
   */
  async createFeature(params: CreateFeatureParams): Promise<Feature> {
    // 验证输入
    if (!params.name || params.name.trim().length === 0) {
      throw new Error('Feature name cannot be empty');
    }

    if (!params.acceptanceCriteria || params.acceptanceCriteria.length === 0) {
      throw new Error('Feature must have at least one acceptance criteria');
    }

    // 生成项目ID（如果未提供）
    const projectId = params.projectId || this.currentProjectId || this.generateProjectId();

    // 创建功能特性对象
    const now = new Date();
    const feature: Feature = {
      id: uuidv4(),
      projectId,
      name: params.name.trim(),
      description: params.description.trim(),
      status: FeatureStatus.PLANNING,
      priority: params.priority || FeaturePriority.MEDIUM,
      acceptanceCriteria: params.acceptanceCriteria.map(criteria => criteria.trim()),
      createdAt: now,
      updatedAt: now,
      tags: params.tags || [],
      estimatedHours: params.estimatedHours,
      assignee: params.assignee
    };

    // 保存到存储
    await this.storageService.saveFeature(feature);

    return feature;
  }

  /**
   * 更新功能特性状态
   */
  async updateFeatureStatus(params: UpdateFeatureStatusParams): Promise<Feature> {
    // 加载现有功能特性
    const existingFeature = await this.storageService.loadFeature(params.featureId);
    if (!existingFeature) {
      throw new Error(`Feature not found: ${params.featureId}`);
    }

    // 更新功能特性
    // 更新功能特性
    const updatedFeature: Feature = {
      ...existingFeature,
      status: params.status,
      updatedAt: new Date()
    };

    // 如果提供了进度信息，更新进度
    if (params.progress) {
      const existingProgress = existingFeature.progress || {
        testsWritten: 0,
        testsPass: 0,
        implementationFiles: []
      };
      
      updatedFeature.progress = {
        testsWritten: params.progress.testsWritten ?? existingProgress.testsWritten,
        testsPass: params.progress.testsPass ?? existingProgress.testsPass,
        implementationFiles: params.progress.implementationFiles ?? existingProgress.implementationFiles,
        coveragePercentage: params.progress.coveragePercentage ?? existingProgress.coveragePercentage
      };
    }

    // 保存更新后的功能特性
    await this.storageService.saveFeature(updatedFeature);

    return updatedFeature;
  }

  /**
   * 关联文件到功能特性
   */
  async linkFeatureFiles(params: LinkFeatureFilesParams): Promise<FileAssociation[]> {
    if (!params.filePaths || params.filePaths.length === 0) {
      throw new Error('At least one file path must be provided');
    }

    const associations: FileAssociation[] = [];
    const now = new Date();

    for (const filePath of params.filePaths) {
      const association: FileAssociation = {
        id: uuidv4(),
        featureId: params.featureId,
        projectId: this.currentProjectId || 'default-project',
        filePath: filePath.trim(),
        fileType: params.fileType,
        createdAt: now,
        lastModified: now,
        size: 0,
        lineCount: undefined
      };

      await this.storageService.saveFileAssociation(association);
      associations.push(association);
    }

    return associations;
  }

  /**
   * 查找相似的功能特性
   */
  async findSimilarFeatures(
    query: string, 
    projectId: string, 
    maxResults: number = 10,
    minSimilarity: number = 0.3
  ): Promise<SimilarFeature[]> {
    const features = await this.storageService.listFeatures(projectId);
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);

    const similarities: SimilarFeature[] = [];

    for (const feature of features) {
      const similarity = this.calculateFeatureSimilarity(feature, queryWords, queryLower);
      
      if (similarity.score >= minSimilarity) {
        similarities.push({
          feature,
          similarity: similarity.score,
          reasons: similarity.reasons
        });
      }
    }

    // 按相似度排序并限制结果数量
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);
  }

  /**
   * 计算功能特性与查询的相似度
   */
  private calculateFeatureSimilarity(
    feature: Feature, 
    queryWords: string[], 
    queryLower: string
  ): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let totalScore = 0;
    let maxPossibleScore = 0;

    // 1. 名称相似度 (权重: 40%)
    const nameScore = this.calculateTextSimilarity(feature.name.toLowerCase(), queryLower, queryWords);
    totalScore += nameScore * 0.4;
    maxPossibleScore += 0.4;
    if (nameScore > 0.3) {
      reasons.push(`Name similarity: ${(nameScore * 100).toFixed(1)}%`);
    }

    // 2. 描述相似度 (权重: 30%)
    const descriptionScore = this.calculateTextSimilarity(feature.description.toLowerCase(), queryLower, queryWords);
    totalScore += descriptionScore * 0.3;
    maxPossibleScore += 0.3;
    if (descriptionScore > 0.3) {
      reasons.push(`Description similarity: ${(descriptionScore * 100).toFixed(1)}%`);
    }

    // 3. 标签匹配 (权重: 20%)
    if (feature.tags && feature.tags.length > 0) {
      const tagScore = this.calculateTagSimilarity(feature.tags, queryWords);
      totalScore += tagScore * 0.2;
      maxPossibleScore += 0.2;
      if (tagScore > 0) {
        reasons.push(`Tag matches found`);
      }
    }

    // 4. 验收条件相似度 (权重: 10%)
    const criteriaText = feature.acceptanceCriteria.join(' ').toLowerCase();
    const criteriaScore = this.calculateTextSimilarity(criteriaText, queryLower, queryWords);
    totalScore += criteriaScore * 0.1;
    maxPossibleScore += 0.1;
    if (criteriaScore > 0.3) {
      reasons.push(`Acceptance criteria similarity: ${(criteriaScore * 100).toFixed(1)}%`);
    }

    const normalizedScore = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
    
    return {
      score: Math.min(normalizedScore, 1), // 确保分数不超过1
      reasons
    };
  }

  /**
   * 计算文本相似度
   */
  private calculateTextSimilarity(text: string, query: string, queryWords: string[]): number {
    if (!text || !query) return 0;

    // 检查完全匹配
    if (text.includes(query)) {
      return 1;
    }

    // 计算单词匹配度
    const textWords = text.split(/\s+/).map(word => word.toLowerCase());
    let matchedWords = 0;
    let partialMatches = 0;

    for (const queryWord of queryWords) {
      const queryWordLower = queryWord.toLowerCase();
      
      // 完全匹配
      if (textWords.some(textWord => textWord === queryWordLower)) {
        matchedWords += 1;
      }
      // 部分匹配（包含关系）
      else if (textWords.some(textWord => 
        textWord.includes(queryWordLower) || queryWordLower.includes(textWord)
      )) {
        partialMatches += 0.7; // 部分匹配权重较低
      }
    }

    const totalScore = matchedWords + partialMatches;
    return queryWords.length > 0 ? Math.min(totalScore / queryWords.length, 1) : 0;
  }

  /**
   * 计算标签相似度
   */
  private calculateTagSimilarity(tags: string[], queryWords: string[]): number {
    if (!tags || tags.length === 0 || queryWords.length === 0) return 0;

    const tagLower = tags.map(tag => tag.toLowerCase());
    let matchedWords = 0;
    let partialMatches = 0;

    for (const queryWord of queryWords) {
      const queryWordLower = queryWord.toLowerCase();
      
      // 完全匹配标签
      if (tagLower.some(tag => tag === queryWordLower)) {
        matchedWords += 1;
      }
      // 部分匹配标签
      else if (tagLower.some(tag => tag.includes(queryWordLower) || queryWordLower.includes(tag))) {
        partialMatches += 0.8; // 标签部分匹配权重较高
      }
    }

    const totalScore = matchedWords + partialMatches;
    return Math.min(totalScore / queryWords.length, 1);
  }

  /**
   * 生成项目ID
   */
  private generateProjectId(): string {
    return `project-${Date.now()}`;
  }

  /**
   * 设置当前项目
   */
  setCurrentProject(projectId: string): void {
    this.currentProjectId = projectId;
  }

  /**
   * 获取当前项目
   */
  getCurrentProject(): string | undefined {
    return this.currentProjectId;
  }

  /**
   * 获取功能特性
   */
  async getFeature(featureId: string): Promise<Feature | null> {
    return await this.storageService.loadFeature(featureId);
  }

  /**
   * 列出项目的所有功能特性
   */
  async listFeatures(projectId?: string): Promise<Feature[]> {
    const targetProjectId = projectId || this.currentProjectId;
    if (!targetProjectId) {
      throw new Error('No project ID provided and no current project set');
    }
    
    return await this.storageService.listFeatures(targetProjectId);
  }

  /**
   * 删除功能特性
   */
  async deleteFeature(featureId: string): Promise<boolean> {
    return await this.storageService.deleteFeature(featureId);
  }
}