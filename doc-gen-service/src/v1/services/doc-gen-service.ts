import ejs from 'ejs';
import fs from 'node:fs/promises';
import { resolve } from 'path';
import { Browser, Page } from 'puppeteer';
import { config } from '../../config';
import { logger } from '../../logger';
import { getBrowser } from './puppeteer-service';

const CONTENT_HEIGHT_UNCERTAINTY_PX = 4;

export const REPORT_FORMAT = {
  HTML: 'html' as string,
  PDF: 'pdf' as string,
};

const PDF_PPI = 96; //Pixels per inch. (Puppeteer uses this value internally.)
const PDF_PAGE_SIZE_INCHES = {
  width: 8.5,
  height: 11,
  marginX: 0.6,
  marginY: 0.5,
};
const PDF_PAGE_SIZE_PIXELS = {
  width: PDF_PAGE_SIZE_INCHES.width * PDF_PPI,
  height: PDF_PAGE_SIZE_INCHES.height * PDF_PPI,
  marginX: PDF_PAGE_SIZE_INCHES.marginX * PDF_PPI,
  marginY: PDF_PAGE_SIZE_INCHES.marginY * PDF_PPI,
};

const DEFAULT_FOOTNOTE_SYMBOLS = {
  genderCategorySuppressed: '*',
  quartileGenderCategorySuppressed: '†',
};

/*
Defines properties that must be submitted with any 
request to generate a report.
*/
export type SubmittedReportData = {
  companyName: string;
  companyAddress: string;
  reportingYear: number;
  reportStartDate: string;
  reportEndDate: string;
  naicsCode: string;
  naicsLabel: string;
  employeeCountRange: string;
  comments: string;
  dataConstraints: string;
  referenceGenderCategory: string;
  explanatoryNotes: unknown;
  chartData: {
    meanHourlyPayGap: unknown[];
    medianHourlyPayGap: unknown[];
    meanOvertimePayGap: unknown[];
    medianOvertimePayGap: unknown[];
    meanBonusPayGap: unknown[];
    medianBonusPayGap: unknown[];
    hourlyPayQuartile1: unknown[];
    hourlyPayQuartile2: unknown[];
    hourlyPayQuartile3: unknown[];
    hourlyPayQuartile4: unknown[];
    percentReceivingOvertimePay: unknown[];
    percentReceivingBonusPay: unknown[];
    hourlyPayQuartilesLegend: unknown[];
  };
  tableData: {
    meanOvertimeHoursGap: unknown;
    medianOvertimeHoursGap: unknown;
  };
  chartSummaryText: unknown;
  chartSuppressedError: string;
  isAllCalculatedDataSuppressed: boolean;
  genderCodes: string[];
  isDraft: boolean;
};

/*
Defines properties that are not explicitly
inlcuded in SubmittedReportData, but which are also needed
to generate a report.  For example: properties
derived from those in SubmittedReportData.
*/
type SupplementaryReportData = {
  pageSize: {
    margin: {
      top: number;
      bottom: number;
    };
    height: number;
  };
  footnoteSymbols: {
    genderCategorySuppressed: string;
    quartileGenderCategorySuppressed: string;
  };
  isGeneralSuppressedDataFootnoteVisible: boolean;
  fonts: any;
};

/* Includes everything from SubmittedReportData and SupplementaryReportData */
export type ReportData = SubmittedReportData & SupplementaryReportData;

const docGenServicePrivate = {
  STYLE_CLASSES: {
    REPORT: 'pay-transparency-report',
    NO_PAGE: 'no-page',
    PAGE: 'page',
    PAGE_CONTENT: 'page-content',
    BLOCK_GROUP: 'block-group',
    BLOCK: 'block',
    BLOCK_EXPLANATORY_NOTES: 'block-explanatory-notes',
    EXPLANATORY_NOTES: 'explanatory-notes',
    NOTE: 'note',
    FOOTNOTE_GROUP: 'footnote-group',
    FOOTNOTES: 'footnotes',
    WATERMARK: 'watermark',
  },

  REPORT_TEMPLATE_HEADER: resolve(
    /* istanbul ignore next */
    config.get('server:templatePath') || '',
    'report-template-header.html',
  ),
  REPORT_TEMPLATE_EMPLOYEE_DATA_SUMMARY: resolve(
    /* istanbul ignore next */
    config.get('server:templatePath') || '',
    'report-template-emp-data-summary.html',
  ),
  REPORT_TEMPLATE_INSUFFICIENT_DATA: resolve(
    /* istanbul ignore next */
    config.get('server:templatePath') || '',
    'report-template-insufficient-data.html',
  ),
  REPORT_TEMPLATE_FOOTER: resolve(
    /* istanbul ignore next */
    config.get('server:templatePath') || '',
    'report-template-footer.html',
  ),
  REPORT_TEMPLATE_SCRIPT: resolve(
    /* istanbul ignore next */
    config.get('server:templatePath') || '',
    'report.script.js',
  ),

  /**
   * Builds an ejs template suitable for creating a report from
   * the given report data.
   * Not all reports will use the same template.  For example, a report
   * in which all calculations are suppressed will use a template
   * that excludes the charts.
   */
  async buildEjsTemplate(reportData: ReportData): Promise<string> {
    // Build a template by combining multiple ejs template fragments
    // (each defined in a separate file).

    const header = await fs.readFile(
      docGenServicePrivate.REPORT_TEMPLATE_HEADER,
      { encoding: 'utf8' },
    );
    const fragments = [header];

    // The template should include an area for the main body of the content.
    // This section will look different depending on whether
    // *all* calculations have been suppressed or whether at least
    // some calculations weren't suppressed.
    if (reportData.isAllCalculatedDataSuppressed) {
      const insufficientData = await fs.readFile(
        docGenServicePrivate.REPORT_TEMPLATE_INSUFFICIENT_DATA,
        { encoding: 'utf8' },
      );
      fragments.push(insufficientData);
    } else {
      const employeeDataSummary = await fs.readFile(
        docGenServicePrivate.REPORT_TEMPLATE_EMPLOYEE_DATA_SUMMARY,
        { encoding: 'utf8' },
      );
      fragments.push(employeeDataSummary);
    }

    const footer = await fs.readFile(
      docGenServicePrivate.REPORT_TEMPLATE_FOOTER,
      { encoding: 'utf8' },
    );
    fragments.push(footer);

    return fragments.join('\n');
  },

  /* 
  This function is meant to run within the context of a "puppeteer page"
  to create a new DOM element representing a "report page" with two child
  elements:  
    <div class='page'>
      <div class='block-group'></div>
      <div class='explanatory-notes'></div>
    </div>
   */
  async addReportPage(parent: any, isDraft: boolean) {
    //Implementation note (banders): classNames are inline strings here because
    //I cannot find a way to pass the STYLE_CLASSES values into Puppeteer's
    //evaluate function

    /* istanbul ignore next */
    await parent.evaluate(
      (self, parent, isDraft) => {
        const page = document.createElement('div');
        page.className = 'page';
        const pageContent = document.createElement('div');
        pageContent.className = 'page-content';
        const blockGroup = document.createElement('div');
        blockGroup.className = 'block-group';
        const explanatoryNotes = document.createElement('div');
        explanatoryNotes.className = 'explanatory-notes';
        const explanatoryNotesTitle = document.createElement('h5');
        explanatoryNotesTitle.className = 'mb-2';
        const explanatoryNotesTitleText =
          document.createTextNode('Explanatory notes');
        const footnotes = document.createElement('div');
        footnotes.className = 'footnotes';

        if (isDraft) {
          const watermark = document.createElement('div');
          watermark.className = 'watermark';
          const watermarkBody = document.createElement('div');
          watermarkBody.className = 'watermark-body';
          const watermarkText = document.createTextNode('Draft');
          watermarkBody.appendChild(watermarkText);
          watermark.appendChild(watermarkBody);
          page.appendChild(watermark);
        }

        explanatoryNotesTitle.appendChild(explanatoryNotesTitleText);
        explanatoryNotes.appendChild(explanatoryNotesTitle);
        pageContent.appendChild(blockGroup);
        pageContent.appendChild(explanatoryNotes);
        pageContent.appendChild(footnotes);
        page.appendChild(pageContent);
        parent.appendChild(page);
      },
      parent,
      isDraft,
    );
    const allReportPages = await parent.$$(
      `.${docGenServicePrivate.STYLE_CLASSES.PAGE}`,
    );
    const newestReportPage = allReportPages[allReportPages.length - 1];
    if (!newestReportPage) {
      throw new Error('post condition failed: page not properly created');
    }
    return newestReportPage;
  },

  /*
  Moves the given Element 'elemToMove' in the DOM so it becomes a 
  child of 'elemToBeParent'.
  */
  async moveElementInto(puppeteerPage: Page, elemToMove, elemToBeParent) {
    if (!elemToMove) {
      throw new Error('elemToMove must not be null');
    }
    if (!elemToBeParent) {
      throw new Error('elemToBeParent must not be null');
    }
    /* istanbul ignore next */
    await puppeteerPage.evaluate(
      (e, p) => {
        p.appendChild(e);
        return e;
      },
      elemToMove,
      elemToBeParent,
    );
  },

  /*
  Deletes the given element from the DOM
  */
  async removeFromDom(puppeteerPage, elemToDelete) {
    /* istanbul ignore next */
    await puppeteerPage.evaluate((e) => {
      if (e?.parentNode) {
        e.parentNode.removeChild(e);
      }
    }, elemToDelete);
  },

  /*
  Checks if the given element is empty (i.e. has no children in the DOM)
  */
  async isElementEmpty(puppeteerPage, elem): Promise<boolean> {
    /* istanbul ignore next */
    return await puppeteerPage.evaluate((e) => !e?.childNodes?.length, elem);
  },

  /*
  Modifies the DOM in the given puppeteerPage.  All content blocks  
  not currently assigned to a "report page" are placed into 
  a report page in order. Takes into account block height and the 
  availability of space on the "report pages".
  */
  async organizeContentIntoPages(puppeteerPage: Page, reportData: ReportData) {
    const MAX_ATTEMPTS = 2;
    const payTransparencyReport = await puppeteerPage.$(
      `.${docGenServicePrivate.STYLE_CLASSES.REPORT}`,
    );
    const blocksToOrganize = await payTransparencyReport.$$(
      `.${docGenServicePrivate.STYLE_CLASSES.NO_PAGE} > .${docGenServicePrivate.STYLE_CLASSES.BLOCK_GROUP} > .${docGenServicePrivate.STYLE_CLASSES.BLOCK}`,
    );

    let currentReportPage = await docGenServicePrivate.addReportPage(
      payTransparencyReport,
      reportData.isDraft,
    );

    // Organize all 'blocks' and their corresponding 'explanatory-notes'
    // into 'page' elements
    for (let block of blocksToOrganize) {
      const isBlockEmpty = await docGenServicePrivate.isElementEmpty(
        puppeteerPage,
        block,
      );
      if (isBlockEmpty) {
        await docGenServicePrivate.removeFromDom(puppeteerPage, block);
        continue;
      }
      const blockId = await (await block.getProperty('id')).jsonValue();

      let wasBlockAddedToPage = false;
      let numAttempts = 0;
      while (numAttempts < MAX_ATTEMPTS) {
        wasBlockAddedToPage =
          await docGenServicePrivate.attemptToPlaceElementOnPage(
            puppeteerPage,
            block,
            `.${docGenServicePrivate.STYLE_CLASSES.BLOCK_GROUP}`,
            currentReportPage,
            reportData.pageSize,
          );
        if (wasBlockAddedToPage) {
          break;
        } else {
          // Add a new page to the report
          currentReportPage = await docGenServicePrivate.addReportPage(
            payTransparencyReport,
            reportData.isDraft,
          );
        }
        numAttempts++;
      }
      if (!wasBlockAddedToPage) {
        logger.warn(
          `Omitted block '${blockId}' (with its associated notes).  It is too large for the page.`,
        );
      }
    }

    // Move the footnotes to the end of the report
    const footnoteGroup = await payTransparencyReport.$(
      `.${docGenServicePrivate.STYLE_CLASSES.NO_PAGE} > .${docGenServicePrivate.STYLE_CLASSES.FOOTNOTE_GROUP}`,
    );
    await docGenServicePrivate.placeFootnotes(
      puppeteerPage,
      footnoteGroup,
      payTransparencyReport,
      reportData,
    );

    await docGenServicePrivate.clearEmptyNotes(
      puppeteerPage,
      payTransparencyReport,
    );

    await payTransparencyReport.dispose();
  },

  /**
   * Removes from the report any 'explanatory-notes' and 'footnotes' that have
   * no inner content.
   * @param puppeteerPage
   * @param footnoteGroup
   * @param payTransparencyReport
   * @param reportData
   * @returns
   */
  async clearEmptyNotes(puppeteerPage: Page, payTransparencyReport) {
    //For each "explanatory notes" section (one per page), determine if
    //it has at least one .block-explanatory-notes child.  If not, delete
    //the section (it's empty).
    const allExplanatoryNotes = await payTransparencyReport.$$(
      `.${docGenServicePrivate.STYLE_CLASSES.PAGE_CONTENT} .${docGenServicePrivate.STYLE_CLASSES.EXPLANATORY_NOTES}`,
    );
    if (allExplanatoryNotes?.length) {
      for (let explanatoryNotes of allExplanatoryNotes) {
        const blockExplanatoryNotes = await explanatoryNotes.$$(
          `.${docGenServicePrivate.STYLE_CLASSES.BLOCK_EXPLANATORY_NOTES}`,
        );

        if (!blockExplanatoryNotes?.length) {
          docGenServicePrivate.removeFromDom(puppeteerPage, explanatoryNotes);
        }
      }
    }

    //For each "footnotes" section (one per page), determine if
    //it has at least one .footnote-group child.  If not, delete
    //the section (it's empty).
    const allFootnotes = await payTransparencyReport.$$(
      `.${docGenServicePrivate.STYLE_CLASSES.PAGE_CONTENT} .${docGenServicePrivate.STYLE_CLASSES.FOOTNOTES}`,
    );
    if (allFootnotes?.length) {
      for (let footnotes of allFootnotes) {
        const footnoteGroups = await footnotes.$$(
          `.${docGenServicePrivate.STYLE_CLASSES.FOOTNOTE_GROUP}`,
        );

        if (!footnoteGroups?.length) {
          docGenServicePrivate.removeFromDom(puppeteerPage, footnotes);
        }
      }
    }
  },

  /*
  Adds the given footnoteGroup to last page of the given payTransparencyReport.
  If the footnoteGroup won't fit onto the last page, creates a new page, and
  adds it to that.
  Returns true if the footnoteGroup was successfully added (either to the existing 
  last page, or to a newly-created last page).  Returns false if anything fails.
  */
  async placeFootnotes(
    puppeteerPage,
    footnoteGroup,
    payTransparencyReport,
    reportData: ReportData,
  ): Promise<boolean> {
    if (!footnoteGroup) {
      return false;
    }

    const allReportPages = await puppeteerPage.$$(
      `.${docGenServicePrivate.STYLE_CLASSES.REPORT} .${docGenServicePrivate.STYLE_CLASSES.PAGE}`,
    );
    if (!allReportPages?.length) {
      throw new Error(
        'Report must have at least one existing page to place footnotes',
      );
    }

    let lastReportPage = allReportPages[allReportPages.length - 1];

    const MAX_ATTEMPTS = 2;
    let numAttempts = 0;
    let wasAddedToPage = false;
    while (numAttempts < MAX_ATTEMPTS) {
      wasAddedToPage = await docGenServicePrivate.attemptToPlaceElementOnPage(
        puppeteerPage,
        footnoteGroup,
        `.${docGenServicePrivate.STYLE_CLASSES.FOOTNOTES}`,
        lastReportPage,
        reportData.pageSize,
      );
      if (wasAddedToPage) {
        break;
      } else {
        lastReportPage = await docGenServicePrivate.addReportPage(
          payTransparencyReport,
          reportData.isDraft,
        );
      }
      numAttempts++;
    }
    if (!wasAddedToPage) {
      logger.warn(`Unable to add footnotes to page`);
    }
    return wasAddedToPage;
  },

  /**
   * Get the height of the element and all its content
   * Note: this method can slightly underestimate the true height
   * (by a few pixels at most).  Recommend that any
   * comparisons of height returned by this function allow
   * some tolerance for the uncertainty, such as by using:
   * CONTENT_HEIGHT_UNCERTAINTY_PX
   */
  async getContentHeight(puppeteerPage, elem): Promise<number> {
    const heightPx = (await elem.boundingBox()).height;
    return heightPx;
  },

  /*
  Moves the given elementToPlace onto the given reportPage (under the child element 
  identified by pageTargetSelector).  After the element is moved, checks the
  total content height of the page against the maximum page height.  If adding
  the element caused the page content to exceed the page height, then the element is
  removed and the method returns false.  Otherwise the moved element kept in its new 
  position and the method returns true.
  There is also some special logic to handle the case of elementToPlace having class 
  'block'.  In that situation, it is assumed that the block may have a 
  'block-explanatory-notes' child, and that child is moved into the 'explanatory-notes'
  section of the page.
  */
  async attemptToPlaceElementOnPage(
    puppeteerPage: Page,
    elementToPlace,
    pageTargetSelector,
    reportPage,
    reportPageOptions: any,
  ): Promise<boolean> {
    if (!elementToPlace) {
      throw new Error('elementToPlace must be specified');
    }
    if (!reportPage) {
      throw new Error('reportPage must be specified');
    }

    const pageContentSection = await reportPage.$(
      `.${docGenServicePrivate.STYLE_CLASSES.PAGE_CONTENT}`,
    );
    const targetPageSection = await pageContentSection.$(pageTargetSelector);

    if (!targetPageSection) {
      throw new Error(
        `Precondition failed: cannot find ${pageTargetSelector} within the page's .${docGenServicePrivate.STYLE_CLASSES.PAGE_CONTENT} section`,
      );
    }

    const pageExplanatoryNotesSection = await pageContentSection.$(
      `.${docGenServicePrivate.STYLE_CLASSES.EXPLANATORY_NOTES}`,
    );

    // Move the elementToPlace into .page > .page-content > [pageTargetSelector]
    await docGenServicePrivate.moveElementInto(
      puppeteerPage,
      elementToPlace,
      targetPageSection,
    );

    //If the elementToPlace is a block with a .block-explanatory-notes child:
    //Move elementToPlace > .block-explanatory-notes into .page > .explanatory-notes
    const blockExplanatoryNotesSection = await elementToPlace.$(
      `.${docGenServicePrivate.STYLE_CLASSES.BLOCK_EXPLANATORY_NOTES}`,
    );
    if (blockExplanatoryNotesSection) {
      await docGenServicePrivate.moveElementInto(
        puppeteerPage,
        blockExplanatoryNotesSection,
        pageExplanatoryNotesSection,
      );
    }

    const currentPageHeightCommittedPx =
      await docGenServicePrivate.getContentHeight(
        puppeteerPage,
        pageContentSection,
      );

    const totalPageHeightPx =
      reportPageOptions.height -
      reportPageOptions.margin.top -
      reportPageOptions.margin.bottom;

    const fitsOnPage =
      currentPageHeightCommittedPx + CONTENT_HEIGHT_UNCERTAINTY_PX <
      totalPageHeightPx;
    if (!fitsOnPage) {
      // Rollback.  elemToPlace was placed on the current page, but it was too large.
      // We need to remove it from the current page.

      // Removes elementToPlace from its new position in the DOM.  For simplicity,
      // this element isn't moved back to its
      // original position in the DOM (the function that calls this one is
      // expected to retain a reference to it, and to try to position it on a
      // new page)
      await docGenServicePrivate.removeFromDom(puppeteerPage, elementToPlace);

      // If elemToPlace was a .block and had a .block-explanatory-notes child which
      // was also copied onto the current page, move the explanatory notes
      // back into the .block.
      // i.e. Move page > .explanatory-notes > .block-explanatory-notes (last child) back into
      // elemToPlace.
      if (blockExplanatoryNotesSection) {
        const allFootnotesSectionsOnPage = await pageExplanatoryNotesSection.$$(
          `.${docGenServicePrivate.STYLE_CLASSES.BLOCK_EXPLANATORY_NOTES}`,
        );
        if (allFootnotesSectionsOnPage.length) {
          const lastFootnotesSectionsOnPage =
            allFootnotesSectionsOnPage[allFootnotesSectionsOnPage.length - 1];
          await docGenServicePrivate.moveElementInto(
            puppeteerPage,
            lastFootnotesSectionsOnPage,
            elementToPlace,
          );
        }
      }
    }

    return fitsOnPage;
  },

  /**
   * Determines whether any of the included charts or tables in the given
   * SubmittedReportData had one or more gender categories suppressed.
   */
  isGeneralSuppressedDataFootnoteVisible(
    submittedReportData: SubmittedReportData,
  ) {
    const chartsToConsider = [
      'meanHourlyPayGap',
      'medianHourlyPayGap',
      'meanOvertimePayGap',
      'medianOvertimePayGap',
      'meanBonusPayGap',
      'medianBonusPayGap',
    ];
    const tablesToConsider = ['meanOvertimeHoursGap', 'medianOvertimeHoursGap'];
    const numGenderCategories = submittedReportData.genderCodes.length;
    const hasAtLeastOneIncludedChartWithSuppression =
      submittedReportData.chartData &&
      chartsToConsider
        .map((chartName) => submittedReportData.chartData[chartName])
        .filter((c) => c.length && c.length < numGenderCategories).length > 0;

    // Note: (numGenderCategories - 1) because because the reference gender
    // category isn't displayed in the tables
    const hasAtLeastOneIncludedTableWithSuppression =
      submittedReportData.tableData &&
      tablesToConsider
        .map((tableName) => submittedReportData.tableData[tableName])
        .filter((c) => c.length && c.length < numGenderCategories - 1).length >
        0;
    return (
      hasAtLeastOneIncludedChartWithSuppression ||
      hasAtLeastOneIncludedTableWithSuppression
    );
  },

  async toBase64(filePath) {
    const data = await fs.readFile(filePath);
    return data.toString('base64');
  },

  /**
   * Creates a new ReportData object which includes
   * everything from the given SubmittedReportData, plus
   * some additional derived or default properties needed
   * to generate the report.
   */
  async addSupplementaryReportData(
    submittedReportData: SubmittedReportData,
  ): Promise<ReportData> {
    const supplementaryReportData: SupplementaryReportData = {
      pageSize: {
        margin: {
          top: PDF_PAGE_SIZE_PIXELS.marginY,
          bottom: PDF_PAGE_SIZE_PIXELS.marginY,
        },
        height: PDF_PAGE_SIZE_PIXELS.height,
      },
      footnoteSymbols: DEFAULT_FOOTNOTE_SYMBOLS,
      isGeneralSuppressedDataFootnoteVisible:
        docGenServicePrivate.isGeneralSuppressedDataFootnoteVisible(
          submittedReportData,
        ),
      fonts: {
        BCSansRegular: await this.toBase64(
          './node_modules/@bcgov/bc-sans/fonts/BCSans-Regular.woff',
        ),
        BCSansBold: await this.toBase64(
          './node_modules/@bcgov/bc-sans/fonts/BCSans-Bold.woff',
        ),
      },
    };
    const reportData: ReportData = {
      ...submittedReportData,
      ...supplementaryReportData,
    };
    return reportData;
  },
};

/**
 * Generates a reportin the specified format, using the specified data.
 * @param reportFormat The type of report to generate (e.g. 'pdf', 'html')
 * @param reportData The data to use when generating the report
 * Implementation notes:
 *  This method uses the the puppeteer headless web browser internally
 *  to build the report as an HTML page.  The final HTML can be either returned
 *  "as is", or puppeteer can export it as a PDF.
 *  The HTML report is build in two stages:
 *    1. Generate all charts. Inject the charts and other dynamic content
 *       into the DOM.  All content is grouped into "blocks", (i.e. <div> tags
 *       with class="block").  Blocks are sections that should never be split
 *       across multiple pages.
 *    2. Blocks are organized into "pages" (i.e. <div> tags with clas="page")
 *       by comparing the rendered height of the block to the amount of
 *       space still available on a given page.  Each "page" has a height
 *       corresponding to the pixel-equivalent of an 8.5"x11" piece of paper
 *       at 96 PPI.  The amount of available space on a page decreases
 *       when a "block" is assigned to it.  A new page is started when the
 *       next block won't fit on the current page.
 *       An important detail here is that each "block" may have corresponding
 *       "explanatory-notes", but explanatory notes are ordered differently than
 *       the blocks.  Explanatory notes may or may not occur immediately below
 *       a given block, but they must always appear on the bottom of the same
 *       page as the corresponding block.  The second phase of processing
 *       handles the placement of "explanatory notes" too.
 *
 * After stage 1, the DOM of the HTML report looks like this:
 *
 * <div class="pay-transparency-report">
 *   <div class="no-page">
 *     <div class="blocks">
 *       <div class="block">
 *         <!-- main block content here -->
 *         <div class="explanatory-notes">
 *           <!-- if there are any explanatory notes corresponding to the
 *                block, they go here -->
 *         </div> *
 *       </div>
 *       ... <!-- more 'block' elements -->
 *     </div>
 *     <div class="all-footnotes">
 *        <!-- footnotes are like explanatory notes, except
 *             footnotes are ultimately moved the the bottom of the last
 *             page (not to the bottom of the current page) -->
 *     </div>
 *   </div>
 * </div>
 *
 * After stage 2, the DOM of the HTML report has been transformed
 * to look like this:
 *
 * <div class="pay-transparency-report">
 *   <div class="no-page">
 *     <!-- empty -->
 *   </div>
 *   <div class="pages"> <!-- this section is newly created -->
 *     <div class="page">
 *       <div class="blocks">
 *         <div class="block">
 *           <!-- the main block content from stage 1 remains here,
 *                but the explanatory notes and footnotes children
 *                were removed as children of the block, and are now
 *                children of the page.
 *         </div>
 *         ...
 *       </div>
 *       <div class="explanatory-notes">
 *         ...
 *       </div>
 *       <div class="footnotes">
 *         ...
 *       </div>
 *     </div>
 *     ...
 *   </div>
 * </div>
 */
async function generateReport(
  reportFormat: string,
  submittedReportData: SubmittedReportData,
) {
  logger.info('Begin generate report');
  let puppeteerPage: Page = null;
  const reportData =
    await docGenServicePrivate.addSupplementaryReportData(submittedReportData);

  try {
    const ejsTemplate = await docGenServicePrivate.buildEjsTemplate(reportData);

    const workingHtml: string = ejs.render(ejsTemplate, reportData, {
      rmWhitespace: false,
    });
    const browser: Browser = await getBrowser();
    puppeteerPage = await browser.newPage();
    await puppeteerPage.addScriptTag({
      path: './node_modules/d3/dist/d3.min.js',
    });
    await puppeteerPage.addScriptTag({
      path: docGenServicePrivate.REPORT_TEMPLATE_SCRIPT,
    });
    await puppeteerPage.setContent(workingHtml, { waitUntil: 'networkidle0' });

    // Generate charts as SVG, and inject the charts into the DOM of the
    // current puppeteerPage
    await puppeteerPage.evaluate(
      /* istanbul ignore next */
      (reportData) => {
        const chartData = reportData.chartData;
        document.getElementById('mean-hourly-pay-gap-chart')?.appendChild(
          // @ts-ignore
          horizontalBarChart(chartData.meanHourlyPayGap),
        );
        document.getElementById('median-hourly-pay-gap-chart')?.appendChild(
          // @ts-ignore
          horizontalBarChart(chartData.medianHourlyPayGap),
        );
        document.getElementById('mean-overtime-pay-gap-chart')?.appendChild(
          // @ts-ignore
          horizontalBarChart(chartData.meanOvertimePayGap),
        );
        document.getElementById('median-overtime-pay-gap-chart')?.appendChild(
          // @ts-ignore
          horizontalBarChart(chartData.medianOvertimePayGap),
        );
        document
          .getElementById('percent-receiving-overtime-pay-chart')
          ?.appendChild(
            // @ts-ignore
            percentFilledHorizBarChart(chartData.percentReceivingOvertimePay),
          );
        document.getElementById('mean-bonus-pay-gap-chart')?.appendChild(
          // @ts-ignore
          horizontalBarChart(chartData.meanBonusPayGap),
        );
        document.getElementById('median-bonus-pay-gap-chart')?.appendChild(
          // @ts-ignore
          horizontalBarChart(chartData.medianBonusPayGap),
        );
        document
          .getElementById('percent-receiving-bonus-pay-chart')
          ?.appendChild(
            // @ts-ignore
            percentFilledHorizBarChart(chartData.percentReceivingBonusPay),
          );
        document.getElementById('hourly-pay-quartile-4-chart')?.appendChild(
          // @ts-ignore
          horizontalStackedBarChart(chartData.hourlyPayQuartile4),
        );
        document.getElementById('hourly-pay-quartile-3-chart')?.appendChild(
          // @ts-ignore
          horizontalStackedBarChart(chartData.hourlyPayQuartile3),
        );
        document.getElementById('hourly-pay-quartile-2-chart')?.appendChild(
          // @ts-ignore
          horizontalStackedBarChart(chartData.hourlyPayQuartile2),
        );
        document.getElementById('hourly-pay-quartile-1-chart')?.appendChild(
          // @ts-ignore
          horizontalStackedBarChart(chartData.hourlyPayQuartile1),
        );
        document.getElementById('hourly-pay-quartiles-legend')?.appendChild(
          // @ts-ignore
          createLegend(chartData.hourlyPayQuartilesLegend),
        );
      },
      reportData,
    );

    //Reorganize the content in the DOM so it is grouped into <div>
    //elements with the .page class.
    await docGenServicePrivate.organizeContentIntoPages(
      puppeteerPage,
      reportData,
    );

    let result = null;
    if (reportFormat == REPORT_FORMAT.HTML) {
      const renderedHtml = await puppeteerPage.content();
      result = renderedHtml;
    } else if (reportFormat == REPORT_FORMAT.PDF) {
      const pdfOptions = {
        margin: {
          top: `${PDF_PAGE_SIZE_PIXELS.marginY}px`,
          right: `${PDF_PAGE_SIZE_PIXELS.marginX}px`,
          bottom: `${PDF_PAGE_SIZE_PIXELS.marginY}px`,
          left: `${PDF_PAGE_SIZE_PIXELS.marginX}px`,
        },
        printBackground: false,
        width: `${PDF_PAGE_SIZE_PIXELS.width}px`,
        height: `${PDF_PAGE_SIZE_PIXELS.height}px`,
      };
      const pdf = await puppeteerPage.pdf(pdfOptions);
      result = pdf;
    }

    if (!result) {
      throw new Error(`Unable to generate report in format: '${reportFormat}'`);
    }

    logger.info(`Report generation complete (${reportFormat})`);
    return result;
  } catch (e) {
    /* istanbul ignore next */
    logger.error(e);
  } finally {
    if (puppeteerPage) {
      await puppeteerPage.close();
    }
  }
}

export { docGenServicePrivate, generateReport };
