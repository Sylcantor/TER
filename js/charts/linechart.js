import SPARQL from "../sparql.js";

import {QueryObservationsByDate,build_queryByDayOnStation} from "../queries.js";
import {DonutChart} from "./donutchart.js";

let margin = { left: 40, right: 20, bottom: 20, top: 0 }
let color = d3.scaleOrdinal()

let scales = {
    "brush-chart": {
        x: d3.scaleTime(),
        y: d3.scaleLinear()
    }, "line-chart-hour1": {
        x: d3.scaleTime(),
        y: d3.scaleLinear()
    }
}

var endpoint = new SPARQL({
    apikey: "YOUR-API-KEY-HERE",
    endpoint: "https://weakg.i3s.unice.fr/sparql"
    //endpoint: "http://localhost:8890/sparql"
});

export class LineChart{

    
    constructor(data,id,region_code){
        this.data = data;
        this.id = id;
        this.region_code = region_code;
        this.x = d3.scaleTime();
        this.y = d3.scaleLinear();
    }
    
    drawChart(){

        
        
        console.log("Test")
        console.log(this.id);
        color.domain(this.data[0].station).range(colorbrewer.Set2[6]);
        
        //map date year of newdate into a new array

        var svgChart = d3.select(`svg#${this.id}`);
        svgChart.selectAll('g').remove()
        svgChart.selectAll("text").remove()
    
        let width = svgChart.node().parentNode.clientWidth,
            height = svgChart.node().parentNode.clientHeight;
    
        if (this.id != "brush-chart") height -= 80;
    
        //console.log(width, height)
    
        
    
        svgChart.attr('width', width)
            .attr('height', height)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    
        var region = this.region_code;
    
        var sumstat = d3.nest()
            .key(d => d.date.slice(0,4))
            .entries(this.data);
    
        //console.log("sumstat", sumstat);
    
        //console.log("this.data = ",this.data)


        scales[this.id].x.domain([new Date("0000-01-01"),new Date("0000-12-31")]).range([0, `${width - margin.left}`])
    
        //this.data, d => new Date(d.date))
        var xAxis = svgChart.append("g")
            .attr('id', this.id) /// je lui donne un id pour séléctionner ce groupe lors de la transition
            .attr("transform", `translate(${margin.left}, ${height - margin.bottom})`)
            .call(d3.axisBottom(scales[this.id].x));
    
        // Add Y axis
    
        
        scales[this.id].y.domain(d3.extent(this.data, function (d) { return parseFloat(d.temp_avg) }))
            .range([height - margin.bottom, 0]);
    
        let yAxis = d3.axisLeft().scale(scales[this.id].y)
    
        if (this.id == "brush-chart") yAxis.ticks(0)
    
        var year = new Date(this.data[0].date).getYear();
    
    
        svgChart.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .call(yAxis)
    
        if (this.id != "brush-chart") {
    
            svgChart.append("text")
                .attr("transform", `translate(10,${height / 2})rotate(-90)`)
                .style("font-size", "12px")
                .text("Air Temperature in °C");
        }
    
        let lineGroup = svgChart.selectAll('g.lineGroup')
            .data(sumstat)
            .enter()
            .append('g')
            .attr('class', 'lineGroup')
            .attr('transform', `translate(${margin.left}, 0)`)

        console.log(scales[this.id])

        
        lineGroup.append("path")
            .attr("fill", "none") //.attr("fill", d => color(d.key))
            .style('fill-opacity', 0.1)
            .attr("stroke", d => color(d.key))
            .attr("stroke-width", 1.5)
            .attr("d", (d) => {
                return d3.line()
                    .curve(d3.curveCardinal)
                    .x( (d) => { 
                        return scales[this.id].x(new Date(d.date).setFullYear(0)) })
                    .y( (d) => { return scales[this.id].y(parseFloat(d.temp_avg)); })
                    (d.values)
            })
            .on("mouseout", () => d3.select(".chart-tooltip").style("display", "none"))
            .on('mouseover', function (d) {
                if (this.parentNode.parentNode.id == 'brush-chart') return;
                let stationnames;
                // console.log("data----here", d.key);
                var mouse = d3.mouse(this);
                var station = d.values[0].station;
                // console.log("d : ",d)
                // console.log(d3.event)
                // console.log('mouse = ', mouse)
    
                var tooltip = d3.select(".chart-tooltip")
    
                tooltip.style('display', 'block')
                    .style('left', d3.event.pageX + 10 + 'px')
                    .style('top', d3.event.pageY + 10 + 'px')
                
                
                var xDate = scales["brush-chart"].x.invert(mouse[0])
                xDate = d.key + xDate.toISOString().slice(4)
                var yTemp = scales["brush-chart"].y.invert(mouse[1]).toFixed(3)
                console.log(scales["brush-chart"].y.invert(mouse[1]))
                // console.log("Temp----here", yTemp);
                // console.log("Date----here", xDate);
                tooltip.html("<b> Station: </b>" + station + "</br>" + "<b>  Date:</b> " + xDate.split('T')[0] + "</br>" + "<b> Daily Avg. Temp.:</b> " + yTemp
                + "</br>"
                + "<div id='donut-chart-div' style='width:400px; height:400px;'></div>"
                );

                var data2 = [{id:"debut_matin_3h", value:3000}, {id:"matin_6h", value:1}, {id:"fin_matin_9h", value:3}, {id:"midi_12h", value:5000}, {id:"après_midi_15h", value:2000}, {id:"debut_soiree_18h", value:600}, {id:"fin_soiree_21h", value:200}, {id:"minuit_0h", value:5500}]
                var margin = {top: 10, right: 10, bottom: 10, left: 10},
                            width = 400 - margin.left - margin.right,
                            height = 400 - margin.top - margin.bottom,
                            innerRadius = 80,
                            outerRadius = Math.min(width, height) / 4;  

                var innerRadius2 = outerRadius,
                outerRadius2 = innerRadius2+outerRadius-innerRadius
            
                //delete the svg if it already exists
                d3.select("#donut-chart-div").selectAll("svg").remove();
                // append the svg object to the body of the page


                var svg = d3.select("#donut-chart-div")
                .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)

                    
                .append("g")
                    .attr("transform", "translate(" + width / 3.5 + "," + ( height/3.5+100 )+ ")") // Add 100 on Y translation, cause upper bars are longer
                
                //
                
                endpoint.query(build_queryByDayOnStation(station, xDate.split('T')[0])).done((json) => {
                    let res = json.results.bindings.map(d => {
                        return {
                            id: d.time.value,
                            value: d.temperature.value
                        }
                    });

                    
                    let donutChart1 = new DonutChart(svg,res,innerRadius,outerRadius);
                    let donutChart2 = new DonutChart(svg,res,innerRadius2,outerRadius2);
                    donutChart1.drawChart();
                    donutChart2.drawChart();
                    
                });


                
    
                
                const doesChartExist = () => {
                    return new Promise((fulfill, reject) => {
                        // comparer donnée survol et donnée ligne
                        if (d3.select("#line-chart-hour2").selectAll('path.line').size() > 0) {
                            let oldData = d3.select("#line-chart-hour2").select('path.line').datum()
                            let oldStation = d3.select("svg#chart-legend-hour2").select('text').node().innerHTML;
    
                            //console.log('old station = ', oldStation)
                            //console.log('old data = ', oldData)
                            //console.log('new data =', station, xDate.toISOString().split('T')[0] , oldData[0].date.split('T')[0])
    
                            if (oldStation != station)
                                fulfill(false)
    
                            if (xDate.split('T')[0] != oldData[0].date.split('T')[0])
                                fulfill(false)
    
                            fulfill(true)
                        } else fulfill(false)
                    })
                }
    
                doesChartExist().then((value) => {
                    console.log("resultat de la promise = ", value)
                    if (value) return;
                    var date = xDate.split('T')[0]
                
                    endpoint.query(QueryObservationsByDate(this.region_code, xDate.split('T')[0])).done((json) => {
                        // legend exists
                        if (d3.select('svg#chart-legend-hour2').selectAll('g').empty()) {
                            stationnames = json.results.bindings.map(d => d.station.value)
                            //LineChart.drawLegend(stationnames, this.data[0].region, "chart-legend-hour2", date)
                        } else {
                            // change title
                        }
                        stationnames = json.results.bindings.map(d => d.station.value)
                        stationnames = stationnames.filter((d, i) => stationnames.indexOf(d) === i)
                        //LineChart.drawLegend(stationnames, this.data[0].region, "chart-legend-hour2", date)
                        //onSuccessMember3HourlyTemp(json)
                    });
                })
    
            })
        
        // new array of sumstat.keys
        //let yearsRange = sumstat.map(d => d.key);
        //console.log("yearsRange", yearsRange);
        //LineChart.drawLegend(yearsRange, this.data[0].region, "chart-legend-hour1",undefined,this.data[0].station);
    }
    drawLegend(id){
        
        var sumstat = d3.nest()
            .key(d => d.date.slice(0,4))
            .entries(this.data);
        let yearsRange = sumstat.map(d => d.key);

        let region = this.data[0].region;
        let stationName = this.data[0].station;
        console.log("yearsRange : ", yearsRange);
        //console.log("stationName", stationName);
        d3.select("svg#" + id).selectAll('text').remove()
        
        // add SVG legend             
        var svglegend = d3.select("svg#" + id);
    
        svglegend.selectAll('g').remove()
    
        let legendGroup = svglegend.selectAll('g')
            .data(yearsRange)
            .enter()
            .append('g')
        
        legendGroup.append('line')
            .style("stroke", d => color(d))
            .style("stroke-width", 3)
            .attr("x1", 0)
            .attr("y1", (d, i) => 10 + i * 15)
            .attr("x2", 30)
            .attr("y2", (d, i) => 10 + i * 15);
    
        legendGroup.append('text')
            .attr('x', 40)
            .attr('y', (d, i) => 10 + i * 17)
            .style('font-size', '11px')
            .text(d => d)
    
        if (id === "chart-legend-hour2") {
            legendGroup.append("text")
                .attr("x", 350)
                .attr("y", 20)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .html("Air Temperatures Per Year (Region: " + region + ")" + "  " + date + "(J-1, J+1)");
        }
        else {
            legendGroup.append("text")
                .attr("x", 350)
                .attr("y", 20)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .text(`${stationName} Air Temperatures (Region: ${region})}`);
            }
    }

    drawBrush(id){
        
        var idleTimeout
        const idled = () => { idleTimeout = null; }

        const updateChart= () => {

            let extent = d3.event.selection
            // If no selection, back to initial coordinate. Otherwise, update X axis domain
            if (!extent) {
                if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
            }
            else {
                scales["line-chart-hour1"].x.domain([scales["brush-chart"].x.invert(extent[0]), scales["brush-chart"].x.invert(extent[1])])
                // This remove the grey brush area as soon as the selection has been done
            }

            // Update axis and circle position
            d3.select('g#line-chart-hour1').transition().duration(2000).call(d3.axisBottom(scales["line-chart-hour1"].x))

            

            d3.select('svg#line-chart-hour1')
                .selectAll('g.lineGroup')
                .selectAll("path")
                .transition().duration(2000)
                .attr("clip-path", "url(#clip)")
                .attr("d", (d) => {
                    return d3.line()
                        .curve(d3.curveCardinal)
                        .x((d) => { return scales["line-chart-hour1"].x(new Date(d.date).setFullYear(0)) })
                        .y((d) => { return scales["line-chart-hour1"].y(parseFloat(d.temp_avg)); })
                        (d.values)
                })
        }

        console.log("Brush Draw")
        var svgChart = d3.select(`svg#${id}`)

        let width = svgChart.node().parentNode.clientWidth,
            height = svgChart.node().parentNode.clientHeight;

        console.log(width, height)

        var brush = d3.brushX()                 // Add th e brush feature using the d3.brush function
            .extent([[0, 0], [width - margin.left, height - margin.bottom]]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
            .on("brush", updateChart) // Each time the brush selection changes, trigger the 'updateChart'
        //.on("brush", brushed)

        const lastDate = scales["brush-chart"].x.domain()[1] // get the last date of the axis

        const firstDate = new Date(lastDate.getTime());
        firstDate.setMonth(firstDate.getMonth() - 6); // subtract 3 months from the last date of the axis

        const defaultSelection = [scales["brush-chart"].x(firstDate), scales["brush-chart"].x.range()[1]]; // give the positions of the first and last date which you want to include in the brush
        console.log("defaultSelection:", defaultSelection)
        let lineGroup = svgChart
            .select('g.lineGroup')

        lineGroup.attr("class", "brush")
            .call(brush)
            .call(brush.move, defaultSelection);

        let targetChartSVG = d3.select(`svg#line-chart-hour1`)
        var clipPath = targetChartSVG
            .selectAll('g.lineGroup')
            .append("defs")
            .append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", targetChartSVG.node().clientWidth)
            .attr("height", targetChartSVG.node().clientHeight);
        
    }
}