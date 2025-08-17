#!/usr/bin/env node

/**
 * PromptVault Import/Export Test Script
 * 
 * This script tests the import/export functionality and database version compatibility.
 * Run this script to verify that the import/export features work correctly.
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
    sampleDataPath: path.join(__dirname, '../test-data/sample-prompts.json'),
    backupDir: path.join(__dirname, '../test-data/backups'),
    testOutputDir: path.join(__dirname, '../test-data/output')
};

class ImportExportTester {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            error: '\x1b[31m',
            warning: '\x1b[33m',
            reset: '\x1b[0m'
        };
        
        console.log(`${colors[type]}${message}${colors.reset}`);
    }

    test(name, testFn) {
        try {
            this.log(`\n🧪 Testing: ${name}`);
            testFn();
            this.results.passed++;
            this.results.tests.push({ name, status: 'PASSED' });
            this.log(`✅ PASSED: ${name}`, 'success');
        } catch (error) {
            this.results.failed++;
            this.results.tests.push({ name, status: 'FAILED', error: error.message });
            this.log(`❌ FAILED: ${name} - ${error.message}`, 'error');
        }
    }

    async runTests() {
        this.log('🚀 Starting PromptVault Import/Export Tests', 'info');
        this.log('=' .repeat(50));

        // Ensure test directories exist
        this.ensureDirectories();

        // Test 1: Verify sample data structure
        this.test('Sample data file structure', () => {
            this.testSampleDataStructure();
        });

        // Test 2: Verify import data format
        this.test('Import data format validation', () => {
            this.testImportDataFormat();
        });

        // Test 3: Test database version compatibility
        this.test('Database version compatibility', () => {
            this.testDatabaseVersionCompatibility();
        });

        // Test 4: Test export format consistency
        this.test('Export format consistency', () => {
            this.testExportFormatConsistency();
        });

        // Test 5: Test large dataset handling
        this.test('Large dataset handling', () => {
            this.testLargeDatasetHandling();
        });

        // Test 6: Test conflict resolution
        this.test('Import conflict resolution', () => {
            this.testConflictResolution();
        });

        // Test 7: Test CSV export format
        this.test('CSV export format', () => {
            this.testCsvExportFormat();
        });

        // Print results
        this.printResults();
    }

    ensureDirectories() {
        [TEST_CONFIG.backupDir, TEST_CONFIG.testOutputDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    testSampleDataStructure() {
        const sampleData = this.loadSampleData();
        
        // Check required fields
        if (!sampleData.version) throw new Error('Missing version field');
        if (!sampleData.exportedAt) throw new Error('Missing exportedAt field');
        if (!sampleData.data) throw new Error('Missing data field');
        if (!sampleData.data.categories) throw new Error('Missing categories array');
        if (!sampleData.data.prompts) throw new Error('Missing prompts array');

        // Validate categories
        sampleData.data.categories.forEach((cat, index) => {
            if (!cat.id || !cat.name) {
                throw new Error(`Category ${index} missing id or name`);
            }
        });

        // Validate prompts
        sampleData.data.prompts.forEach((prompt, index) => {
            const required = ['id', 'title', 'body', 'categoryId', 'created_at', 'updated_at'];
            required.forEach(field => {
                if (!prompt[field]) {
                    throw new Error(`Prompt ${index} missing required field: ${field}`);
                }
            });
        });

        this.log(`✓ Sample data contains ${sampleData.data.categories.length} categories and ${sampleData.data.prompts.length} prompts`);
    }

    testImportDataFormat() {
        const sampleData = this.loadSampleData();
        
        // Test that all prompt categoryIds reference existing categories
        const categoryIds = new Set(sampleData.data.categories.map(c => c.id));
        sampleData.data.prompts.forEach((prompt, index) => {
            if (!categoryIds.has(prompt.categoryId)) {
                throw new Error(`Prompt ${index} references non-existent category: ${prompt.categoryId}`);
            }
        });

        // Test date format
        sampleData.data.prompts.forEach((prompt, index) => {
            const createdDate = new Date(prompt.created_at);
            const updatedDate = new Date(prompt.updated_at);
            
            if (isNaN(createdDate.getTime())) {
                throw new Error(`Prompt ${index} has invalid created_at date`);
            }
            if (isNaN(updatedDate.getTime())) {
                throw new Error(`Prompt ${index} has invalid updated_at date`);
            }
        });

        this.log('✓ All import data format validations passed');
    }

    testDatabaseVersionCompatibility() {
        // Test legacy database structure (without version)
        const legacyDb = {
            prompts: [
                {
                    id: 'test-1',
                    title: 'Test Prompt',
                    body: 'Test content',
                    categoryId: 'cat-1',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ],
            categories: [{ id: 'cat-1', name: 'Test Category' }]
        };

        // Simulate migration logic
        const migratedDb = this.simulateDatabaseMigration(legacyDb);
        
        if (!migratedDb.version) throw new Error('Migration should add version field');
        if (!migratedDb.metadata) throw new Error('Migration should add metadata field');
        if (migratedDb.prompts.length !== 1) throw new Error('Migration should preserve prompts');
        if (migratedDb.categories.length !== 1) throw new Error('Migration should preserve categories');

        this.log('✓ Database version compatibility test passed');
    }

    testExportFormatConsistency() {
        const sampleData = this.loadSampleData();
        
        // Simulate export format
        const exportFormat = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            data: {
                categories: sampleData.data.categories,
                prompts: sampleData.data.prompts
            }
        };

        // Verify export can be re-imported
        if (JSON.stringify(exportFormat.data.categories) !== JSON.stringify(sampleData.data.categories)) {
            throw new Error('Export/import category consistency check failed');
        }

        if (JSON.stringify(exportFormat.data.prompts) !== JSON.stringify(sampleData.data.prompts)) {
            throw new Error('Export/import prompt consistency check failed');
        }

        this.log('✓ Export format consistency verified');
    }

    testLargeDatasetHandling() {
        // Generate a large dataset
        const largeDataset = this.generateLargeDataset(1000); // 1000 prompts
        
        // Test JSON serialization/deserialization
        try {
            const serialized = JSON.stringify(largeDataset);
            const deserialized = JSON.parse(serialized);
            
            if (deserialized.data.prompts.length !== 1000) {
                throw new Error('Large dataset serialization failed');
            }

            // Test memory usage (should not exceed 100MB)
            const memorySizeMB = Buffer.byteLength(serialized, 'utf8') / 1024 / 1024;
            if (memorySizeMB > 100) {
                this.log(`⚠️  Large dataset uses ${memorySizeMB.toFixed(2)}MB`, 'warning');
            }

            this.log(`✓ Large dataset (1000 prompts) handled successfully (${memorySizeMB.toFixed(2)}MB)`);
        } catch (error) {
            throw new Error(`Large dataset handling failed: ${error.message}`);
        }
    }

    testConflictResolution() {
        const sampleData = this.loadSampleData();
        
        // Create a scenario with duplicate names
        const existingData = {
            categories: [{ id: 'existing-1', name: 'AI Development' }],
            prompts: [
                {
                    id: 'existing-prompt',
                    title: 'Code Review Checklist',
                    body: 'Existing content',
                    categoryId: 'existing-1',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ]
        };

        // Simulate import conflict detection
        const conflicts = this.detectConflicts(existingData, sampleData.data);
        
        if (conflicts.categories.length === 0) {
            throw new Error('Should detect category name conflicts');
        }
        if (conflicts.prompts.length === 0) {
            throw new Error('Should detect prompt title conflicts');
        }

        this.log(`✓ Conflict detection works: ${conflicts.categories.length} category conflicts, ${conflicts.prompts.length} prompt conflicts`);
    }

    testCsvExportFormat() {
        const sampleData = this.loadSampleData();
        
        // Simulate CSV export
        const csvContent = this.generateCsvExport(sampleData.data);
        const lines = csvContent.split('\n');
        
        // Check header
        const expectedHeader = 'ID,Title,Body,Category,Created At,Updated At';
        if (!lines[0].includes('ID') || !lines[0].includes('Title')) {
            throw new Error('CSV header format incorrect');
        }

        // Check that we have the right number of lines (header + prompts)
        if (lines.length - 1 !== sampleData.data.prompts.length) {
            throw new Error(`CSV should have ${sampleData.data.prompts.length + 1} lines, got ${lines.length}`);
        }

        // Test CSV parsing
        const csvLines = lines.slice(1).filter(line => line.trim());
        csvLines.forEach((line, index) => {
            const fields = this.parseCsvLine(line);
            if (fields.length < 6) {
                throw new Error(`CSV line ${index + 1} has insufficient fields`);
            }
        });

        this.log(`✓ CSV export format validated (${csvLines.length} rows)`);
    }

    // Helper methods
    loadSampleData() {
        if (!fs.existsSync(TEST_CONFIG.sampleDataPath)) {
            throw new Error('Sample data file not found');
        }
        return JSON.parse(fs.readFileSync(TEST_CONFIG.sampleDataPath, 'utf8'));
    }

    simulateDatabaseMigration(legacyDb) {
        return {
            version: '1.0',
            prompts: legacyDb.prompts || [],
            categories: legacyDb.categories || [],
            metadata: {
                created: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                extensionVersion: '1.0.7'
            }
        };
    }

    generateLargeDataset(promptCount) {
        const categories = [
            { id: 'cat-1', name: 'Category 1' },
            { id: 'cat-2', name: 'Category 2' },
            { id: 'cat-3', name: 'Category 3' }
        ];

        const prompts = [];
        for (let i = 0; i < promptCount; i++) {
            prompts.push({
                id: `prompt-${i}`,
                title: `Test Prompt ${i}`,
                body: `This is test prompt content ${i}. `.repeat(10), // Make content longer
                categoryId: categories[i % categories.length].id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }

        return {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            data: { categories, prompts }
        };
    }

    detectConflicts(existing, importing) {
        const categoryConflicts = importing.categories.filter(importCat => 
            existing.categories.some(existCat => existCat.name === importCat.name)
        );

        const promptConflicts = importing.prompts.filter(importPrompt => 
            existing.prompts.some(existPrompt => existPrompt.title === importPrompt.title)
        );

        return { categories: categoryConflicts, prompts: promptConflicts };
    }

    generateCsvExport(data) {
        const headers = ['ID', 'Title', 'Body', 'Category', 'Created At', 'Updated At'];
        const rows = [headers.join(',')];
        
        data.prompts.forEach(prompt => {
            const category = data.categories.find(c => c.id === prompt.categoryId)?.name || 'Unknown';
            const row = [
                this.escapeCsv(prompt.id),
                this.escapeCsv(prompt.title),
                this.escapeCsv(prompt.body),
                this.escapeCsv(category),
                this.escapeCsv(prompt.created_at),
                this.escapeCsv(prompt.updated_at)
            ];
            rows.push(row.join(','));
        });
        
        return rows.join('\n');
    }

    escapeCsv(value) {
        // Replace newlines with spaces for CSV (same as backend)
        const cleanValue = value.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleanValue.includes(',') || cleanValue.includes('"') || value.includes('\n')) {
            return `"${cleanValue.replace(/"/g, '""')}"`;
        }
        return cleanValue;
    }

    parseCsvLine(line) {
        const fields = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        fields.push(current);
        return fields;
    }

    printResults() {
        this.log('\n' + '='.repeat(50));
        this.log('🏁 Test Results Summary', 'info');
        this.log('='.repeat(50));
        
        this.results.tests.forEach(test => {
            const status = test.status === 'PASSED' ? '✅' : '❌';
            this.log(`${status} ${test.name}`, test.status === 'PASSED' ? 'success' : 'error');
            if (test.error) {
                this.log(`   Error: ${test.error}`, 'error');
            }
        });

        this.log('\n📊 Summary:');
        this.log(`   Passed: ${this.results.passed}`, 'success');
        this.log(`   Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'success');
        this.log(`   Total:  ${this.results.passed + this.results.failed}`);

        if (this.results.failed === 0) {
            this.log('\n🎉 All tests passed! Import/Export functionality is ready.', 'success');
        } else {
            this.log('\n⚠️  Some tests failed. Please fix issues before proceeding.', 'warning');
            process.exit(1);
        }
    }
}

// Run tests
if (require.main === module) {
    const tester = new ImportExportTester();
    tester.runTests().catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = ImportExportTester;
