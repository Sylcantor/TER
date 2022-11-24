export default class SPARQL {
    
    constructor(o) {
        this.options = o;
    }
    query(q) {
        return $.ajax({
            url: this.options.endpoint,
            accepts: { json: "application/sparql-results+json" },
            data: { query: q, apikey: this.options.apikey },
            dataType: "json",
        });
        
    }
}