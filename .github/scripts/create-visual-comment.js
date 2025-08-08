const fs = require('fs');
const path = require('path');

/**
 * Deletes existing visual regression comments from the bot to avoid duplicates
 * @param {Object} github - GitHub API client
 * @param {Object} context - GitHub context object
 */
async function cleanupVisualRegressionComments(github, context) {
  // Delete any existing visual regression comments from this bot
  const comments = await github.rest.issues.listComments({
    issue_number: context.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
  });
  
  let deletedCount = 0;
  
  for (const comment of comments.data) {
    if (comment.user.type === 'Bot' && 
        comment.body.includes('🖼️ Playwright Visual Regression Test Results')) {
      await github.rest.issues.deleteComment({
        comment_id: comment.id,
        owner: context.repo.owner,
        repo: context.repo.repo,
      });
      console.log(`Deleted existing visual regression comment: ${comment.id}`);
      deletedCount++;
    }
  }
  
  if (deletedCount > 0) {
    console.log(`Cleaned up ${deletedCount} existing visual regression comment(s)`);
  } else {
    console.log('No existing visual regression comments found to clean up');
  }
}

/**
 * Analyzes test outputs from all browsers and creates a consolidated visual regression comment
 * @param {Object} github - GitHub API client
 * @param {Object} context - GitHub context object
 * @param {string} runId - GitHub Actions run ID
 */
async function createVisualRegressionComment(github, context, runId) {
  // Check each browser's test output for screenshot differences
  const browsers = ['Google Chrome', 'firefox', 'safari', 'Microsoft Edge'];
  const results = [];
  let hasAnyScreenshotIssues = false;
  
  for (const browser of browsers) {
    const outputDir = `test-outputs/test-output-${browser}`;
    const outputFile = path.join(outputDir, 'output.log');
    
    let hasScreenshotIssues = false;
    let screenshotErrors = [];
    
    try {
      if (fs.existsSync(outputFile)) {
        const logContent = fs.readFileSync(outputFile, 'utf8');
        
        // Check for screenshot-related errors
        if (logContent.includes('Screenshot comparison failed') || 
            logContent.includes('A snapshot doesn\'t exist')) {
          hasScreenshotIssues = true;
          hasAnyScreenshotIssues = true;
          
          screenshotErrors = logContent
            .split('\n')
            .filter(line => line.includes('Screenshot comparison failed') || 
                           line.includes('snapshot doesn\'t exist'))
            .slice(0, 3); // Limit to first 3 errors per browser
        }
      }
    } catch (error) {
      console.log(`Could not read test output for ${browser}: ${error.message}`);
    }
    
    results.push({
      browser,
      hasScreenshotIssues,
      screenshotErrors
    });
  }
  
  // Only create a comment if there are screenshot issues
  if (hasAnyScreenshotIssues) {
    let comment = `### 🖼️ Playwright Visual Regression Test Results

Visual differences were detected in the following browsers:

`;
    
    for (const result of results) {
      if (result.hasScreenshotIssues) {
        comment += `#### ❌ ${result.browser}
**Issues Found:**
${result.screenshotErrors.length > 0 ? result.screenshotErrors.map(error => `- ${error.trim()}`).join('\n') : '- Check the test logs for details'}

`;
      } else {
        comment += `#### ✅ ${result.browser} - No visual issues detected

`;
      }
    }
    
    comment += `
**Next Steps:**
1. 📊 [View the detailed Playwright reports](https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${runId}) to see visual differences
2. 🔍 Review the changes to determine if they're expected
3. ✅ If the visual changes are correct, comment \`/approve-screenshots\` to update the baseline screenshots

**Reports:** Available in the workflow artifacts above`;
    
    // Create the consolidated comment
    await github.rest.issues.createComment({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      body: comment
    });
    
    console.log('Created visual regression comment with issues from browsers:', 
      results.filter(r => r.hasScreenshotIssues).map(r => r.browser).join(', '));
  } else {
    console.log('No visual regression issues detected - no comment created');
  }
}

module.exports = {
  createVisualRegressionComment,
  cleanupVisualRegressionComments
};
