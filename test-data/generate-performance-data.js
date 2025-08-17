#!/usr/bin/env node

/**
 * Performance Test Data Generator
 * 
 * Generates large datasets for testing PromptVault performance
 */

const fs = require('fs');
const path = require('path');

class PerformanceDataGenerator {
    constructor() {
        this.outputDir = path.join(__dirname, '../test-data');
    }

    generateLargeDataset(promptCount = 500, categoryCount = 20) {
        console.log(`🚀 Generating performance test data...`);
        console.log(`📊 Prompts: ${promptCount}, Categories: ${categoryCount}`);

        const categories = this.generateCategories(categoryCount);
        const prompts = this.generatePrompts(promptCount, categories);

        const dataset = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            data: {
                categories,
                prompts
            }
        };

        const filePath = path.join(this.outputDir, `performance-test-${promptCount}-prompts.json`);
        fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2));

        const sizeInMB = (Buffer.byteLength(JSON.stringify(dataset), 'utf8') / 1024 / 1024).toFixed(2);
        
        console.log(`✅ Generated: ${filePath}`);
        console.log(`📦 File size: ${sizeInMB} MB`);
        console.log(`💾 Memory usage: ~${sizeInMB} MB when loaded`);
        
        return filePath;
    }

    generateCategories(count) {
        const categoryNames = [
            'Web Development', 'Backend Development', 'Frontend Development', 
            'Database Design', 'DevOps', 'Testing', 'Security', 'Performance',
            'Architecture', 'Code Review', 'Documentation', 'Debugging',
            'API Design', 'Mobile Development', 'Data Science', 'Machine Learning',
            'Cloud Computing', 'Microservices', 'Monitoring', 'Deployment'
        ];

        const categories = [];
        for (let i = 0; i < count; i++) {
            categories.push({
                id: `cat-perf-${i}`,
                name: categoryNames[i % categoryNames.length] + (i >= categoryNames.length ? ` ${Math.floor(i / categoryNames.length) + 1}` : '')
            });
        }

        return categories;
    }

    generatePrompts(count, categories) {
        const promptTemplates = [
            {
                title: 'Code Review Template',
                body: 'Please review this code for:\n\n1. **Functionality**: Does it work as expected?\n2. **Performance**: Are there any bottlenecks?\n3. **Security**: Are there vulnerabilities?\n4. **Maintainability**: Is the code easy to understand and modify?\n\nSpecific areas to focus on:\n- Error handling\n- Edge cases\n- Best practices\n- Code organization'
            },
            {
                title: 'API Endpoint Documentation',
                body: '# API Endpoint\n\n## Description\n[Brief description]\n\n## Parameters\n- `param1` (type): Description\n- `param2` (type): Description\n\n## Response\n```json\n{\n  "status": "success",\n  "data": {}\n}\n```\n\n## Error Codes\n- 400: Bad Request\n- 404: Not Found\n- 500: Internal Server Error'
            },
            {
                title: 'Bug Report Template',
                body: '## Bug Description\n[Clear description of the issue]\n\n## Steps to Reproduce\n1. Step one\n2. Step two\n3. Step three\n\n## Expected Behavior\n[What should happen]\n\n## Actual Behavior\n[What actually happens]\n\n## Environment\n- OS: \n- Browser/Version: \n- Application Version: \n\n## Additional Notes\n[Any other relevant information]'
            },
            {
                title: 'Database Query Optimization',
                body: 'Query optimization checklist:\n\n1. **Indexes**: Are appropriate indexes in place?\n2. **Query Structure**: Can the query be simplified?\n3. **Joins**: Are joins efficient?\n4. **Where Clauses**: Are filters applied early?\n5. **Subqueries**: Can they be replaced with joins?\n6. **Data Types**: Are column types optimal?\n7. **Execution Plan**: What does EXPLAIN show?\n\n```sql\n-- Original query\nSELECT * FROM table WHERE condition;\n\n-- Optimized query\nSELECT specific_columns FROM table \nWHERE indexed_column = value;\n```'
            },
            {
                title: 'Security Checklist',
                body: '## Security Review Checklist\n\n### Input Validation\n- [ ] SQL injection prevention\n- [ ] XSS protection\n- [ ] Command injection prevention\n- [ ] Path traversal protection\n\n### Authentication & Authorization\n- [ ] Strong password requirements\n- [ ] Session management\n- [ ] JWT token validation\n- [ ] Role-based access control\n\n### Data Protection\n- [ ] Encryption at rest\n- [ ] Encryption in transit\n- [ ] PII handling\n- [ ] Secure key management\n\n### Infrastructure\n- [ ] HTTPS everywhere\n- [ ] Security headers\n- [ ] CORS configuration\n- [ ] Rate limiting'
            }
        ];

        const prompts = [];
        for (let i = 0; i < count; i++) {
            const template = promptTemplates[i % promptTemplates.length];
            const category = categories[i % categories.length];
            
            prompts.push({
                id: `perf-prompt-${i}`,
                title: `${template.title} #${i + 1}`,
                body: template.body + (i > promptTemplates.length ? `\n\n--- Generated variant ${Math.floor(i / promptTemplates.length)} ---` : ''),
                categoryId: category.id,
                created_at: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(), // Random date within last 30 days
                updated_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString() // Random date within last 7 days
            });
        }

        return prompts;
    }

    async testPerformanceLevels() {
        console.log('\n🎯 Generating performance test datasets...\n');

        const testLevels = [
            { prompts: 50, categories: 5, description: 'Small dataset (typical user)' },
            { prompts: 200, categories: 10, description: 'Medium dataset (power user)' },
            { prompts: 500, categories: 20, description: 'Large dataset (team/organization)' },
            { prompts: 1000, categories: 25, description: 'Very large dataset (stress test)' }
        ];

        for (const level of testLevels) {
            console.log(`📝 ${level.description}`);
            const filePath = this.generateLargeDataset(level.prompts, level.categories);
            console.log('');
        }

        console.log('✨ Performance test data generation complete!');
        console.log('\n📋 How to test:');
        console.log('1. Launch the extension (F5)');
        console.log('2. Import one of the generated JSON files');
        console.log('3. Observe UI performance with different dataset sizes');
        console.log('4. Test features like search, filtering, bulk operations');
    }
}

// Run the generator
if (require.main === module) {
    const generator = new PerformanceDataGenerator();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log('Usage:');
        console.log('  node generate-performance-data.js [options]');
        console.log('');
        console.log('Options:');
        console.log('  --prompts N     Number of prompts to generate (default: all levels)');
        console.log('  --categories N  Number of categories to generate');
        console.log('  --help, -h      Show this help message');
        console.log('');
        console.log('Examples:');
        console.log('  node generate-performance-data.js');
        console.log('  node generate-performance-data.js --prompts 1000 --categories 50');
        process.exit(0);
    }

    const promptCount = parseInt(args[args.indexOf('--prompts') + 1]) || null;
    const categoryCount = parseInt(args[args.indexOf('--categories') + 1]) || null;

    if (promptCount && categoryCount) {
        generator.generateLargeDataset(promptCount, categoryCount);
    } else {
        generator.testPerformanceLevels().catch(console.error);
    }
}

module.exports = PerformanceDataGenerator;
