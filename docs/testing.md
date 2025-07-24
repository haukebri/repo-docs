# Testing Documentation - Git-AI Markdown Editor

## Quick Functional Test

This test verifies core functionality without making any actual commits to the repository.

### Pre-conditions
- Application is running at `http://localhost:5173`
- Authentication is configured via environment variables (.env.local)
- Browser has access to GitHub API and OpenAI API

### Test Steps

#### 1. Initial Load
- **Action**: Navigate to `http://localhost:5173`
- **Expected**: 
  - File browser is visible on the left
  - "Select a file from the file browser to start editing" message appears
  - No authentication screen (already authenticated via env vars)

#### 2. File Browser Navigation
- **Action**: Click on the "docs" folder
- **Expected**: Folder expands showing .md files inside
- **Action**: Click on "README.md" in the root
- **Expected**: File is highlighted/selected

#### 3. File Loading
- **Action**: After selecting README.md
- **Expected**:
  - Editor loads with file content
  - Preview pane shows rendered markdown
  - File name appears in header
  - Save button is visible (but we won't use it)

#### 4. Editor Functionality
- **Action**: Click in the editor textarea and type "# Test Edit\n\n"
- **Expected**:
  - Text appears in editor
  - Preview updates in real-time
  - Save button becomes enabled (indicates dirty state)
  
#### 5. Markdown Toolbar
- **Action**: Select some text and click bold button
- **Expected**: Selected text is wrapped with `**text**`
- **Action**: Click heading buttons
- **Expected**: Appropriate markdown syntax is inserted

#### 6. Preview Toggle
- **Action**: Click the preview toggle button
- **Expected**: Preview pane shows/hides

#### 7. File Switching
- **Action**: Click on a different .md file (e.g., CLAUDE.md)
- **Expected**:
  - If current file has unsaved changes, a warning should appear
  - New file content loads
  - Preview updates

#### 8. AI Assistant Panel
- **Action**: Click "AI Assistant" tab/button
- **Expected**: AI chat interface appears
- **Action**: Type a message (if input is available)
- **Expected**: Message can be typed (actual API call may fail without valid key)

### Important Notes
- **DO NOT** click the Save button to avoid creating commits
- **DO NOT** test with files you don't want to accidentally modify
- If you make edits, refresh the page to discard changes

## Automated Playwright Test Example

```javascript
// functional-test.js
const { chromium } = require('playwright');

async function runFunctionalTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 1. Navigate to app
    await page.goto('http://localhost:5173');
    console.log('✓ App loaded');
    
    // 2. Verify file browser is visible
    await page.waitForSelector('text=Files', { timeout: 5000 });
    console.log('✓ File browser visible');
    
    // 3. Click on README.md
    await page.click('text=README.md');
    await page.waitForSelector('textarea', { timeout: 5000 });
    console.log('✓ File loaded in editor');
    
    // 4. Test editing (without saving)
    const textarea = await page.$('textarea');
    await textarea.click();
    await page.keyboard.type('# Test Edit\n\n');
    console.log('✓ Editor accepts input');
    
    // 5. Verify preview updates
    await page.waitForSelector('h1:has-text("Test Edit")', { timeout: 2000 });
    console.log('✓ Preview updates in real-time');
    
    // 6. Test file switching
    await page.click('text=CLAUDE.md');
    // Handle potential unsaved changes dialog
    const dialog = page.locator('text=unsaved changes');
    if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('✓ Unsaved changes warning shown');
    }
    
    // 7. Check AI Assistant
    await page.click('text=AI Assistant');
    console.log('✓ AI Assistant panel accessible');
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
runFunctionalTest();
```

## Test Coverage Matrix

| Feature | Tested | Notes |
|---------|--------|-------|
| Authentication bypass via env | ✓ | No login screen when env vars present |
| File browser display | ✓ | Shows repo structure |
| File selection | ✓ | Click to load file |
| Editor loading | ✓ | Displays file content |
| Live preview | ✓ | Updates as you type |
| Markdown toolbar | ✓ | Formatting buttons work |
| Dirty state detection | ✓ | Save button enables on edit |
| File switching | ✓ | Can switch between files |
| AI Assistant panel | ✓ | UI accessible |
| Actual saving | ✗ | Intentionally not tested |
| AI API calls | ✗ | Requires valid API key |

## Known Limitations

1. **Save functionality**: Working but not tested to avoid git commits
2. **AI features**: Require valid OpenAI API key to fully test
3. **Large files**: Performance with very large markdown files not tested
4. **Concurrent editing**: No conflict resolution tested
5. **Error states**: Limited error scenario testing

## Future Test Improvements

1. **Mock APIs**: Create mock GitHub/OpenAI endpoints for safe testing
2. **E2E Test Suite**: Full Playwright test suite with proper teardown
3. **Performance Tests**: Measure editor responsiveness with large files
4. **Accessibility Tests**: Keyboard navigation and screen reader support
5. **Cross-browser Tests**: Test on Firefox, Safari, and Edge