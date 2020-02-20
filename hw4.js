'use strict';

(function() {

  let data = "no data";
  let svgContainer = ""; // keep SVG reference in global scope
  let tooltip = "";
  let mapFunctions = "";
  let tipSVG = "";
  let tipMapFunctions = "";
  let tipData = "no data";
  let allData = "no data";
  let title = "";

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
      .then((data) => makeScatterPlot(data));
  }

  // make scatter plot with trend line
  function makeScatterPlot(csvData) {
    allData = csvData // assign data as global variable
    data = csvData.filter(function(d) {
      return d['year'] == '1980'
    });

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
      .style('width', '280px')
      .style('height', '300px')
      .style('border', '2px solid grey')
      .style('border-radius', '8px')
      .style('background', 'white')
      .style('pointer-events', 'none');

      tipSVG = tooltip.append('svg')
        .attr('width', 280)
        .attr('height', 300)
        .style('font', '3pt sans-serif');
      
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

  // make title and axes labels
  function makeTipLabels(country) {
    tipSVG.append('text')
      .attr('x', 50)
      .attr('y', 20)
      .style('font-size', '10pt')
      .text("Population Over Time")
      .attr('fill', 'grey');

    tipSVG.append('text')
      .attr('x', 50)
      .attr('y', 35)
      .style('font-size', '10pt')
      .text("(" + country + ")")
      .attr('fill', 'grey');

    tipSVG.append('text')
      .attr('x', 130 )
      .attr('y', 290)
      .style('font-size', '8pt')
      .text('Year');

    tipSVG.append('text')
      .attr('transform', 'translate(10, 200)rotate(-90)')
      .style('font-size', '8pt')
      .text('Population (millions)');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    // mapping functions
    let xMap = map.x;
    let yMap = map.y;
    let xMap20 = map.x20;


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
        .attr('stroke', '#DE4374')
        .attr('fill', '#FFECF2')
        // add tooltip functionality to points
        .on("mouseover", (d) => {
          tooltip.transition()
            .duration(200)
            .style("opacity", .9)
          tooltip
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
            tipGraph(d['country']);
        })
        .on("mouseout", (d) => {
          tooltip.transition()
            // .delay(250)
            .duration(500)
            .style("opacity", 0);
        });

        // add data point labels
        svgContainer.selectAll('.text')
        .data(data.filter((d) => {
            return +d['population'] > 100000000
        }))
        .enter()
        .append('text')
        .attr("x", xMap20)
                 .attr("y", yMap)
                 .text(function (d) { return d['country'] })
                 .attr("font-family", "sans-serif")
                 .attr("font-size", "10pt")
                 .attr("fill", "gray");
  }

  // create graph in tooltip
  function tipGraph(country) {

    // clear prior graph from tooltip
    tipSVG.selectAll('g').remove();
    tipSVG.selectAll('text').remove();
    tipSVG.selectAll('path').remove();

    // get arrays of fertility rate data and life Expectancy data
    tipData = allData.filter(function(d) {
      return d['country'] == country
    })
    let year_data = tipData.map((row) => parseInt(row["year"]));
    let pop_data = tipData.map((row) => parseInt(row["population"]));

    // find data limits
    let axesLimits = findMinMax(year_data, pop_data);

    // draw axes and return scaling + mapping functions
    tipMapFunctions = drawTipAxes(axesLimits, "year", "population");

    // plot data as points and add tooltip functionality
    plotGraph(tipMapFunctions);

    // draw title and axes labels
    makeTipLabels(country);
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
    let xMap20 = function(d) { return +xScale(xValue(d)) + 20 }

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
      yScale: yScale,
      x20: xMap20
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

  // draw the axes and ticks FOR TOOLTIP
  function drawTipAxes(limits, x, y) {

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin, limits.xMax])
      .range([50, 250])

    // plot x-axis at bottom of SVG
    tipSVG.append("g")
      .attr('transform', 'translate(0, 250)')
      .call(d3.axisBottom(xScale)
      .ticks(7)
      .tickFormat(d3.format("d")));


    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([+limits.yMax/1000000, +limits.yMin/1000000]) // give domain buffer
      .range([50, 250])

    // plot y-axis at the left of SVG
    tipSVG.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(d3.axisLeft(yScale));

    // return scaling functions
    return {
      xScale: xScale,
      yScale: yScale
    };
  }

  function plotGraph(map) {
    let xScale = map.xScale;
    let yScale = map.yScale;

    // d3's line generator
    const line = d3.line()
    .x(d => parseInt(xScale(d['year']))) // set the x values for the line generator
    .y(d => parseInt(yScale(+d['population']/1000000))) // set the y values for the line generator 

    // append line to svg
    tipSVG.append("path")
      // difference between data and datum:
      // https://stackoverflow.com/questions/13728402/what-is-the-difference-d3-datum-vs-data
      .datum(tipData)
      .attr("d", function(d) { return line(d) })
      .attr("fill", "none")
      .attr("stroke", "#DE4374")
  }

})();
