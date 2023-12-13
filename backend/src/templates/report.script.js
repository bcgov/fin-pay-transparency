function horizontalBarChart(data, colors) {

    // Specify the chart’s dimensions, based on a bar’s height.
    const barHeight = 37;
    const marginTop = 0;
    const marginRight = 110;
    const marginBottom = 10;
    const marginLeft = 0;
    const width = 400;
    const valueFont = "18px	sans-serif";
    const labelFontSizePx = 14;
	  const labelFont = `${labelFontSizePx}px sans-serif`;
    const height = Math.ceil((data.length + 0.1) * barHeight) + marginTop + marginBottom;

    // Create the scales.
    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .range([marginLeft, width - marginRight]);

    const y = d3.scaleBand()
	    //preserve the order of the bars 
      .domain(data.map(d => d.label)) 
      //sort the bars from largest to smallest
      //.domain(d3.sort(data, d => -d.value).map(d => d.label))
      .rangeRound([marginTop, height - marginBottom])
      .padding(0.1);

    // Create a value format.
    const format = x.tickFormat(1, "$0.2f");

    // Create the SVG container.
    const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", `max-width: 100%; height: auto; font: ${valueFont}; font-weight: bold;`);

    const color = (i) => colors[i];

    // This function splits up long lines of text into multiple lines.
    // The code is from a response to this form post: 
    //   https://gist.github.com/mbostock/7555321
    // (with slight modifications)
    const lineWrap = (text, width, fontSizePx) => {
      let lineNumber = 0;
      text.each(function() {
        var text = d3.select(this);
        
        // clone
        let clone = document.createElement('div');
        clone.setAttribute('style', "position:absolute; visibility:hidden; width:0; height:0;");
        document.body.appendChild(clone);
        
        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        clone.appendChild(svg);
        
        let elt = text.node().cloneNode(true);
        svg.appendChild(elt);
        
        
        var cloneText = d3.select(elt), // cloned text
          words = cloneText.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineHeight = 1,
          y = cloneText.attr("y"),
          x = cloneText.attr("x"),
          dy = parseFloat(cloneText.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em"),
          cloneTspan = cloneText.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em"); // equivalent of tspan from the clone

        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          cloneTspan.text(line.join(" ")); // keep them equivalent
          
          if (cloneTspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            cloneTspan.text(line.join(" ")); // keep them equivalent
            line = [word];
            
            lineNumber++;
            tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", lineNumber * lineHeight + dy + "em").text(word)
            cloneTspan = cloneText.append("tspan").attr("x", x).attr("y", y).attr("dy", lineNumber * lineHeight + dy + "em").text(word); // keep them equivalent
          }
        }
              
        // remove the clone.  it's no longer needed.
        document.body.removeChild(clone); 
        
        // If the text was split into multiple lines, offset the vertical position
        // upward to keep the text vertically centered
        const yShift = (lineNumber)/2 * -fontSizePx;
        text.attr("transform", `translate(0,${yShift})`);
      });		
    }

    // Append a rect for each category.
    svg.append("g")      
      .selectAll()
      .data(data)
      .join("rect")
	  .attr("fill", (d,i) => color(i))
      .attr("x", x(0))
      .attr("y", (d) => y(d.label))
      .attr("width", (d) => x(d.value) - x(0))
      .attr("height", y.bandwidth());

    // Append a label for each category.
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
	  .attr("text-anchor", "center")
	  //right-align
      .attr("transform", `translate(${width - marginRight},0)`)
	  //remove tick marks
	  .call(d3.axisRight(y).tickSizeOuter(0).tickSize(0))
	  //remove vertical axis line
	  .call(g => g.select(".domain").remove())
	  //font
	  .attr("style", `font: ${labelFont};`)
	  .selectAll(".tick text")
	    .call(lineWrap, marginRight, labelFontSizePx);

  return svg.node();
  
}