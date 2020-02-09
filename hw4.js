'use strict';

(function() {

  let data = "no data";
  let svgContainer = ""; // keep SVG reference in global scope
  let tooltip = "";
  let mapFunctions = "";

  // load data and make scatter plot after window loads
  window.onload = function() {
    d3.select('body')
      .style('margin', '30px');

    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 1000)
      .attr('height', 750)
      .style('font', '10pt sans-serif');

    // create tooltip
    makeTooltip();

    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("gapminder.csv")
      .then((data) => makeScatterPlot(data.filter(function(d) {
          return d['year'] == '1980'
      })));
  }

  // make scatter plot with trend line
  function makeScatterPlot(csvData) {
    data = csvData // assign data as global variable

    // get arrays of fertility rate data and life Expectancy data
    let fertility_data = data.map((row) => parseInt(row["fertility"]));
    let life_data = data.map((row) => parseInt(row["life_expectancy"]));

    // find data limits
    let axesLimits = findMinMax(fertility_data, life_data);

    // draw axes and return scaling + mapping functions
    mapFunctions = drawAxes(axesLimits, "fertility", "life_expectancy");

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels();
  }

    // make tooltip
    function makeTooltip() {
      tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('position', 'absolute')
      .style('width', '150px')
      .style('height', '150px')
      .style('font', '5px sans-serif')
      .style('text-align', 'center')
      .style('padding', '2px')
      .style('border', '2px solid black')
      .style('border-radius', '8px')
      .style('background', '#F4F4F4')
      .style('pointer-events', 'none');

      let tipSVG = tooltip.append('svg');
    } 

  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 400)
      .attr('y', 20)
      .style('font-size', '16pt')
      .text("Fertility vs. Life Expectancy (1980)")
      .attr('fill', 'grey');

    svgContainer.append('text')
      .attr('x', 500 )
      .attr('y', 740)
      .text('Fertility');

    svgContainer.append('text')
      .attr('transform', 'translate(15, 400)rotate(-90)')
      .text('Life Expectancy');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    // mapping functions
    let xMap = map.x;
    let yMap = map.y;


    // append data to SVG and plot as points
    let pop_data = data.map((row) => parseInt(row['population']));
    let max = d3.max(pop_data);
    // console.log('max = ' + max);
    // console.log('min = ' + d3.min(pop_data));

    svgContainer.selectAll('.circle')
      .data(data)
      .enter()
      .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', (d) => { return Math.log(d['population'] * 100000 / max) })
        .attr('stroke', '#B6598A')
        .attr('fill', 'white')
        // add tooltip functionality to points
        .on("mouseover", (d) => {
          tooltip.transition()
            .duration(200)
            .style("opacity", .9)
          tooltip.html('')
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
          tipGraph();
        })
        .on("mouseout", (d) => {
          tooltip.transition()
            .delay(250)
            .duration(500)
            .style("opacity", 0);
        });

        // add data point labels
        svgContainer.selectAll('.text')
        .data(data.filter((d) => {
            return +d['population'] >= 100000000
        }))
        .enter()
        .append('text')
        .attr("x", xMap)
                 .attr("y", yMap)
                 .text(function (d) { return d['country'] })
                 .attr("font-family", "sans-serif")
                 .attr("font-size", "5pt")
                 .attr("fill", "gray");
  }

  // create graph in tooltip
  function tipGraph() {
      console.log('tip graph');
      // tipGraph.append('line')
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin, limits.xMax + 2]) // give domain buffer room
      .range([50, 950]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
      .attr('transform', 'translate(0, 700)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([50, 700]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

})();
