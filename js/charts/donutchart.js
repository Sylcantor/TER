export class DonutChart{

    constructor(svg,data,innerRadius,outerRadius,color,domain){
        this.svg = svg;
        this.data = data;
        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;
        this.color = color
        this.domain = domain
    }

    drawChart(){

        var svg = this.svg;
        

        var data = this.data;

        console.log("data");
        console.log(data);
        console.log(this.outerRadius)
        console.log(this.innerRadius)
        // X scale
        var x = d3.scaleBand()
            .range([0, 2 * Math.PI])    // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
            .align(0)                  // This does nothing ?
            .domain( data.map((d)=>{ return d.id; }) ); // The domain of the X axis is the list of states.

        let test = d3.extent(data, function(d) { return +d.value; })
        test[1] = test[1] + 0.1
        // Y scale
        console.log("Extent" ,d3.extent(data, function(d) { return +d.value; }))
        var y = d3.scaleRadial()
            .range([this.innerRadius, this.outerRadius])   // Domain will be define later.
            .domain(test); //take min and max of the region instead // Domain of Y is from 0 to the max seen in the data
    

        // Add bars
        svg.append("g")
            .selectAll("path")
            .data(data)
            .enter()
            .append("path")
            .attr("fill", this.color)
            .attr("d", d3.arc()     // imagine your doing a part of a donut plot
                .innerRadius(this.innerRadius)
                .outerRadius((d) => { return y(+d.value); })
                .startAngle((d)=> { return x(d.id); })
                .endAngle((d)=> { return x(d.id) + x.bandwidth(); })
                .padAngle(0.01)
                .padRadius(this.innerRadius))       

    }

    // draw the legend like a clock with the hour with 3 hours interval
    drawLegend(){
            
        var svg = this.svg;

        var data = this.data;

        var x = d3.scaleBand()
            .range([0, 2 * Math.PI])    // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
            .align(0)                  // This does nothing ?
            .domain( data.map((d)=>{ return d.id; }) ); // The domain of the X axis is the list of states.

        svg.append("g")
            .selectAll("g")
            .data(data)
            .enter()
            .append("g")
            .attr("text-anchor", (d) => { return (x(d.id) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
            .attr("transform", (d) => { return "translate(" + this.outerRadius * 1.1 * Math.cos((x(d.id)) - Math.PI / 2) + "," + this.outerRadius * 1.1 * Math.sin((x(d.id)) - Math.PI / 2) + ")"; })
            .append("text")
            .text((d) => { return d.id.slice(11,13); })
            .attr("alignment-baseline", "middle")

    }
}