import SPARQL from "./sparql.js";
import {LineChart} from "./charts/linechart.js";
import { LineChartRegion } from "./charts/linechartregion.js";
import {DonutChart} from "./charts/donutchart.js";
import {CheckBoxList} from "./checkboxlist.js";
import "./leaflet.js";
import {regions} from "./regions.js";
import {buildQuery_stations, build_queryByYearOnStation,buildQuery_slices1,buildQuery_slices} from "./queries.js";



function initMap(){

    var boolean = false;
    let checkboxes;

    var regionData;
    

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

            console.log(regions.features[d].properties.code)
            endpoint.query(buildQuery_stations(regions.features[d].properties.code)).done(onSuccessMember1);


            current_region_code = regions.features[d].properties.code;
            current_region_name = regions.features[d].properties.nom;

            

            /*
            //display air Temperatures Times Series on the map
            endpoint.query(buildQuery_slices1(regions.features[d].properties.code))
                .done(function (json) {
                    //console.log("new data = ", regions.features[d].properties.code, json)
                    // onSuccessMember4(json, 'month', regions.features[d].properties.code)
                    
                    function getData(json) {
                        let newdata = []
                        let data = json.results.bindings
                        
                        for (let i = 0; i < data.length; i++) {
                            newdata.push({
                                date: data[i]['date'].value,
                                station: data[i]['Nstation'].value,
                                temp_avg: data[i]['temp_avg'].value,
                                region: data[i]['label'].value
                            })
                            
                        }
            
                        return newdata
                    }

                    let data = getData(json)
                    let regionChart = new LineChartRegion(data,"line-chart-hour1",current_region_code)
                    regionChart.drawChart()
                });
            */
        })

    d3_features.attr("d", path)
        .style("fill-opacity", 0.2);

    map.on("viewreset", reset);
    reset();

    function onSuccessMember1(json){

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


                    console.log("stationSelected = ", stationSelected);

                    console.log(current_region_code)


                    

                    endpoint.query(build_queryByYearOnStation(stationSelected))
                    .done((json) => {
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

                        endpoint.query(buildQuery_slices(current_region_code))
                        .done((json) => {
                            console.log(newdata);
                            
                            let res = json.results.bindings.map((item) => {
                                let tmpDate = '0' + item.date.value.slice(1);
                                return {
                                    date: tmpDate,
                                    station: stationSelected,
                                    temp_avg: item.avg_temp.value,
                                    region: current_region_name
                                }
                            })

                            res = res.concat(
                                json.results.bindings.map((item) => {
                                    let tmpDate = '01' + item.date.value.slice(2);
                                    return {
                                        date: tmpDate,
                                        station: stationSelected,
                                        temp_avg: item.min_temp.value,
                                        region: current_region_name
                                    }
                                })
                            )

                            res = res.concat(
                                json.results.bindings.map((item) => {
                                    let tmpDate = '02' + item.date.value.slice(2);
                                    return {
                                        date: tmpDate,
                                        station: stationSelected,
                                        temp_avg: item.max_temp.value,
                                        region: current_region_name
                                    }
                                })
                            )

                            //concatenate the two arrays
                            newdata = newdata.concat(res);
                            console.log("newdata = ");
                            console.log(newdata);

                            

                            let tmpChartByYears = new LineChart(newdata,"brush-chart",current_region_code);
                            tmpChartByYears.drawChart();
                            tmpChartByYears.drawLegend("chart-legend-hour1",[2017,2018,2019,2020,2021]);
                            tmpChartByYears.drawBrush("brush-chart");
                            
                            let tmpChartByYearsZoom = new LineChart(newdata,"line-chart-hour1",current_region_code)
                            tmpChartByYearsZoom.drawChart();
    
                            //remove checkboxes
                            if(boolean==false){
                                checkboxes = new CheckBoxList(["2017","2018","2019","2020","2021"],tmpChartByYearsZoom);
                                checkboxes.setupCheckBoxList();
                                boolean = true;
                            }
                            if(boolean==true){
                                checkboxes.checkedAllCheckBoxes();
                            }
                        });

                       
                        //A revoir:

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