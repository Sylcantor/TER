export class DonutChart{

    constructor(svg,data,innerRadius,outerRadius){
        this.svg = svg;
        this.data = data;
        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;
    }

    drawChart(){
        var innerRadius = this.innerRadius,
        outerRadius = this.outerRadius;   // the outerRadius goes from the middle of the SVG area to the border

        var svg = this.svg;

        var data = this.data;

        console.log("data");
        console.log(data);
        
        // X scale
        var x = d3.scaleBand()
            .range([0, 2 * Math.PI])    // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
            .align(0)                  // This does nothing ?
            .domain( data.map((d)=>{ return d.id; }) ); // The domain of the X axis is the list of states.

        //get max value of data
        const max = d3.max(data, function(d) { return d.value; });

        // Y scale
        var y = d3.scaleRadial()
            .range([innerRadius, outerRadius])   // Domain will be define later.
            .domain([0, max]); // Domain of Y is from 0 to the max seen in the data
    

        // Add bars
        svg.append("g")
            .selectAll("path")
            .data(data)
            .enter()
            .append("path")
            .attr("fill", "#69b3a2")
            .attr("d", d3.arc()     // imagine your doing a part of a donut plot
                .innerRadius(innerRadius)
                .outerRadius((d) => { return y(d.value); })
                .startAngle((d)=> { return x(d.id); })
                .endAngle((d)=> { return x(d.id) + x.bandwidth(); })
                .padAngle(0.01)
                .padRadius(innerRadius))
                
        // Add the labels
        /*
        svg.append("g")
        .selectAll("g")
        .data(data2)
        .enter()
        .append("g")
            .attr("text-anchor", function(d) { return (x(d.id) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
            .attr("transform", function(d) { return "rotate(" + ((x(d.id) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")"+"translate(" + (y(d['Value'])+10) + ",0)"; })
        .append("text")
            .text(function(d){return(d.id)})
            .attr("transform", function(d) { return (x(d.id) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)"; })
            .style("font-size", "11px")
            .attr("alignment-baseline", "middle")
        */
    }
}