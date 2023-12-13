function horizontalBarChart(data, colors) {

    // Specify the chart’s dimensions, based on a bar’s height.
    const barHeight = 37;
    const marginTop = 0;
    const marginRight = 100;
    const marginBottom = 10;
    const marginLeft = 0;
    const width = 400;
    const valueFont = "18px	sans-serif";
    const labelFont = "14px sans-serif";
    const height = Math.ceil((data.length + 0.1) * barHeight) + marginTop + marginBottom;

    // Create the scales.
    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .range([marginLeft, width - marginRight]);

    const y = d3.scaleBand()
	    //order of bars should be as ordered in the 'data' parameter
      .domain(data.map(d => d.label)) 
      //order the bars from largest value to smallest
      //.domain(d3.sort(data, d => -d.value).map(d => d.label))
      .rangeRound([marginTop, height - marginBottom])
      .padding(0.1);

    // Create a value format.
    const format = x.tickFormat(1, "$0.2f");

    // Create the SVG container
    const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", `max-width: 100%; height: auto; font: ${valueFont}; font-weight: bold;`);

	  const color = (i) => colors[i];

    // Append a rect for each category
    svg.append("g")      
      .selectAll()
      .data(data)
      .join("rect")
	  .attr("fill", (d,i) => color(i))
      .attr("x", x(0))
      .attr("y", (d) => y(d.label))
      .attr("width", (d) => x(d.value) - x(0))
      .attr("height", y.bandwidth());

    // Append a label for each category
    svg.append("g")
      .attr("fill", "white")
      .attr("text-anchor", "end")
      .selectAll()
      .data(data)
      .join("text")
      .attr("x", (d) => x(d.value))
      .attr("y", (d) => y(d.label) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("dx", -4)	  
      .text((d) => format(d.value))
      .call((text) => text.filter(d => x(d.value) - x(0) < 20) // short bars	  
        .attr("dx", +4)
        .attr("fill", "black")		
        .attr("text-anchor", "start"));

    // Create the vertical axis
    svg.append("g")
	  //right-align
      .attr("transform", `translate(${width - marginRight},0)`)
	  //remove tick marks
	  .call(d3.axisRight(y).tickSizeOuter(0).tickSize(0))
	  //remove vertical axis line
	  .call(g => g.select(".domain").remove())
	  //font
	  .attr("style", `font: ${labelFont};`)

  return svg.node();
  
}