
google.charts.load('current', {'packages':['table']});

export class TableChart{
    constructor(data,id){
        this.data = data;
        this.id = id;
    }
    drawTable(){
        var data = google.visualization.arrayToDataTable(this.data);
        var table = new google.visualization.Table(document.getElementById(this.id));
        table.draw(data, {showRowNumber: false, width: '100%', height: '100%'});
    }
}
