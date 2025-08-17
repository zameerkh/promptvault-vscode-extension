# PromptVault Test Data

This directory contains test data and testing utilities for the PromptVault extension's import/export functionality.

## Files

### `sample-prompts.json`
A comprehensive sample dataset with 12 prompts across 10 categories, designed for testing import functionality:

- **Categories**: AI Development, Code Review, Documentation, Debugging, Testing, Refactoring, Architecture, Performance, Security, Git & Version Control
- **Prompts**: Real-world development prompts including code review checklists, API documentation templates, debugging plans, unit test templates, and more

### `test-import-export.js`
Automated test script that validates:
- ✅ Sample data structure integrity
- ✅ Import data format validation
- ✅ Database version compatibility
- ✅ Export format consistency
- ✅ Large dataset handling (1000+ prompts)
- ✅ Import conflict resolution
- ✅ CSV export format validation

## Testing the Import/Export Feature

### 1. Run Automated Tests
```bash
node test-data/test-import-export.js
```

### 2. Manual Testing Steps

#### Testing Import
1. Launch the extension in debug mode (F5)
2. Open the PromptVault sidebar
3. Use the Import button or Command Palette (`Ctrl+Shift+P` > "Import Prompts")
4. Select `test-data/sample-prompts.json`
5. Verify that 10 categories and 12 prompts are imported
6. Check that conflicts are handled properly if importing again

#### Testing Export
1. After importing sample data
2. Use the Export dropdown in the sidebar:
   - **Export as JSON**: Creates a JSON file with all prompts and categories
   - **Export as CSV**: Creates a CSV file with prompt data
3. For individual categories:
   - Click "Export Category" on any prompt to export just that category

#### Testing Bulk Operations
1. Select multiple prompts using checkboxes
2. Test bulk delete functionality
3. Test bulk move to different category
4. Verify selection persistence and UI updates

## Database Version Compatibility

The extension now includes version migration support:

- **Legacy databases** (without version) are automatically migrated to v1.0
- **Version metadata** is preserved and updated on each extension upgrade
- **Backward compatibility** ensures existing data is never lost
- **Future migrations** can be added to the `migrateDatabase()` method

## Performance Testing

The test suite validates performance with large datasets:
- ✅ 1000 prompts can be imported/exported (< 0.5MB memory usage)
- ✅ JSON serialization/deserialization works efficiently
- ✅ UI remains responsive with large datasets

## Data Format Specification

### Import/Export JSON Format
```json
{
  "version": "1.0",
  "exportedAt": "2025-08-17T10:00:00.000Z",
  "data": {
    "categories": [
      {
        "id": "unique-category-id",
        "name": "Category Name"
      }
    ],
    "prompts": [
      {
        "id": "unique-prompt-id",
        "title": "Prompt Title",
        "body": "Prompt content...",
        "categoryId": "category-id-reference",
        "created_at": "2025-01-15T09:30:00.000Z",
        "updated_at": "2025-08-15T14:22:00.000Z"
      }
    ]
  }
}
```

### CSV Export Format
```csv
ID,Title,Body,Category,Created At,Updated At
prompt-1,"Sample Title","Sample content...","Category Name","2025-01-15T09:30:00.000Z","2025-08-15T14:22:00.000Z"
```

## Conflict Resolution

When importing data that conflicts with existing data:
- **Categories**: Conflicting category names are skipped (existing kept)
- **Prompts**: Conflicting prompt titles are skipped (existing kept)
- **Import summary**: Shows what was imported and what conflicts were resolved

## Best Practices

1. **Always backup** before importing large datasets
2. **Test imports** on a copy of your data first  
3. **Use meaningful names** for categories and prompts
4. **Regular exports** for backup and sharing
5. **Version compatibility** - exports from newer versions may not work in older extension versions
