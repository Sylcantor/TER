import SPARQL from "../sparql.js";

import {QueryObservationsByDate,build_queryTmpByDayOnStation,build_queryPrecipByDayOnStation} from "../queries.js";
import {DonutChart} from "./donutchart.js";
import {TableChart} from "./table.js";

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
        this.allData = data;
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

        
        console.log("sumstat", sumstat);
        
        lineGroup.append("path")
            .attr("fill", "none") //.attr("fill", d => color(d.key))
            .style('fill-opacity', 0.1)
            .style("stroke", function(d, i) { // définit la couleur de la ligne en fonction de l'index de l'élément
                if (i >= sumstat.length - 5) { // si l'élément est parmi les 5 derniers
                  return "red"; // définit la couleur en rouge
                } else if(i >= sumstat.length - 10){ // définit la couleur en bleu
                    return "blue";
                } else if(i >= sumstat.length - 15){ // définit la couleur en bleu
                    return "yellow";
                } else {
                  return color(d.key); // sinon, définit la couleur en noir
                }
              })
            .attr("stroke-width", 1.5)
            .attr("d", (d) => {
                return d3.line()
                    .curve(d3.curveCardinal)
                    .x( (d) => { 
                        return scales[this.id].x(new Date(d.date).setFullYear(0)) })
                    .y( (d) => { return scales[this.id].y(parseFloat(d.temp_avg)); })
                    (d.values)
            })
            .style("opacity", d => {
                if (d.key[0] != '0') return 1;
                else return 0;
            })
            .on("mouseout", () => d3.select(".chart-tooltip").style("display", "none"))
            .on('mouseover', (d)=> {

                //check opacity of the line
                var opacity = d3.select(d3.event.currentTarget).style("opacity");
                if(opacity == 1){
                    if (this.id == 'brush-chart') return;
                    let stationnames;
                    // console.log("data----here", d.key);
                    var mouse = d3.mouse(d3.event.currentTarget);
                    var station = d.values[0].station;  
                    // console.log("d : ",d)
                    // console.log(d3.event)
                    // console.log('mouse = ', mouse)
        
                    var tooltip = d3.select(".chart-tooltip")
        
                    tooltip.style('display', 'block')
                        .style('left', d3.event.pageX + 10 + 'px')
                        .style('top', d3.event.pageY + 10 + 'px')
                    
                    
                    var xDate = scales[this.id].x.invert(mouse[0])
                    xDate = d.key + xDate.toISOString().slice(4)

                    //check if xDate[0] is 0 and set it to 2
                    
                    
                    var yTemp = scales[this.id].y.invert(mouse[1]).toFixed(3)
                    console.log(scales[this.id].y.invert(mouse[1]))
                    // console.log("Temp----here", yTemp);
                    // console.log("Date----here", xDate);

                    if(xDate[0] == '0'){
                        let region = this.data[0].region;
                        xDate = "2" + xDate.slice(1);
                        tooltip.html("<b> Region: </b>" + region + "</br>" + "<b>  Date:</b> " + xDate.split('T')[0] + "</br>" + "<b> Daily Avg. Temp.:</b> " + yTemp
                        + "</br>");
                    }
                    else{
                        tooltip.html("<b> Station: </b>" + station + "</br>" + "<b>  Date:</b> " + xDate.split('T')[0] + "</br>" + "<b> Daily Avg. Temp.:</b> " + yTemp
                        + "</br>");
                    }
                    

                    let margin = {top: 0, right: 0, bottom: 0, left: 0},
                                width = 400 - margin.left - margin.right+100,
                                height = 400 - margin.top - margin.bottom,
                                innerRadius = 10,
                                outerRadius = Math.min(width, height) / 8;  

                    let innerRadius2 = outerRadius,
                    outerRadius2 = innerRadius2+outerRadius
                
                    //delete the svg if it already exists
                    d3.select("#donut-chart-div").selectAll("svg").remove();
                    // append the svg object to the body of the page
                    
                    //var svgDonut = d3.select(`svg#${this.id}`);
                    //svgDonut.selectAll('g').remove()
                    //svgDonut.selectAll("text").remove()
                    //svgChart.selectAll("rect").remove()

                    var svg = d3.selectAll("#donut-chart-div")
                    .append("svg")
                        .attr("width", width)
                        .attr("height", height)

                        
                    .append("g")
                        .attr("transform", "translate(" + width / 4 + "," + ( height/4+100 )+ ")") // Add 100 on Y translation, cause upper bars are longer
                    
                    //
                    
                    var res1;
                    var res2;

                    endpoint.query(build_queryTmpByDayOnStation(station, xDate.split('T')[0])).done((json) => {
                        res1 = json.results.bindings.map(d => {
                            return {
                                id: d.time.value,
                                value: d.temperature.value
                            }
                        });

                        let donutChart1 = new DonutChart(svg,res1,innerRadius,outerRadius,"red",30);
                        donutChart1.drawChart();
 
                    });

                    endpoint.query(build_queryPrecipByDayOnStation(station, xDate.split('T')[0])).done((json) => {
                        res2 = json.results.bindings.map(d => {
                            return {
                                id: d.time.value,
                                value: d.precipitation.value
                            }
                        });
                        
                        console.log(res1)

                        let donutChart2 = new DonutChart(svg,res2,innerRadius2,outerRadius2,"blue",8);
                        donutChart2.drawChart();
                        donutChart2.drawLegend();
                        
                        //serialize data for google chart table with labels

                        let data = [[{label: 'Time', type: 'string'}, {label: 'Temperature', type: 'number'}, {label: 'Precipitation', type: 'number'}]]
                        for (let i = 0; i < res1.length; i++) {
                            data.push([res1[i].id, parseFloat(res1[i].value), parseFloat(res2[i].value)])
                        }
                        //draw TableChart

                        let table = new TableChart(data, 'table_div');
                        table.drawTable();

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
                }
            })

        

      


        // new array of sumstat.keys
        //let yearsRange = sumstat.map(d => d.key);
        //console.log("yearsRange", yearsRange);
        //LineChart.drawLegend(yearsRange, this.data[0].region, "chart-legend-hour1",undefined,this.data[0].station);
    }
    drawLegend(id,yearsRange){


        
        var sumstat = d3.nest()
            .key(d => d.date.slice(0,4))
            .entries(this.data);
        
        //let yearsRange = sumstat.map(d => d.key);

        console.log("yearsRange", yearsRange);

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
            .style("stroke", (d, i) => { // définit la couleur de la ligne en fonction de l'index de l'élément
                // get 2 two first digit of string d
                if(yearsRange[1][0] == "0"){
                    if(d.slice(0,2) == "00"){
                        return "yellow"
                    } else if (d.slice(0,2) == "01"){
                        return "blue"
                    }
                    else if (d.slice(0,2) == "02") {
                        return "red"
                    }
                    else{
                        return color(d);
                    }
                } else {
                    return color(d);
                }
              })
            .style("stroke-width", 3)
            .attr("x1", 0)
            .attr("y1", (d, i) => 10 + i * 15)
            .attr("x2", 30)
            .attr("y2", (d, i) => 10 + i * 15);
    
        legendGroup.append('text')
            .attr('x', 40)
            .attr('y', (d, i) => 10 + i * 17)
            .attr("type", "checkbox")
            .style('font-size', '11px')
            .text(d => {
                if(yearsRange[1][0] == "0"){
                    if(d.slice(0,2) == "00"){
                        return "Température moy region 20" + d.slice(2)
                    } else if (d.slice(0,2) == "01"){
                        return "Température moy minimale region 20" + d.slice(2)
                    }
                    else if (d.slice(0,2) == "02") {
                        return "Température moy maximale 20" + d.slice(2)
                    }
                    else{
                        return d;
                    }
                } else {
                    return d;
                }
            })
        
        //legendGroup append checkbox   
        legendGroup.append('input')
            .attr('type', 'checkbox')
            .attr('id', d => d)
            .attr('name', d => d)
            .attr('value', d => d)
            .attr('checked', true)
    
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
            let targetChartSVG = d3.select(`svg#line-chart-hour1`)
            console.log(targetChartSVG.node())

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
        let targetChartSVG = d3.select(`svg#line-chart-hour1`)

        console.log("targetChartSVG", targetChartSVG.node())

        let width = svgChart.node().parentNode.clientWidth,
            height = svgChart.node().parentNode.clientHeight;
        console.log("ParentNode",svgChart.node().parentNode)
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

       
        var clipPath = targetChartSVG
            .selectAll('g.lineGroup')
            .append("defs")
            .append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", targetChartSVG.node().clientWidth)
            .attr("height", targetChartSVG.node().clientHeight);
        
    }
    update(yearsSelected){

        //update legend line and text if year is selected
        d3.select('svg#line-chart-hour1')
        .selectAll('g.legendGroup')
        .selectAll('line')
        .style("opacity", (d) => {
            if (yearsSelected.includes(d)) {
                return 1
            }
            else {
                return 0
            }
        })

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
            .style("opacity", (d) => {
                if (yearsSelected.includes(d.key)) {
                    console.log("d.key", d.key)
                    return 1
                }
                else {
                    return 0
                }
            })
        
        // retire tous les elements commencant par '0' dans le tableau

        console.log("yearsSelected", yearsSelected)
        this.drawLegend("chart-legend-hour1", yearsSelected)
        
    }
}