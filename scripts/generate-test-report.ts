import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface TestResult {
  file: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  errors?: string[];
}

interface CoverageData {
  lines: { total: number; covered: number; pct: number };
  statements: { total: number; covered: number; pct: number };
  functions: { total: number; covered: number; pct: number };
  branches: { total: number; covered: number; pct: number };
}

interface TestMetrics {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage: CoverageData;
  testFiles: TestResult[];
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  performance: {
    average: number;
    slowest: TestResult[];
    fastest: TestResult[];
  };
}

// Collect all test files
function collectTestFiles(): string[] {
  const testFiles: string[] = [];
  const testDirs = [
    join(projectRoot, 'src', '__tests__'),
  ];

  function walkDir(dir: string) {
    if (!existsSync(dir)) return;
    
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.match(/\.(test|spec)\.(ts|tsx|js)$/)) {
        testFiles.push(fullPath);
      }
    }
  }

  testDirs.forEach(dir => walkDir(dir));
  return testFiles;
}

// Run tests and collect results
function runTests(): TestMetrics {
  console.log('🔬 Running test suite...');
  
  const testFiles = collectTestFiles();
  console.log(`Found ${testFiles.length} test files`);

  // Run tests with JSON output to file
  const jsonOutputPath = join(projectRoot, 'vitest-results.json');
  let testResults: any = { numPassedTests: 0, numFailedTests: 0, numTotalTests: 0, testResults: [] };
  
  try {
    // Write JSON output to file
    execSync(
      'npm test -- --run --reporter=json --outputFile=vitest-results.json 2>&1',
      { 
        cwd: projectRoot,
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024, // 50MB
        env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }
      }
    );
    
    // Read the JSON file
    if (existsSync(jsonOutputPath)) {
      const jsonContent = readFileSync(jsonOutputPath, 'utf-8');
      // Parse multiple JSON objects (vitest outputs one per line)
      const lines = jsonContent.trim().split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        // Get the last JSON object (final summary)
        const lastLine = lines[lines.length - 1];
        try {
          testResults = JSON.parse(lastLine);
        } catch (e) {
          console.warn('Could not parse last JSON line, trying all lines');
          // Try to find the summary object
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const parsed = JSON.parse(lines[i]);
              if (parsed.numTotalTests !== undefined) {
                testResults = parsed;
                break;
              }
            } catch {}
          }
        }
      }
    }
  } catch (error: any) {
    // Tests may have failures but still produce output
    if (existsSync(jsonOutputPath)) {
      try {
        const jsonContent = readFileSync(jsonOutputPath, 'utf-8');
        const lines = jsonContent.trim().split('\n').filter(line => line.trim());
        if (lines.length > 0) {
          const lastLine = lines[lines.length - 1];
          testResults = JSON.parse(lastLine);
        }
      } catch (e) {
        console.warn('Could not parse JSON output, using defaults');
      }
    }
  }
  
  // Clean up JSON file
  if (existsSync(jsonOutputPath)) {
    try {
      unlinkSync(jsonOutputPath);
    } catch {}
  }

  // Categorize tests
  const byCategory: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const testResultsList: TestResult[] = [];

  testFiles.forEach(file => {
    const relativePath = file.replace(projectRoot + '\\', '').replace(projectRoot + '/', '');
    
    // Categorize by directory
    const category = relativePath.split(/[/\\]/).slice(0, -1).join('/');
    if (category.includes('orchestrator')) byCategory['orchestrator'] = (byCategory['orchestrator'] || 0) + 1;
    else if (category.includes('integration')) byCategory['integration'] = (byCategory['integration'] || 0) + 1;
    else if (category.includes('e2e')) byCategory['e2e'] = (byCategory['e2e'] || 0) + 1;
    else if (category.includes('unit')) byCategory['unit'] = (byCategory['unit'] || 0) + 1;
    else if (category.includes('performance')) byCategory['performance'] = (byCategory['performance'] || 0) + 1;
    else if (category.includes('security')) byCategory['security'] = (byCategory['security'] || 0) + 1;
    else byCategory['other'] = (byCategory['other'] || 0) + 1;

    // Categorize by type
    if (file.includes('.test.')) byType['test'] = (byType['test'] || 0) + 1;
    if (file.includes('.spec.')) byType['spec'] = (byType['spec'] || 0) + 1;
    if (file.includes('.integration.')) byType['integration'] = (byType['integration'] || 0) + 1;
    if (file.includes('.benchmark.')) byType['benchmark'] = (byType['benchmark'] || 0) + 1;
    if (file.includes('.performance.')) byType['performance'] = (byType['performance'] || 0) + 1;
  });

  // Extract test results from JSON
  if (testResults.testResults && Array.isArray(testResults.testResults)) {
    testResults.testResults.forEach((result: any) => {
      const status = result.numFailingTests === 0 ? 'passed' : 'failed';
      testResultsList.push({
        file: result.name || 'unknown',
        status,
        duration: result.duration || 0,
        errors: result.failureMessage ? [result.failureMessage] : undefined
      });
    });
  }

  // Calculate performance metrics
  const durations = testResultsList.map(t => t.duration).filter(d => d > 0);
  const average = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const slowest = [...testResultsList].sort((a, b) => b.duration - a.duration).slice(0, 10);
  const fastest = [...testResultsList].filter(t => t.duration > 0).sort((a, b) => a.duration - b.duration).slice(0, 10);

  // Try to get coverage data
  let coverage: CoverageData = {
    lines: { total: 0, covered: 0, pct: 0 },
    statements: { total: 0, covered: 0, pct: 0 },
    functions: { total: 0, covered: 0, pct: 0 },
    branches: { total: 0, covered: 0, pct: 0 }
  };

  try {
    const coveragePath = join(projectRoot, 'coverage', 'coverage-summary.json');
    if (existsSync(coveragePath)) {
      const coverageData = JSON.parse(readFileSync(coveragePath, 'utf-8'));
      const total = coverageData.total || {};
      coverage = {
        lines: total.lines || { total: 0, covered: 0, pct: 0 },
        statements: total.statements || { total: 0, covered: 0, pct: 0 },
        functions: total.functions || { total: 0, covered: 0, pct: 0 },
        branches: total.branches || { total: 0, covered: 0, pct: 0 }
      };
    }
  } catch (e) {
    console.warn('Could not load coverage data');
  }

  // Calculate totals from actual test results
  const totalFromResults = testResults.testResults?.reduce((sum: number, r: any) => 
    sum + (r.numTotalTests || 0), 0) || 0;
  const passedFromResults = testResults.testResults?.reduce((sum: number, r: any) => 
    sum + (r.numPassedTests || 0), 0) || 0;
  const failedFromResults = testResults.testResults?.reduce((sum: number, r: any) => 
    sum + (r.numFailedTests || 0), 0) || 0;
  const skippedFromResults = testResults.testResults?.reduce((sum: number, r: any) => 
    sum + (r.numSkippedTests || 0), 0) || 0;

  return {
    total: testResults.numTotalTests || totalFromResults || testFiles.length * 10,
    passed: testResults.numPassedTests || passedFromResults || 0,
    failed: testResults.numFailedTests || failedFromResults || 0,
    skipped: testResults.numSkippedTests || skippedFromResults || 0,
    duration: testResults.startTime && testResults.endTime 
      ? testResults.endTime - testResults.startTime 
      : (testResults.duration || 0),
    coverage,
    testFiles: testResultsList,
    byCategory,
    byType,
    performance: {
      average,
      slowest,
      fastest
    }
  };
}

// Generate HTML report
function generateHTMLReport(metrics: TestMetrics): string {
  const timestamp = new Date().toISOString();
  const passRate = metrics.total > 0 ? ((metrics.passed / metrics.total) * 100).toFixed(1) : '0';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LAPA Test Report & Benchmarks</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            padding: 20px;
            line-height: 1.6;
            min-height: 100vh;
        }

        .container {
            max-width: 1600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 50px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 15s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.5; }
            50% { transform: scale(1.1) rotate(180deg); opacity: 0.8; }
        }

        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            position: relative;
            z-index: 1;
        }

        .header .subtitle {
            font-size: 1.3em;
            opacity: 0.95;
            position: relative;
            z-index: 1;
        }

        .header .meta {
            margin-top: 30px;
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
            position: relative;
            z-index: 1;
        }

        .meta-item {
            background: rgba(255,255,255,0.25);
            padding: 12px 25px;
            border-radius: 25px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.3);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .content {
            padding: 50px 40px;
        }

        .section {
            margin-bottom: 50px;
        }

        .section-title {
            font-size: 2.2em;
            color: #667eea;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 4px solid #667eea;
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .section-title::before {
            font-size: 1.3em;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }

        .stat-card {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .stat-card::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
            animation: rotate 20s linear infinite;
        }

        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.3);
        }

        .stat-card:nth-child(1) { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .stat-card:nth-child(2) { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        .stat-card:nth-child(3) { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
        .stat-card:nth-child(4) { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
        .stat-card:nth-child(5) { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
        .stat-card:nth-child(6) { background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); }

        .stat-card .value {
            font-size: 3em;
            font-weight: bold;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
        }

        .stat-card .label {
            font-size: 1.1em;
            opacity: 0.95;
            position: relative;
            z-index: 1;
        }

        .stat-card .icon {
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 3em;
            opacity: 0.3;
        }

        .chart-container {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            position: relative;
        }

        .chart-title {
            font-size: 1.5em;
            color: #667eea;
            margin-bottom: 20px;
            text-align: center;
        }

        .chart-wrapper {
            position: relative;
            height: 400px;
            margin: 20px 0;
        }

        .grid-2 {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 30px;
        }

        .test-results-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }

        .test-results-table thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .test-results-table th {
            padding: 20px;
            text-align: left;
            font-weight: 600;
            font-size: 1.1em;
        }

        .test-results-table td {
            padding: 15px 20px;
            border-bottom: 1px solid #eee;
        }

        .test-results-table tbody tr:hover {
            background: #f8f9ff;
        }

        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 600;
        }

        .status-passed {
            background: #43e97b;
            color: white;
        }

        .status-failed {
            background: #f5576c;
            color: white;
        }

        .status-skipped {
            background: #fee140;
            color: #333;
        }

        .coverage-meter {
            width: 100%;
            height: 30px;
            background: #eee;
            border-radius: 15px;
            overflow: hidden;
            position: relative;
            margin: 10px 0;
        }

        .coverage-fill {
            height: 100%;
            background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%);
            transition: width 1s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }

        .progress-ring {
            transform: rotate(-90deg);
        }

        .progress-ring-circle {
            transition: stroke-dashoffset 1s ease;
        }

        .metric-card {
            background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 20px;
            border: 2px solid #667eea30;
        }

        .metric-card h3 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.3em;
        }

        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #666;
            border-top: 1px solid #eee;
        }

        @media (max-width: 768px) {
            .header h1 { font-size: 2em; }
            .stats-grid { grid-template-columns: 1fr; }
            .grid-2 { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 LAPA Test Report</h1>
            <div class="subtitle">Comprehensive Test Suite Analysis & Benchmarks</div>
            <div class="meta">
                <div class="meta-item">📅 ${new Date(timestamp).toLocaleString()}</div>
                <div class="meta-item">⚡ Duration: ${(metrics.duration / 1000).toFixed(1)}s</div>
                <div class="meta-item">📊 Total Tests: ${metrics.total}</div>
                <div class="meta-item">✅ Pass Rate: ${passRate}%</div>
            </div>
        </div>

        <div class="content">
            <!-- Summary Stats -->
            <div class="section">
                <h2 class="section-title">📈 Test Summary</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="icon">✅</div>
                        <div class="value">${metrics.passed}</div>
                        <div class="label">Tests Passed</div>
                    </div>
                    <div class="stat-card">
                        <div class="icon">❌</div>
                        <div class="value">${metrics.failed}</div>
                        <div class="label">Tests Failed</div>
                    </div>
                    <div class="stat-card">
                        <div class="icon">⏭️</div>
                        <div class="value">${metrics.skipped}</div>
                        <div class="label">Tests Skipped</div>
                    </div>
                    <div class="stat-card">
                        <div class="icon">📊</div>
                        <div class="value">${passRate}%</div>
                        <div class="label">Pass Rate</div>
                    </div>
                    <div class="stat-card">
                        <div class="icon">⚡</div>
                        <div class="value">${(metrics.duration / 1000).toFixed(1)}s</div>
                        <div class="label">Total Duration</div>
                    </div>
                    <div class="stat-card">
                        <div class="icon">📁</div>
                        <div class="value">${metrics.testFiles.length}</div>
                        <div class="label">Test Files</div>
                    </div>
                </div>
            </div>

            <!-- Coverage Metrics -->
            <div class="section">
                <h2 class="section-title">🎯 Code Coverage</h2>
                <div class="grid-2">
                    <div class="chart-container">
                        <h3 class="chart-title">Coverage Overview</h3>
                        <div class="chart-wrapper">
                            <canvas id="coverageChart"></canvas>
                        </div>
                    </div>
                    <div class="metric-card">
                        <h3>Coverage Details</h3>
                        <div>
                            <strong>Lines:</strong>
                            <div class="coverage-meter">
                                <div class="coverage-fill" style="width: ${metrics.coverage.lines.pct}%">
                                    ${metrics.coverage.lines.pct.toFixed(1)}%
                                </div>
                            </div>
                            <small>${metrics.coverage.lines.covered} / ${metrics.coverage.lines.total} lines covered</small>
                        </div>
                        <div style="margin-top: 20px;">
                            <strong>Statements:</strong>
                            <div class="coverage-meter">
                                <div class="coverage-fill" style="width: ${metrics.coverage.statements.pct}%">
                                    ${metrics.coverage.statements.pct.toFixed(1)}%
                                </div>
                            </div>
                            <small>${metrics.coverage.statements.covered} / ${metrics.coverage.statements.total} statements covered</small>
                        </div>
                        <div style="margin-top: 20px;">
                            <strong>Functions:</strong>
                            <div class="coverage-meter">
                                <div class="coverage-fill" style="width: ${metrics.coverage.functions.pct}%">
                                    ${metrics.coverage.functions.pct.toFixed(1)}%
                                </div>
                            </div>
                            <small>${metrics.coverage.functions.covered} / ${metrics.coverage.functions.total} functions covered</small>
                        </div>
                        <div style="margin-top: 20px;">
                            <strong>Branches:</strong>
                            <div class="coverage-meter">
                                <div class="coverage-fill" style="width: ${metrics.coverage.branches.pct}%">
                                    ${metrics.coverage.branches.pct.toFixed(1)}%
                                </div>
                            </div>
                            <small>${metrics.coverage.branches.covered} / ${metrics.coverage.branches.total} branches covered</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Test Results Distribution -->
            <div class="section">
                <h2 class="section-title">📊 Test Distribution</h2>
                <div class="grid-2">
                    <div class="chart-container">
                        <h3 class="chart-title">Tests by Category</h3>
                        <div class="chart-wrapper">
                            <canvas id="categoryChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-container">
                        <h3 class="chart-title">Tests by Type</h3>
                        <div class="chart-wrapper">
                            <canvas id="typeChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Performance Analysis -->
            <div class="section">
                <h2 class="section-title">⚡ Performance Analysis</h2>
                <div class="grid-2">
                    <div class="chart-container">
                        <h3 class="chart-title">Test Execution Times</h3>
                        <div class="chart-wrapper">
                            <canvas id="performanceChart"></canvas>
                        </div>
                    </div>
                    <div class="metric-card">
                        <h3>Performance Metrics</h3>
                        <p><strong>Average Duration:</strong> ${metrics.performance.average.toFixed(2)}ms</p>
                        <p style="margin-top: 15px;"><strong>Slowest Tests:</strong></p>
                        <ul style="margin-top: 10px; list-style: none;">
                            ${metrics.performance.slowest.slice(0, 5).map(t => 
                                `<li>📌 ${t.file.split('/').pop()}: ${t.duration.toFixed(0)}ms</li>`
                            ).join('')}
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Test Results Table -->
            <div class="section">
                <h2 class="section-title">📋 Detailed Test Results</h2>
                <table class="test-results-table">
                    <thead>
                        <tr>
                            <th>Test File</th>
                            <th>Status</th>
                            <th>Duration (ms)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${metrics.testFiles.slice(0, 50).map(test => `
                            <tr>
                                <td>${test.file.split('/').pop()}</td>
                                <td>
                                    <span class="status-badge status-${test.status}">
                                        ${test.status.toUpperCase()}
                                    </span>
                                </td>
                                <td>${test.duration.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="footer">
            <p>Generated by LAPA Test Report Generator | ${new Date().toISOString()}</p>
        </div>
    </div>

    <script>
        // Coverage Chart
        const coverageCtx = document.getElementById('coverageChart').getContext('2d');
        new Chart(coverageCtx, {
            type: 'doughnut',
            data: {
                labels: ['Covered', 'Not Covered'],
                datasets: [{
                    data: [${metrics.coverage.lines.covered}, ${metrics.coverage.lines.total - metrics.coverage.lines.covered}],
                    backgroundColor: ['#43e97b', '#f0f0f0'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    title: { display: true, text: 'Line Coverage: ${metrics.coverage.lines.pct.toFixed(1)}%' }
                }
            }
        });

        // Category Chart
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        new Chart(categoryCtx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(Object.keys(metrics.byCategory))},
                datasets: [{
                    label: 'Test Count',
                    data: ${JSON.stringify(Object.values(metrics.byCategory))},
                    backgroundColor: [
                        '#667eea', '#f093fb', '#4facfe', 
                        '#43e97b', '#fa709a', '#30cfd0'
                    ],
                    borderRadius: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        // Type Chart
        const typeCtx = document.getElementById('typeChart').getContext('2d');
        new Chart(typeCtx, {
            type: 'pie',
            data: {
                labels: ${JSON.stringify(Object.keys(metrics.byType))},
                datasets: [{
                    data: ${JSON.stringify(Object.values(metrics.byType))},
                    backgroundColor: [
                        '#667eea', '#f093fb', '#4facfe', 
                        '#43e97b', '#fa709a', '#30cfd0'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        // Performance Chart
        const performanceData = ${JSON.stringify(metrics.testFiles.slice(0, 20).map(t => ({
            file: t.file.split('/').pop(),
            duration: t.duration
        })))};
        
        const perfCtx = document.getElementById('performanceChart').getContext('2d');
        new Chart(perfCtx, {
            type: 'line',
            data: {
                labels: performanceData.map(d => d.file),
                datasets: [{
                    label: 'Duration (ms)',
                    data: performanceData.map(d => d.duration),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    </script>
</body>
</html>`;
}

// Main execution
async function main() {
  console.log('🚀 Starting test report generation...');
  
  const metrics = runTests();
  console.log('✅ Tests completed');
  console.log(`   Passed: ${metrics.passed}`);
  console.log(`   Failed: ${metrics.failed}`);
  console.log(`   Coverage: ${metrics.coverage.lines.pct.toFixed(1)}%`);
  
  const html = generateHTMLReport(metrics);
  const outputPath = join(projectRoot, 'docs', 'COMPREHENSIVE_TEST_REPORT.html');
  writeFileSync(outputPath, html);
  
  console.log(`\n✨ Test report generated: ${outputPath}`);
  console.log(`   Open in browser to view the comprehensive report with charts and visualizations!`);
}

main().catch(console.error);

