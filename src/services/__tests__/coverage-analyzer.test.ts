import { CoverageAnalyzerService } from '../coverage-analyzer';
import * as fs from 'fs';

describe('CoverageAnalyzerService', () => {
  let coverageAnalyzer: CoverageAnalyzerService;

  beforeEach(() => {
    coverageAnalyzer = new CoverageAnalyzerService();
  });

  describe('analyzeCoverage', () => {
    it('should analyze coverage for a project with Jest', async () => {
      const params = {
        projectPath: '/test/project',
        testCommand: 'jest',
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 70,
          statements: 80
        }
      };

      // Mock the validateProjectPath to pass
      jest.spyOn(coverageAnalyzer as any, 'validateProjectPath').mockResolvedValue();
      
      // Mock buildCoverageCommand
      jest.spyOn(coverageAnalyzer as any, 'buildCoverageCommand').mockReturnValue('jest --coverage');
      
      // Mock exec command
      const execMock = jest.fn().mockResolvedValue({ stdout: 'Coverage complete', stderr: '' });
      require('util').promisify = jest.fn(() => execMock);

      // Mock parseCoverageResults
      jest.spyOn(coverageAnalyzer as any, 'parseCoverageResults').mockResolvedValue({
        overall: { lines: 85, functions: 90, branches: 80, statements: 85 },
        files: {}
      });

      // Mock generateCoverageReport
      const expectedReport = {
        files: [],
        overall: {
          lines: 85,
          functions: 90,
          branches: 80,
          statements: 85
        },
        timestamp: new Date()
      };
      jest.spyOn(coverageAnalyzer as any, 'generateCoverageReport').mockReturnValue(expectedReport);

      const result = await coverageAnalyzer.analyzeCoverage(params);

      expect(result.overall.lines).toBe(85);
      expect(result.overall.functions).toBe(90);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should throw error for invalid project path', async () => {
      const params = {
        projectPath: '/invalid/path',
        testCommand: 'jest'
      };

      jest.spyOn(coverageAnalyzer as any, 'validateProjectPath').mockRejectedValue(
        new Error('Coverage analysis failed: Invalid project path: /invalid/path')
      );

      await expect(coverageAnalyzer.analyzeCoverage(params))
        .rejects.toThrow('Coverage analysis failed');
    });
  });

  describe('buildCoverageCommand', () => {
    it('should build Jest coverage command correctly', () => {
      const coverageAnalyzerAny = coverageAnalyzer as any;
      const command = coverageAnalyzerAny.buildCoverageCommand('jest', 'json');
      
      expect(command).toContain('--coverage');
      expect(command).toContain('--coverageReporters=json');
    });

    it('should build pytest coverage command correctly', () => {
      const coverageAnalyzerAny = coverageAnalyzer as any;
      const command = coverageAnalyzerAny.buildCoverageCommand('pytest', 'html');
      
      expect(command).toContain('--cov=.');
      expect(command).toContain('--cov-report=html');
    });

    it('should build generic coverage command for unknown frameworks', () => {
      const coverageAnalyzerAny = coverageAnalyzer as any;
      const command = coverageAnalyzerAny.buildCoverageCommand('unknown-test', 'json');
      
      expect(command).toBe('unknown-test --coverage');
    });
  });

  describe('buildJestCoverageCommand', () => {
    it('should add JSON reporters', () => {
      const coverageAnalyzerAny = coverageAnalyzer as any;
      const command = coverageAnalyzerAny.buildJestCoverageCommand('jest', 'json');
      
      expect(command).toContain('--coverageReporters=json-summary');
      expect(command).toContain('--coverageReporters=json');
    });

    it('should add HTML reporter', () => {
      const coverageAnalyzerAny = coverageAnalyzer as any;
      const command = coverageAnalyzerAny.buildJestCoverageCommand('jest', 'html');
      
      expect(command).toContain('--coverageReporters=html');
    });
  });

  describe('buildPytestCoverageCommand', () => {
    it('should configure pytest with coverage', () => {
      const coverageAnalyzerAny = coverageAnalyzer as any;
      const command = coverageAnalyzerAny.buildPytestCoverageCommand('pytest', 'lcov');
      
      expect(command).toContain('--cov=.');
      expect(command).toContain('--cov-report=lcov');
    });

    it('should use term-missing for text output', () => {
      const coverageAnalyzerAny = coverageAnalyzer as any;
      const command = coverageAnalyzerAny.buildPytestCoverageCommand('pytest', 'text');
      
      expect(command).toContain('--cov-report=term-missing');
    });
  });

  describe('parseXmlCoverage', () => {
    it('should parse XML coverage data correctly', () => {
      const xmlContent = `<?xml version="1.0" ?>
        <coverage line-rate="0.85" branch-rate="0.80">
          <packages>
            <package line-rate="0.85" branch-rate="0.80">
              <classes>
                <class line-rate="0.90" branch-rate="0.85" filename="src/calculator.py">
                </class>
              </classes>
            </package>
          </packages>
        </coverage>`;

      const coverageAnalyzerAny = coverageAnalyzer as any;
      const result = coverageAnalyzerAny.parseXmlCoverage(xmlContent);

      expect(result.overall.lines).toBe(85);
      expect(result.overall.branches).toBe(80);
    });
  });

  describe('parseLcovCoverage', () => {
    it('should parse LCOV coverage data correctly', () => {
      const lcovContent = `SF:src/calculator.js
FN:1,add
FNF:1
FNH:1
LF:10
LH:8
BRF:4
BRH:3
end_of_record`;

      const coverageAnalyzerAny = coverageAnalyzer as any;
      const result = coverageAnalyzerAny.parseLcovCoverage(lcovContent);

      expect(result.overall.lines).toBe(80); // 8/10 = 80%
      expect(result.overall.functions).toBe(100); // 1/1 = 100%
      expect(result.overall.branches).toBe(75); // 3/4 = 75%
    });
  });

  describe('parseTextCoverage', () => {
    it('should extract percentage from text coverage', () => {
      const textContent = 'Total coverage: 85.5%';

      const coverageAnalyzerAny = coverageAnalyzer as any;
      const result = coverageAnalyzerAny.parseTextCoverage(textContent);

      expect(result.overall.lines).toBe(85.5);
      expect(result.overall.statements).toBe(85.5);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      const coverageAnalyzerAny = coverageAnalyzer as any;
      
      expect(coverageAnalyzerAny.calculatePercentage(8, 10)).toBe(80);
      expect(coverageAnalyzerAny.calculatePercentage(0, 0)).toBe(0);
      expect(coverageAnalyzerAny.calculatePercentage(5, 3)).toBe(166.67);
    });
  });

  describe('findCoverageFiles', () => {
    it('should find coverage files in standard locations', async () => {
      // Mock fs operations
      jest.spyOn(fs.promises, 'stat').mockImplementation(async (path: any) => {
        if (path.includes('coverage')) {
          return { isDirectory: () => true } as any;
        }
        throw new Error('Not found');
      });

      jest.spyOn(fs.promises, 'access').mockImplementation(async (path: any) => {
        if (path.includes('coverage-final.json')) {
          return;
        }
        throw new Error('File not found');
      });

      const coverageAnalyzerAny = coverageAnalyzer as any;
      const files = await coverageAnalyzerAny.findCoverageFiles('/test/project', 'json');

      expect(files.length).toBeGreaterThan(0);
    });
  });

  describe('generateCoverageReport', () => {
    it('should generate coverage report with thresholds', () => {
      const coverageData = {
        overall: { lines: 85, functions: 90, branches: 80, statements: 85 },
        files: {
          'src/test.js': {
            lines: { total: 10, covered: 8 },
            functions: { total: 2, covered: 2 },
            branches: { total: 4, covered: 3 }
          }
        }
      };

      const thresholds = { lines: 80, functions: 85, branches: 75, statements: 80 };

      const coverageAnalyzerAny = coverageAnalyzer as any;
      const report = coverageAnalyzerAny.generateCoverageReport(coverageData, thresholds);

      expect(report.overall.lines).toBe(85);
      expect(report.overall.functions).toBe(90);
      expect(report.threshold?.lines).toBe(80);
      expect(report.files.length).toBe(1);
      expect(report.timestamp).toBeInstanceOf(Date);
    });
  });
});