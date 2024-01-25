/*
Creates a chart of horizontal bars, in which each
bar is depicted in two parts: a colored portion which shows the 
"filled" portion, and a grey area which shows the "unfilled"
portion.  For example, a data value of 10 will show
as a colored bar covering 10% of the range, and a gray
bar showing the remaining 90%.
@param data:  is an array of objects of this form:
    {
    genderChartInfo: {
      label: "MY_LABEL", 
      color: "HEX_COLOR"
    },
    value: NUMERIC_VAL_HERE, //0-1
*/
function percentFilledHorizBarChart(data, options = {}) {
  const defaultOptions = {
    numberFormat: '1.0f',
    maxX: 100,
    unfilledColor: '#eeeeee',
  };
  options = { ...defaultOptions, ...options };

  const barHeight = 37;
  const marginTop = 0;
  const marginRight = 110;
  const marginBottom = 10;
  const marginLeft = 0;
  const width = 600;
  const valueFont = 'bold 18px sans-serif';
  const labelFontSizePx = 14;
  const labelFont = `${labelFontSizePx}px sans-serif`;
  const height =
    Math.ceil((data.length + 0.1) * barHeight) + marginTop + marginBottom;

  // Create the scales.
  const x = d3
    .scaleLinear()
    .domain([0, options.maxX])
    .range([marginLeft, width - marginRight]);

  const y = d3
    .scaleBand()
    //preserve the order of the bars
    .domain(data.map((d) => d.genderChartInfo.label))
    //sort the bars from largest to smallest
    //.domain(d3.sort(data, d => -d.value).map(d => d.genderChartInfo.label))
    .rangeRound([marginTop, height - marginBottom])
    .padding(0.1);

  // Create a value format.
  const format = (d) => `${x.tickFormat(1, options.numberFormat)(d)}%`;

  // Create the SVG container.
  const svg = d3
    .create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', `max-width: 100%; height: auto; font: ${valueFont};`);

  const color = (i) => colors[i];

  // Append two bars for each data element:
  //  one on the left to represent the primary data value
  // another on the right to represent the difference between the
  // maxX and the data value (the unfilled portion)
  const bars = svg.append('g').selectAll().data(data).enter().append('g');

  //a rect representing the "filled" portion
  bars
    .append('rect')
    .attr('fill', (d, i) => d.genderChartInfo.color)
    .attr('x', x(0))
    .attr('y', (d) => y(d.genderChartInfo.label))
    .attr('width', (d) => x(d.value) - x(0))
    .attr('height', y.bandwidth());

  //a second rect representing the remaining "unfilled" portion
  bars
    .append('rect')
    .attr('fill', options.unfilledColor)
    .attr('x', (d) => x(d.value))
    .attr('y', (d) => y(d.genderChartInfo.label))
    .attr('width', (d) => x(options.maxX) - x(d.value))
    .attr('height', y.bandwidth());

  // Append a label for each category.
  svg
    .append('g')
    .attr('fill', 'white')
    .attr('text-anchor', 'end')
    .selectAll()
    .data(data)
    .join('text')
    .attr('x', (d) => x(d.value))
    .attr('y', (d) => y(d.genderChartInfo.label) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('dx', -4)
    .text((d) => format(d.value))
    .call((text) =>
      text
        //if the bar is too small for the label, move the label to the right-hand side of the bar
        .filter((d) => {
          return (
            getTextSize(format(d.value), valueFont).width >
            (x(d.value) - x(0)) * 0.9
          );
        })
        .attr('dx', +4)
        .attr('fill', 'black')
        .attr('text-anchor', 'start')
        .attr('style', `font: ${valueFont}`),
    );

  // Create the vertical axis
  svg
    .append('g')
    .attr('text-anchor', 'center')
    //right-align
    .attr('transform', `translate(${width - marginRight},0)`)
    //remove tick marks
    .call(d3.axisRight(y).tickSizeOuter(0).tickSize(0))
    //remove vertical axis line
    .call((g) => g.select('.domain').remove())
    //font
    .attr('style', `font: ${labelFont};`)
    .selectAll('.tick text');
  //.call(lineWrap, marginRight, labelFontSizePx);

  return svg.node();
}

/*
 Creates a horizontal stacked bar chart in the format needed for the 
 Hourly Pay Quartiles section of the Pay Transparency Report. 
 Depends on d3.js (i.e. must run from a page with d3.js included).
 @data is an array of objects with this format 
  {
    genderChartInfo: {
      label: "MY_LABEL", 
      color: "HEX_COLOR"
    },
    value: NUMERIC_VAL_HERE,
    stack: "STACK_NAME" <-- Optional.  If there are to be multiple stacks, give the name of a stack here
  }
The array should contain one record per gender catetory.
Adapted from the example here:
  https://observablehq.com/@d3/stacked-horizontal-bar-chart/2
*/
function horizontalStackedBarChart(data, numberFormat = '1.0f') {
  // Specify the chart's dimensions (except for the height).
  const width = 600;
  const marginTop = 0;
  const marginRight = 0;
  const marginBottom = 16;
  const marginLeft = 0;
  const barHeight = 23;
  const defaultStack = 'stack-1';
  const primaryFont = '12px sans-serif';
  const secondaryFont = '10px sans-serif';
  const minBarWidthForLabel = 75; //px

  // Determine the series that need to be stacked.
  const stacks = d3
    .stack()
    .keys(d3.union(data.map((d) => d.genderChartInfo.code))) // distinct series keys, in input order
    .value(([, D], key) => D.get(key).value)(
    // get value for each series key and stack
    d3.index(
      data,
      (d) => d.stack || defaultStack,
      (d) => d.genderChartInfo.code,
    ),
  ); // group by stack then series key

  // Compute the height from the number of stacks.
  const height = stacks[0].length * barHeight + marginTop + marginBottom;

  // Prepare the scales for positional and color encodings.
  const x = d3
    .scaleLinear()
    .domain([0, d3.max(stacks, (d) => d3.max(d, (d) => d[1]))])
    .range([marginLeft, width - marginRight]);

  const y = d3
    .scaleBand()
    .domain(
      d3.groupSort(
        data,
        (D) => -d3.sum(D, (d) => d.value),
        (d) => d.stack || defaultStack,
      ),
    )
    .range([marginTop, height - marginBottom])
    .padding(0.08);

  const format = x.tickFormat(1, numberFormat);
  const color = (key) =>
    data
      .filter((d) => d.genderChartInfo.code == key)
      .map((d) => d.genderChartInfo.color)[0];
  const label = (key) =>
    data
      .filter((d) => d.genderChartInfo.code == key)
      .map((d) => `${d.genderChartInfo.label} (${format(d.value)}%)`)[0];

  const barWidth = (d) => x(d[1]) - x(d[0]);

  // A function to format the value in the tooltip.
  const formatValue = (x) => (isNaN(x) ? 'N/A' : x.toLocaleString('en'));

  // Create the SVG container.
  const svg = d3
    .create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'max-width: 100%; height: auto;');

  const barGroup = svg.append('g').append('g').selectAll().data(stacks);

  const barGroupPart = barGroup
    .join('g')
    .attr('fill', (d) => color(d.key))
    .selectAll('rect')
    .data((D) => D.map((d) => ((d.key = D.key), d)));

  const barsRects = barGroupPart
    .join('rect')
    .attr('x', (d) => x(d[0]))
    .attr('y', (d) => y(d.data[0]))
    .attr('height', y.bandwidth())
    .attr('width', barWidth);

  const unrenderedLabels = [];
  const barLabels = barGroupPart
    .join('g')
    .attr('fill', 'white')
    .attr('text-anchor', 'middle')
    .append('text')
    .attr('x', (d) => x(d[0] + (d[1] - d[0]) / 2))
    .attr('y', (d) => y(d.data[0]) + barHeight / 2)
    .attr('dy', '0.20em')
    .attr('style', `font: ${primaryFont}; font-weight: normal;`)
    .text((d) => {
      const barLabel = label(d.key);
      const barLabelWidth = getTextSize(barLabel, primaryFont).width;
      if (barLabelWidth <= barWidth(d) * 0.9) {
        return barLabel;
      }
      unrenderedLabels.push(barLabel);
      return '';
    });

  const secondaryLabels = svg
    .select('g')
    .append('g')
    .attr('fill', 'black')
    .attr('text-anchor', 'end')
    .append('text')
    .attr('dy', height - marginBottom / 2)
    .attr('dx', width)
    .attr('style', `font: ${secondaryFont}; font-weight: normal`)
    .text((d) => unrenderedLabels.join(' '));

  return svg.node();
}

/*
 Creates a horizontal bar chart in the format needed for the Pay 
 Transparency Report. Depends on d3.js (i.e. must run from a page 
 with d3.js included).
 @data is an array of objects with this format 
  {
    genderChartInfo: {
      label: "MY_LABEL", 
      color: "HEX_COLOR"
    },
    value: NUMERIC_VAL_HERE
  }

*/
function horizontalBarChart(data, numberFormat = '$0.2f') {
  const barHeight = 37;
  const marginTop = 0;
  const marginRight = 110;
  const marginBottom = 10;
  const marginLeft = 0;
  const width = 400;
  const valueFont = 'bold 18px sans-serif';
  const labelFontSizePx = 14;
  const labelFont = `${labelFontSizePx}px sans-serif`;
  const height =
    Math.ceil((data.length + 0.1) * barHeight) + marginTop + marginBottom;

  // Create the scales.
  const x = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.value)])
    .range([marginLeft, width - marginRight]);

  const y = d3
    .scaleBand()
    //preserve the order of the bars
    .domain(data.map((d) => d.genderChartInfo.label))
    //sort the bars from largest to smallest
    //.domain(d3.sort(data, d => -d.value).map(d => d.genderChartInfo.label))
    .rangeRound([marginTop, height - marginBottom])
    .padding(0.1);

  // Create a value format.
  const format = x.tickFormat(1, numberFormat);

  // Create the SVG container.
  const svg = d3
    .create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', `max-width: 100%; height: auto; font: ${valueFont};`);

  const color = (i) => colors[i];

  // Append a rect for each category.
  svg
    .append('g')
    .selectAll()
    .data(data)
    .join('rect')
    .attr('fill', (d, i) => d.genderChartInfo.color)
    .attr('x', x(0))
    .attr('y', (d) => y(d.genderChartInfo.label))
    .attr('width', (d) => x(d.value) - x(0))
    .attr('height', y.bandwidth());

  // Append a label for each category.
  svg
    .append('g')
    .attr('fill', 'white')
    .attr('text-anchor', 'end')
    .selectAll()
    .data(data)
    .join('text')
    .attr('x', (d) => x(d.value))
    .attr('y', (d) => y(d.genderChartInfo.label) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('dx', -4)
    .text((d) => format(d.value))
    .call((text) =>
      text
        //if the bar is too small for the label, move the label to the right-hand side of the bar
        .filter((d) => {
          return (
            getTextSize(format(d.value), valueFont).width >
            (x(d.value) - x(0)) * 0.9
          );
        })
        .attr('dx', +4)
        .attr('fill', 'black')
        .attr('text-anchor', 'start'),
    );

  // Create the vertical axis
  svg
    .append('g')
    .attr('text-anchor', 'center')
    //right-align
    .attr('transform', `translate(${width - marginRight},0)`)
    //remove tick marks
    .call(d3.axisRight(y).tickSizeOuter(0).tickSize(0))
    //remove vertical axis line
    .call((g) => g.select('.domain').remove())
    //font
    .attr('style', `font: ${labelFont};`)
    .selectAll('.tick text')
    .call(lineWrap, marginRight, labelFontSizePx);

  return svg.node();
}

/*
Creates a legend for the items in the data array.
The legend items are stacked vertically in a single column.
data is an array of this format:
data = [
 {label:"item 1 label", color: "#ffdd33"},
 {label:"item 2 label", color: "#ddcc33"},
];
*/
function createLegend(data, options = {}) {
  const defaultOptions = {
    width: 150,
    swatchSize: 10,
    swatchPadding: 3,
    font: '11px sans-serif',
  };

  options = { ...defaultOptions, ...options };

  const height = data.length * (options.swatchSize + options.swatchPadding);

  const svg = d3
    .create('svg')
    .attr('width', options.width)
    .attr('height', height)
    .attr('viewBox', [0, 0, options.width, height])
    .attr('style', 'max-width: 100%; height: auto; height: intrinsic;');

  svg
    .append('g')
    .attr('class', 'legend')
    .selectAll('rect')
    .data(data)
    .enter()
    .call((g) =>
      g
        .append('rect')
        .attr('x', 0)
        .attr('y', function (d, i) {
          return i * (options.swatchSize + options.swatchPadding);
        })
        .attr('width', options.swatchSize)
        .attr('height', options.swatchSize)
        .attr('fill', (d) => d.color),
    )
    .call((g) =>
      g
        .append('text')
        .attr('x', options.swatchSize + options.swatchPadding)
        .attr('y', function (d, i) {
          return (
            i * (options.swatchSize + options.swatchPadding) +
            options.swatchSize / 2 +
            1
          );
        })
        .attr('alignment-baseline', 'middle')
        .attr('text-anchor', 'start')
        .style('font', options.font)
        .text((d) => d.label),
    );

  return svg.node();
}

/*
Determine the width and height of a given string rendered in the given font
@param text is the text string to render.  
@font is a CSS font string of this format: "<font-size><unit> <font-family>" e.g. "10px sans-serif"
*/
function getTextSize(text, font = '10px sans-serif') {
  // Temporarily add a new svg element to the document.  Within
  // it create a text element with the given value and font
  const container = d3.select('body').append('svg');
  container.append('text').style('font', font).text(text);

  // Determine the width and height of the rendered text node
  const textNode = container.selectAll('text').node();
  const width = textNode.getComputedTextLength();
  const height = textNode.getExtentOfChar(0).height;

  // Remove the temporary svg element (and its children)
  container.remove();

  return { width: width, height: height };
}

/*
 This function splits up long lines of text into multiple lines.
 The code is from a response to this form post:
   https://gist.github.com/mbostock/7555321
 (with slight modifications)
 */
function lineWrap(text, width, fontSizePx) {
  let lineNumber = 0;
  text.each(function () {
    let text = d3.select(this);

    // clone
    let clone = document.createElement('div');
    clone.setAttribute(
      'style',
      'position:absolute; visibility:hidden; width:0; height:0;',
    );
    document.body.appendChild(clone);

    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    clone.appendChild(svg);

    let elt = text.node().cloneNode(true);
    svg.appendChild(elt);

    let cloneText = d3.select(elt), // cloned text
      words = cloneText.text().split(/\s+/).reverse(),
      word,
      line = [],
      lineHeight = 1,
      y = cloneText.attr('y'),
      x = cloneText.attr('x'),
      dy = parseFloat(cloneText.attr('dy')),
      tspan = text
        .text(null)
        .append('tspan')
        .attr('x', x)
        .attr('y', y)
        .attr('dy', dy + 'em'),
      cloneTspan = cloneText
        .text(null)
        .append('tspan')
        .attr('x', x)
        .attr('y', y)
        .attr('dy', dy + 'em'); // equivalent of tspan from the clone

    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(' '));
      cloneTspan.text(line.join(' ')); // keep them equivalent

      if (cloneTspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(' '));
        cloneTspan.text(line.join(' ')); // keep them equivalent
        line = [word];

        lineNumber++;
        tspan = text
          .append('tspan')
          .attr('x', x)
          .attr('y', y)
          .attr('dy', lineNumber * lineHeight + dy + 'em')
          .text(word);
        cloneTspan = cloneText
          .append('tspan')
          .attr('x', x)
          .attr('y', y)
          .attr('dy', lineNumber * lineHeight + dy + 'em')
          .text(word); // keep them equivalent
      }
    }

    // remove the clone.  it's no longer needed.
    document.body.removeChild(clone);

    // If the text was split into multiple lines, offset the vertical position
    // upward to keep the text vertically centered
    const yShift = (lineNumber / 2) * -fontSizePx;
    text.attr('transform', `translate(0,${yShift})`);
  });
}

module.exports = {
  horizontalBarChart,
};
