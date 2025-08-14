const fs = require('fs');
const path = require('path');

/**
 * Analyzes test results JSON for visual regression issues across all browsers
 * @param {string} workingDirectory - Working directory where test-results.json is located
 * @returns {Map<string, Array<Object>>} Map of browser name to array of error objects
 */
function analyzeVisualRegressionIssues(workingDirectory) {
  const testResultsPath = path.join(workingDirectory, 'test-results.json');
  const browserErrorMap = new Map();
  
  try {
    if (!fs.existsSync(testResultsPath)) {
      console.log(`No test-results.json found at ${testResultsPath}`);
      return browserErrorMap;
    }
    
    const testResults = JSON.parse(fs.readFileSync(testResultsPath, 'utf8'));
    
    // Process each suite
    for (const suite of testResults.suites || []) {
      processSuite(suite, [], browserErrorMap);
    }
    
  } catch (error) {
    console.log(`Could not read or parse test results: ${error.message}`);
  }
  
  return browserErrorMap;
}

/**
 * Recursively processes test suites to extract visual regression errors
 * @param {Object} suite - Test suite object
 * @param {Array<string>} titlePath - Accumulated title path
 * @param {Map} browserErrorMap - Map to accumulate browser errors
 */
function processSuite(suite, titlePath, browserErrorMap) {
  const currentPath = [...titlePath, suite.title].filter(Boolean);
  
  // Process specs in this suite
  if (suite.specs) {
    for (const spec of suite.specs) {
      processSpec(spec, currentPath, browserErrorMap);
    }
  }
  
  // Process nested suites
  if (suite.suites) {
    for (const nestedSuite of suite.suites) {
      processSuite(nestedSuite, currentPath, browserErrorMap);
    }
  }
}

/**
 * Processes a test spec to extract visual regression errors
 * @param {Object} spec - Test spec object
 * @param {Array<string>} titlePath - Accumulated title path
 * @param {Map} browserErrorMap - Map to accumulate browser errors
 */
function processSpec(spec, titlePath, browserErrorMap) {
  const specPath = [...titlePath, spec.title].filter(Boolean);
  
  if (spec.tests) {
    for (const test of spec.tests) {
      processTest(test, specPath, browserErrorMap);
    }
  }
}

/**
 * Processes a test to extract visual regression errors
 * @param {Object} test - Test object
 * @param {Array<string>} titlePath - Accumulated title path
 * @param {Map} browserErrorMap - Map to accumulate browser errors
 */
function processTest(test, titlePath, browserErrorMap) {
  if (test.results) {
    for (const result of test.results) {
      if (result.status === 'failed' && result.errors) {
        for (const error of result.errors) {
          if (isVisualRegressionError(error.message)) {
            const browserName = test.projectName || 'Unknown';
            const errorObj = createErrorObject(titlePath, error, result.attachments || []);
            
            if (!browserErrorMap.has(browserName)) {
              browserErrorMap.set(browserName, []);
            }
            browserErrorMap.get(browserName).push(errorObj);
          }
        }
      }
    }
  }
}

/**
 * Checks if an error message indicates a visual regression issue
 * @param {string} message - Error message
 * @returns {boolean} True if it's a visual regression error
 */
function isVisualRegressionError(message) {
  return message.includes('A snapshot doesn\'t exist') || 
         message.includes('Screenshot comparison failed');
}

/**
 * Creates an error object from test data
 * @param {Array<string>} titlePath - Test title path
 * @param {Object} error - Error object from test results
 * @param {Array} attachments - Test attachments
 * @returns {Object} Formatted error object
 */
function createErrorObject(titlePath, error, attachments) {
  const titles = titlePath.join('/');
  
  let errorDisplay = 'Visual regression error';
  if (error.message.includes('A snapshot doesn\'t exist')) {
    errorDisplay = 'A snapshot doesn\'t exist';
  } else if (error.message.includes('Screenshot comparison failed')) {
    errorDisplay = 'Screenshot comparison failed';
  }
  
  const files = attachments
    .filter(att => att.contentType === 'image/png')
    .map(att => att.name || 'unknown-file');
  
  return {
    titles,
    errorDisplay,
    files
  };
}

/**
 * Checks if there are any visual regression issues across all browsers and handles comment creation/updating
 * @param {Object} github - GitHub API client
 * @param {Object} context - GitHub context object
 * @param {string} runId - GitHub Actions run ID
 * @param {string} workingDirectory - Working directory where the tests were run
 */
async function handleBrowserVisualResults(github, context, runId, workingDirectory) {
  const browserErrorMap = analyzeVisualRegressionIssues(workingDirectory);
  
  // Check if there are any visual issues at all
  const hasAnyIssues = Array.from(browserErrorMap.values()).some(errors => errors.length > 0);
  
  if (!hasAnyIssues) {
    console.log('No visual regression issues detected across all browsers - no comment action needed');
    return;
  }
  
  // Find existing comment or create new one
  let comment = await findVisualRegressionComment(github, context);
  
  if (!comment) {
    // Create new comment only if we have visual issues
    comment = await createVisualRegressionComment(github, context, runId);
  }
  
  // Update comment with all browser results
  await updateCommentWithAllResults(github, context, comment.id, comment.body, browserErrorMap);
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
3. If the visual changes are correct, choose one of these options to update the baseline screenshots:
   - **Comment method**: Add a comment with \`/approve-screenshots\` to automatically update screenshots and re-run tests
   - **Manual method**: Run the "Approve Screenshots" action from the Actions tab with this PR number

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
 * Updates comment with all browser results
 * @param {Object} github - GitHub API client
 * @param {Object} context - GitHub context object
 * @param {number} commentId - ID of the comment to update
 * @param {string} currentBody - Current body of the comment
 * @param {Map<string, Array<Object>>} browserErrorMap - Map of browser errors
 */
async function updateCommentWithAllResults(github, context, commentId, currentBody, browserErrorMap) {
  let resultsSection = '';
  
  for (const [browserName, errors] of browserErrorMap.entries()) {
    if (errors.length > 0) {
      resultsSection += `#### FAILED ${browserName}\n`;
      resultsSection += `**Issues Found:**\n`;
      
      for (const error of errors) {
        resultsSection += `- **${error.titles}**: ${error.errorDisplay}\n`;
        if (error.files.length > 0) {
          resultsSection += `  - Files: ${error.files.join(', ')}\n`;
        }
      }
      resultsSection += '\n';
    }
  }
  
  // Find insertion point (before "---" separator or at end)
  const separatorIndex = currentBody.indexOf('---');
  let updatedBody;
  
  if (separatorIndex !== -1) {
    // Insert before the separator
    updatedBody = currentBody.substring(0, separatorIndex) + resultsSection + currentBody.substring(separatorIndex);
  } else {
    // Append to end
    updatedBody = currentBody + resultsSection;
  }
  
  // Update the comment
  await github.rest.issues.updateComment({
    comment_id: commentId,
    owner: context.repo.owner,
    repo: context.repo.repo,
    body: updatedBody
  });
  
  console.log(`Updated comment with results for ${Array.from(browserErrorMap.keys()).join(', ')}`);
}

module.exports = {
  cleanupVisualRegressionComments,
  handleBrowserVisualResults
};
