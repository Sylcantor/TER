import SPARQL from "./sparql.js";
import {LineChart} from "./charts/linechart.js";
import {DonutChart} from "./charts/donutchart.js";
import "./leaflet.js";
import {regions} from "./regions.js";
import {buildQuery_stations, build_queryByYearOnStation} from "./queries.js";

function initMap(){


    var endpoint = new SPARQL({
        apikey: "YOUR-API-KEY-HERE",
        endpoint: "https://weakg.i3s.unice.fr/sparql"
        //endpoint: "http://localhost:8890/sparql"
    });

    var map = L.map('map').setView([47, 2], 5); 
    const mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
    L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; ' + mapLink + ' Contributors',
        maxZoom: 18,
    }).addTo(map);

    // Add an SVG element to Leaflet’s overlay pane

    var svg = d3.select(map.getPanes().overlayPane).append("svg");
    var g = svg.append("g").attr("class", "leaflet-zoom-hide");

    var path;
    var transform = d3.geoTransform({ point: projectPoint }),
        path = d3.geoPath().projection(transform);

    var boolean = true;
    var current_region_code;
    var current_region_name;
    // create path elements for each of the features
    const d3_features = g.selectAll("path")
        .data(regions.features)
        .enter()
        .append("path")
        .attr("d", path)
        .classed('map-border', true)
        .style("fill-opacity", 0.2)
        
        .on("click", function (event, d) {
            //console.log('clicked!')

            //display stations for some region on the map
            endpoint.query(buildQuery_stations(regions.features[d].properties.code)).done(onSuccessMember1);

            current_region_code = regions.features[d].properties.code;
            current_region_name = regions.features[d].properties.nom;
            /*
            //display air Temperatures Times Series on the map
            endpoint.query(buildQuery_slices1(regions.features[d].properties.code))
                .done(function (json) {
                    //console.log("new data = ", regions.features[d].properties.code, json)
                    // onSuccessMember4(json, 'month', regions.features[d].properties.code)
                    drawCharts(json, regions.features[d].properties.code)
                });
            */  
        })

    d3_features.attr("d", path)
        .style("fill-opacity", 0.2);

    map.on("viewreset", reset);
    reset();

    function onSuccessMember1(json) {

        $(".leaflet-marker-icon").remove();
        $(".leaflet-popup").remove();

        var icon = new L.Icon.Default();
        icon.options.shadowSize = [0, 0];

        for (var b in json.results.bindings) {
            var station = json.results.bindings[b][json.head.vars[0]];
            var stationName = json.results.bindings[b][json.head.vars[1]];
            var lat = json.results.bindings[b][json.head.vars[3]];
            var long = json.results.bindings[b][json.head.vars[4]];

            L.marker([lat['value'], long['value']], { icon: icon })
                .addTo(map)
                .bindPopup(stationName['value'])
                .openPopup()
                .on('click', function(event, d){
                    //console.log(this._popup._content);
                    
                    /*
                    endpoint.query(buildQuery_slices1(current_region))
                    .done(function (json) {
                        //console.log("new data = ", regions.features[d].properties.code, json)
                        // onSuccessMember4(json, 'month', regions.features[d].properties.code)
                        console.log(json);
                        drawCharts(json, current_region);
                    });
                    */
                    let stationSelected = this._popup._content;
                    endpoint.query(build_queryByYearOnStation(stationSelected))
                    .done(function (json) {
                        //console.log("new data = ", regions.features[d].properties.code, json)
                        // onSuccessMember4(json, 'month', regions.features[d].properties.code)
                        //console.log("Le json de la querry :");
                        //console.log(json);
                        
                        let newdata = json.results.bindings.map(d => {
                            return {
                                date: d.date.value,
                                station: d.stationName.value,
                                temp_avg: d.temp_avg.value,
                                region : current_region_name
                            }
                        });
                        console.log(newdata);
                        let tmpChartByYears = new LineChart(newdata,"brush-chart",current_region_code);
                        tmpChartByYears.drawChart();
                        tmpChartByYears.drawLegend("chart-legend-hour1");
                        
                        let tmpChartByYearsZoom = new LineChart(newdata,"line-chart-hour1",current_region_code)
                        tmpChartByYearsZoom.drawChart();

                        //A revoir:

                        var data = [{id:"debut_matin_3h", value:2000}, {id:"matin_6h", value:5500}, {id:"fin_matin_9h", value:300}, {id:"midi_12h", value:500}, {id:"après_midi_15h", value:20}, {id:"debut_soiree_18h", value:6000}, {id:"fin_soiree_21h", value:2000}, {id:"minuit_0h", value:5500}]
                        var data2 = [{id:"debut_matin_3h", value:3000}, {id:"matin_6h", value:1}, {id:"fin_matin_9h", value:3}, {id:"midi_12h", value:5000}, {id:"après_midi_15h", value:2000}, {id:"debut_soiree_18h", value:600}, {id:"fin_soiree_21h", value:200}, {id:"minuit_0h", value:5500}]
                        
                        var margin = {top: 10, right: 10, bottom: 10, left: 10},
                            width = 600 - margin.left - margin.right,
                            height = 600 - margin.top - margin.bottom,
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
                            .attr("transform", "translate(" + width / 2 + "," + ( height/2+100 )+ ")") // Add 100 on Y translation, cause upper bars are longer
                        
                        //
                        
                        let donutChart1 = new DonutChart(svg,data,innerRadius,outerRadius);
                        let donutChart2 = new DonutChart(svg,data2,innerRadius2,outerRadius2);
                        donutChart1.drawChart();
                        donutChart2.drawChart();

                        /*
                        LineChart.data = newdata;
                        LineChart.drawStationLineChart(newdata,"brush-chart",current_region_code);
                        
                        
                        drawBrush("brush-chart")
                        
                        if(boolean){
                            CheckBoxList.setUpCheckBox(["2017","2018","2019","2020","2021"]);
                            boolean = false;
                        }
                        else{
                        }
                        */
                        //drawCharts(json, current_region);
                    });
                });
            
        }
    }

    // fit the SVG element to leaflet's map layer
    function reset() {
        const bounds = path.bounds(regions);

        var topLeft = bounds[0],
            bottomRight = bounds[1];

        svg.attr("width", bottomRight[0] - topLeft[0])
            .attr("height", bottomRight[1] - topLeft[1])
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px");

        g.attr("transform", "translate(" + -topLeft[0] + ","
            + -topLeft[1] + ")");

        // initialize the path data	
        d3_features.attr("d", path)
            .style("fill-opacity", 0.2);
        //.attr('fill','blue');
    }

    // Use Leaflet to implement a D3 geometric transformation.
    function projectPoint(x, y) {
        var point = map.latLngToLayerPoint(new L.LatLng(y, x));
        this.stream.point(point.x, point.y);
    }
}

export { initMap };