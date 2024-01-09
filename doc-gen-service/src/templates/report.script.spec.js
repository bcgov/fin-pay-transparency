import puppeteer from 'puppeteer';
import { docGenServicePrivate } from '../v1/services/doc-gen-service';

describe('horizontalBarChart', () => {
  it('generates a horizontal bar chart with the expected visual elements.', async () => {
    // Open a headless web browser to a blank page
    const browser = await puppeteer.launch({
      args: ['--enable-logging', '--v=1', '--allow-file-access-from-files'],
      headless: 'new',
      dumpio: true,
    });
    const page = await browser.newPage();

    // Inject into the page the script that contains the horizontalBarChart
    // function, and also inject the d3.js library (which horitontalBarChart
    // depends on)
    await page.addScriptTag({ path: './node_modules/d3/dist/d3.min.js' });
    await page.addScriptTag({
      path: docGenServicePrivate.REPORT_TEMPLATE_SCRIPT,
    });

    // Set the page content to be a very simple HTML document with one
    // <div></div> tag.  (In one of the steps below we inject a chart into
    // this tag.)
    await page.setContent(
      `<!doctype html>
      <html>    
      <body><div id="chart"></div></body >
      </html>`,
      { waitUntil: 'networkidle0' },
    );

    //Define the data and colors that we'll show in the bar chart
    const params = {
      chartData: [
        { value: 1.0, genderChartInfo: { label: 'Male', color: '#1c3664' } },
        { value: 0.92, genderChartInfo: { label: 'Female', color: '#1b75bb' } },
        {
          value: 0.97,
          genderChartInfo: { label: 'Non-binary', color: '#00a54f' },
        },
        {
          value: 1.01,
          genderChartInfo: { label: 'Unknown', color: '#444444' },
        },
      ],
    };

    // Draw a bar chart in the page.
    await page.evaluate((params) => {
      const numberFormat = '0.2f'; //don't apply formatting to numbers
      document.getElementById('chart').appendChild(
        // @ts-ignore
        horizontalBarChart(params.chartData, numberFormat),
      );
    }, params);

    // Inspect the DOM of the page, and fetch some elements
    // of the SVG chart so we can verify they are as expected.

    // Fetch the color of each 'rect' element (the rect elements
    // represent the horizontal bars in the bar chart)
    const barColors = await page.$$eval('#chart svg g rect', (el) =>
      el.map((x) => x.getAttribute('fill')),
    );
    // Fetch the text labels for the gender categetories
    const genderCategoryLabels = await page.$$eval(
      '#chart svg g g text tspan',
      (el) => el.map((x) => x.textContent),
    );
    // Fetch the text labels showing gender pay gap values
    const payGapLabels = await page.$$eval('#chart svg > g > text', (el) =>
      el.map((x) => x.textContent),
    );

    await browser.close();

    expect(barColors).toEqual(
      params.chartData.map((d) => d.genderChartInfo.color),
    );
    expect(genderCategoryLabels).toEqual(
      params.chartData.map((d) => d.genderChartInfo.label),
    );
    expect(payGapLabels.map((d) => parseFloat(d))).toEqual(
      params.chartData.map((d) => d.value),
    );
  });
});
