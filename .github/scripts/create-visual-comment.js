const fs = require('fs');
const path = require('path');

/**
 * Checks if a browser has visual regression issues and handles comment creation/updating
 * @param {Object} github - GitHub API client
 * @param {Object} context - GitHub context object
 * @param {string} runId - GitHub Actions run ID
 * @param {string} browser - Browser name (e.g., 'Google Chrome')
 * @param {string} project - Project identifier from matrix
 * @param {string} workingDirectory - Working directory where the tests were run
 */
async function handleBrowserVisualResults(github, context, runId, browser, project, workingDirectory) {
  const outputFile = path.join(workingDirectory, 'output.log');
  
  const screenshotErrors = analyzeVisualRegressionIssues(outputFile, browser);
  const hasScreenshotIssues = screenshotErrors.length > 0;
  
  // Only proceed if there are screenshot issues
  if (!hasScreenshotIssues) {
    console.log(`No visual issues detected for ${browser} - no comment action needed`);
    return;
  }
  
  // Find existing comment or create new one
  let comment = await findVisualRegressionComment(github, context);
  
  if (!comment) {
    // Create new comment only if we have visual issues
    comment = await createVisualRegressionComment(github, context, runId);
  }
  
  // Append browser results to the comment
  await appendBrowserResultToComment(github, context, comment.id, comment.body, browser, project, workingDirectory);
}

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
        comment.body.includes('Playwright Visual Regression Test Results')) {
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
 * Analyzes test output for visual regression issues
 * @param {string} outputFile - Path to the test output file
 * @param {string} browser - Browser name for logging
 * @returns {Array<string>} Array of screenshot error messages, empty if no issues found
 */
function analyzeVisualRegressionIssues(outputFile, browser) {
  let screenshotErrors = [];
  
  try {
    if (fs.existsSync(outputFile)) {
      const logContent = fs.readFileSync(outputFile, 'utf8');
      
      // Check for screenshot-related errors
      if (logContent.includes('Screenshot comparison failed') || 
          logContent.includes('A snapshot doesn\'t exist')) {
        
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
  
  return screenshotErrors;
}

/**
 * Finds an existing visual regression comment
 * @param {Object} github - GitHub API client
 * @param {Object} context - GitHub context object
 * @returns {Object|null} Comment object with id and body, or null if not found
 */
async function findVisualRegressionComment(github, context) {
  // Check for existing visual regression comment
  const comments = await github.rest.issues.listComments({
    issue_number: context.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
  });
  
  const existingComment = comments.data.find(comment => 
    comment.user.type === 'Bot' && 
    comment.body.includes('Playwright Visual Regression Test Results')
  );
  
  if (existingComment) {
    console.log(`Found existing visual regression comment: ${existingComment.id}`);
    return {
      id: existingComment.id,
      body: existingComment.body
    };
  }
  
  return null;
}

/**
 * Creates a new visual regression comment
 * @param {Object} github - GitHub API client
 * @param {Object} context - GitHub context object
 * @param {string} runId - GitHub Actions run ID
 * @returns {Object} Comment object with id and body
 */
async function createVisualRegressionComment(github, context, runId) {
  const initialComment = `### Playwright Visual Regression Test Results

Visual differences were detected:

**Next Steps:**
1. [View the detailed Playwright reports](https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${runId}) to see visual differences
2. Review the changes to determine if they're expected
3. If the visual changes are correct, run the "Approve Screenshots" action from the Actions tab with this PR number to update the baseline screenshots

**Reports:** Available in the workflow artifacts above

---
`;
  
  const newComment = await github.rest.issues.createComment({
    issue_number: context.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
    body: initialComment
  });
  
  console.log(`Created new visual regression comment: ${newComment.data.id}`);
  return {
    id: newComment.data.id,
    body: initialComment
  };
}

/**
 * Appends browser-specific visual regression results to an existing comment
 * @param {Object} github - GitHub API client
 * @param {Object} context - GitHub context object
 * @param {number} commentId - ID of the comment to update
 * @param {string} currentBody - Current body of the comment
 * @param {string} browser - Browser name (e.g., 'Google Chrome')
 * @param {string} project - Project identifier from matrix
 * @param {string} workingDirectory - Working directory where the tests were run
 */
async function appendBrowserResultToComment(github, context, commentId, currentBody, browser, project, workingDirectory) {
  const outputFile = path.join(workingDirectory, 'output.log');
  
  const screenshotErrors = analyzeVisualRegressionIssues(outputFile, browser);
  const hasScreenshotIssues = screenshotErrors.length > 0;
  
  // Only append if there are screenshot issues
  if (!hasScreenshotIssues) {
    console.log(`No visual issues detected for ${browser} - skipping comment update`);
    return;
  }
  
  // Create browser-specific section
  let browserSection = `#### ${hasScreenshotIssues ? 'FAILED' : 'PASSED'} ${browser}`;
  
  if (hasScreenshotIssues) {
    browserSection += `\n**Issues Found:**\n`;
    if (screenshotErrors.length > 0) {
      browserSection += screenshotErrors.map(error => `- ${error.trim()}`).join('\n');
    } else {
      browserSection += '- Check the test logs for details';
    }
  } else {
    browserSection += ' - No visual issues detected';
  }
  
  browserSection += '\n\n';
  
  // Find insertion point (before "---" separator or at end)
  const separatorIndex = currentBody.indexOf('---');
  let updatedBody;
  
  if (separatorIndex !== -1) {
    // Insert before the separator
    updatedBody = currentBody.substring(0, separatorIndex) + browserSection + currentBody.substring(separatorIndex);
  } else {
    // Append to end
    updatedBody = currentBody + browserSection;
  }
  
  // Update the comment
  await github.rest.issues.updateComment({
    comment_id: commentId,
    owner: context.repo.owner,
    repo: context.repo.repo,
    body: updatedBody
  });
  
  console.log(`Updated comment with ${browser} results`);
}

module.exports = {
  cleanupVisualRegressionComments,
  handleBrowserVisualResults,
};
