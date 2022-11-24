import SPARQL from "../sparql.js";

import {QueryObservationsByDate} from "../queries.js";

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

        if(this.id == "brush-chart"){
            lineGroup.append("path")
                .attr("fill", "none") //.attr("fill", d => color(d.key))
                .style('fill-opacity', 0.1)
                .attr("stroke", d => color(d.key))
                .attr("stroke-width", 1.5)
                .attr("d", function (d,line) {
                    return d3.line()
                        .curve(d3.curveCardinal)
                        .x(function (d) { 
                            return scales["brush-chart"].x(new Date(d.date).setFullYear(0)) })
                        .y(function (d) { return scales["brush-chart"].y(parseFloat(d.temp_avg)); })
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
                    // console.log("Temp----here", yTemp);
                    // console.log("Date----here", xDate);
                    tooltip.html("<b> Station: </b>" + station + "</br>" + "<b>  Date:</b> " + xDate.split('T')[0] + "</br>" + "<b> Daily Avg. Temp.:</b> " + yTemp);
        
        
                    function doesChartExist() {
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
                        // console.log("resultat de la promise = ", value)
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
        }
        else{
            lineGroup.append("path")
                .attr("fill", "none") //.attr("fill", d => color(d.key))
                .style('fill-opacity', 0.1)
                .attr("stroke", d => color(d.key))
                .attr("stroke-width", 1.5)
                .attr("d", function (d,line) {
                    return d3.line()
                        .curve(d3.curveCardinal)
                        .x(function (d) { 
                            return scales["line-chart-hour1"].x(new Date(d.date).setFullYear(0)) })
                        .y(function (d) { return scales["line-chart-hour1"].y(parseFloat(d.temp_avg)); })
                        (d.values)
                })
                .on("mouseout", () => d3.select(".chart-tooltip").style("display", "none"))
                .on('mouseover', function (d) {
                    let stationnames;
                    if (this.parentNode.parentNode.id == 'brush-chart') return;
        
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
                    
                    
                    var xDate = scales["line-chart-hour1"].x.invert(mouse[0])
                    xDate = d.key + xDate.toISOString().slice(4)
                    var yTemp = scales["line-chart-hour1"].y.invert(mouse[1]).toFixed(3)
                    // console.log("Temp----here", yTemp);
                    // console.log("Date----here", xDate);
                    tooltip.html("<b> Station: </b>" + station + "</br>" + "<b>  Date:</b> " + xDate.split('T')[0] + "</br>" + "<b> Daily Avg. Temp.:</b> " + yTemp);
        
        
                    function doesChartExist() {
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
                        // console.log("resultat de la promise = ", value)
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
        }
        
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
}