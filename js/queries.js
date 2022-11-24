export function buildQuery_stations(insee) {
    var queryStations = `PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    PREFIX geosparql:  <http://www.opengis.net/ont/geosparql#> 
    SELECT distinct * WHERE {
        ?station rdfs:label ?stationName; dct:spatial [ wdt:P131 [rdfs:label ?label ; wdt:P2585 '`+ insee +`']];  geo:lat ?lat; geo:long ?long; geo:altitude ?alt .
    }
    `
    return queryStations
}

export function QueryObservationsByStation_Date(station, date) {
    var query = `
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX sosa: <http://www.w3.org/ns/sosa/>
    PREFIX wep: <http://ns.inria.fr/meteo/ontology/property/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX weo: <http://ns.inria.fr/meteo/ontology/>
    PREFIX wevp: <http://ns.inria.fr/meteo/vocab/weatherproperty/> 
    
    SELECT ?t  ((?v - 273.15) as ?temp) ?station WHERE 
    {
        VALUES ?station  {"`+ station +`" }  
        VALUES ?date { "`+ date +`"}  
        ?obs a  weo:MeteorologicalObservation; 
        sosa:observedProperty wevp:airTemperature ;
        sosa:hasSimpleResult  ?v; 
        wep:madeByStation ?s ;
        sosa:resultTime ?t . 
        ?s rdfs:label ?station .
        
        FILTER(xsd:date(?t) >= xsd:date(?jourPrecedent))
        BIND ( bif:dateadd('day', -1, xsd:date(?date)) as ?jourPrecedent)
        BIND ( bif:dateadd('day', 1, xsd:date(?date)) as ?jourSuivant)
        FILTER(xsd:date(?t) <= ?jourSuivant)
        
    } 
    ORDER BY ?t
    
    `
    return query
    
    
}

export function QueryObservationsByDate(insee, date) {
    var query = `
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX sosa: <http://www.w3.org/ns/sosa/>
    PREFIX wep: <http://ns.inria.fr/meteo/ontology/property/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX weo: <http://ns.inria.fr/meteo/ontology/>
    PREFIX wevp: <http://ns.inria.fr/meteo/vocab/weatherproperty/> 
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    
    SELECT  distinct ?t  ((?v - 273.15) as ?temp) ?station ?region WHERE 
    {
        VALUES ?insee { '`+ insee +`'}  
        VALUES ?date { "`+ date +`"}  
        ?obs a  weo:MeteorologicalObservation; 
        sosa:observedProperty wevp:airTemperature ;
        sosa:hasSimpleResult  ?v; 
        wep:madeByStation ?s ;
        sosa:resultTime ?t . 
        ?s rdfs:label ?station .
        ?s a weo:WeatherStation ; dct:spatial ?e.                                
        ?e wdt:P131 ?item .
        ?item rdfs:label ?region ;  wdt:P2585  ?insee .
        
        #FILTER(xsd:date(?t) <= xsd:date(?date))
        FILTER(xsd:date(?t) >= xsd:date(?jourPrecedent))
        BIND ( bif:dateadd('day', -1, xsd:date(?date)) as ?jourPrecedent)
        BIND ( bif:dateadd('day', 1, xsd:date(?date)) as ?jourSuivant)
        FILTER(xsd:date(?t) <= ?jourSuivant)
        
    } 
    ORDER BY ?t
    
    `
    return query
    
    
}

export function buildQuery_slices(insee) {
    //console.log('code = ', insee)
    var query = `PREFIX wes: <http://ns.inria.fr/meteo/observationslice/>
    PREFIX weo: <http://ns.inria.fr/meteo/ontology/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX qb:  <http://purl.org/linked-data/cube#>
    PREFIX wes-dimension: <http://ns.inria.fr/meteo/observationslice/dimension#>
    PREFIX wes-measure: <http://ns.inria.fr/meteo/observationslice/measure#>
    PREFIX wes-attribute: <http://ns.inria.fr/meteo/observationslice/attribute#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    
    SELECT ?month (AVG(?temp_avg) as ?avg_temp)  (AVG(?temp_min) as ?min_temp) (AVG(?temp_max) as ?max_temp) ?label WHERE
    {
        VALUES ?insee  {'`+ insee +`' } 
        ?s  a qb:Slice ;
        wes-dimension:station ?station ;
        wes-dimension:year "2021"^^xsd:gYear ;
        qb:observation [
        a qb:Observation ;
        wes-attribute:observationDate ?date ;
        wes-measure:avgDailyTemperature ?temp_avg; 
        wes-measure:minDailyTemperature ?temp_min; 
        wes-measure:maxDailyTemperature ?temp_max] .
        
        ?station a weo:WeatherStation ; dct:spatial ?e.                                
        ?e wdt:P131 ?item .
        ?item rdfs:label ?label ; wdt:P2585  ?insee .
        BIND(MONTH(?date) as ?month)
    }
    GROUP BY ?month ?label
    ORDER BY ?month
    `
    return query
    
}

export function buildQuery_slices1(insee) {
    //console.log('code = ', insee)
    var query = `PREFIX wes: <http://ns.inria.fr/meteo/observationslice/>
    PREFIX weo: <http://ns.inria.fr/meteo/ontology/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX qb:  <http://purl.org/linked-data/cube#>
    PREFIX wes-dimension: <http://ns.inria.fr/meteo/observationslice/dimension#>
    PREFIX wes-measure: <http://ns.inria.fr/meteo/observationslice/measure#>
    PREFIX wes-attribute: <http://ns.inria.fr/meteo/observationslice/attribute#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    
    SELECT distinct ?date ?Nstation ?temp_avg ?label ?insee WHERE
    {
        VALUES ?insee  {'`+ insee +`' } 
        VALUES ?year  {"2021"^^xsd:gYear "2020"^^xsd:gYear "2019"^^xsd:gYear }
        ?s  a qb:Slice ;
        wes-dimension:station ?station ;
        wes-dimension:year ?year ;
        qb:observation [
        a qb:Observation ;
        wes-attribute:observationDate ?date ;
        wes-measure:avgDailyTemperature ?temp_avg] .
        
        ?station a weo:WeatherStation ; dct:spatial ?e; rdfs:label ?Nstation.                            
        ?e wdt:P131 ?item .
        ?item rdfs:label ?label ; wdt:P2585  ?insee .
        #BIND(month(?date) as ?month)
    }
    GROUP BY ?date ?Nstation ?label 
    ORDER BY ?date
    `
    return query
    
}

export function buildquery_closetStation(long,lat)
{
    var query = `
    PREFIX geo:        <http://www.w3.org/2003/01/geo/wgs84_pos#> 
    PREFIX geosparql:  <http://www.opengis.net/ont/geosparql#> 
    PREFIX geof:       <http://www.opengis.net/def/function/geosparql/>  
    PREFIX uom:        <http://www.opengis.net/def/uom/OGC/1.0/> 
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    SELECT ?URI_station ?Name_Station ?lat ?long ?alt ?coordinates ?Region WHERE 
    {
        ?URI_station rdfs:label ?Name_Station ;
        geosparql:hasGeometry [ geosparql:asWKT ?coordinates];
        geo:lat ?lat; geo:long ?long ; geo:altitude ?alt ; dct:spatial ?e. 
        ?e wdt:P131 ?Region .
        
        BIND("Point(`+ long +` `+ lat +`)"^^geosparql:wktLiteral as ?Currentposition)
        BIND (geof:distance(?coordinates,?Currentposition , uom:metre) as ?distance)      
    }
    ORDER BY ?distance
    LIMIT 1`
    return query
}

export function Query_slices_byStation(uri_station) {
    var query = `
    PREFIX wes: <http://ns.inria.fr/meteo/observationslice/>
    PREFIX weo: <http://ns.inria.fr/meteo/ontology/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX qb:  <http://purl.org/linked-data/cube#>
    PREFIX wes-dimension: <http://ns.inria.fr/meteo/observationslice/dimension#>
    PREFIX wes-measure: <http://ns.inria.fr/meteo/observationslice/measure#>
    PREFIX wes-attribute: <http://ns.inria.fr/meteo/observationslice/attribute#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    
    SELECT distinct ?date ?Nstation ?temp_avg ?temp_min ?temp_max ?label WHERE
    {
        VALUES ?station {<`+ uri_station +`>}
        VALUES ?year  {"2021"^^xsd:gYear }
        ?s  a qb:Slice ;
        wes-dimension:station ?station  ;
        
        wes-dimension:year ?year;
        qb:observation [
        a qb:Observation ;
        wes-attribute:observationDate ?date ;
        wes-measure:avgDailyTemperature ?temp_avg; 
        wes-measure:minDailyTemperature ?temp_min; 
        wes-measure:maxDailyTemperature ?temp_max] .
        ?station a weo:WeatherStation ; rdfs:label ?Nstation .
        #BIND(month(?date) as ?month)
    }
    
    ORDER BY ?date
    `
    return query
    
}

export function build_queryByMonth(month, insee)
{
    var query = `PREFIX wes: <http://ns.inria.fr/meteo/observationslice/>
    PREFIX weo: <http://ns.inria.fr/meteo/ontology/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX qb: <http://purl.org/linked-data/cube#>
    PREFIX wes-dimension: <http://ns.inria.fr/meteo/observationslice/dimension#>
    PREFIX wes-measure: <http://ns.inria.fr/meteo/observationslice/measure#>
    PREFIX wes-attribute: <http://ns.inria.fr/meteo/observationslice/attribute#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    
    SELECT ?date (AVG(?temp_avg) as ?avg_temp) (AVG(?temp_min) as ?min_temp) (AVG(?temp_max) as ?max_temp) ?label WHERE
    {
        ?s a qb:Slice ;
        wes-dimension:station ?station ;
        wes-dimension:year "2021"^^xsd:gYear ;
        qb:observation [
        a qb:Observation ;
        wes-attribute:observationDate ?date ;
        wes-measure:avgDailyTemperature ?temp_avg; 
        wes-measure:minDailyTemperature ?temp_min; 
        wes-measure:maxDailyTemperature ?temp_max] .
        
        ?station a weo:WeatherStation ; dct:spatial ?e. 
        ?e wdt:P131 ?item .
        ?item rdfs:label ?label ; wdt:P2585 '`+ insee +`' .
        BIND(MONTH(?date) as ?month)
        FILTER (?month =`+ month +` )
    }
    GROUP BY ?date ?label
    ORDER BY ?date`
    
    return query
    
}

//build a query that retrun the average temperature by day for last 3 years for a given station
export function build_queryByYearOnStation(StationName)
{
    var query = `PREFIX weo: <http://ns.inria.fr/meteo/ontology/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX qb: <http://purl.org/linked-data/cube#>
    PREFIX wes-dimension: <http://ns.inria.fr/meteo/observationslice/dimension#>
    PREFIX wes-measure: <http://ns.inria.fr/meteo/observationslice/measure#>
    PREFIX wes-attribute: <http://ns.inria.fr/meteo/observationslice/attribute#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX dct: <http://purl.org/dc/terms/>
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    
    SELECT distinct ?stationName ?date ?temp_avg WHERE
    {
    VALUES ?stationName {"${StationName}"}
    VALUES ?year {"2021"^^xsd:gYear "2020"^^xsd:gYear "2019"^^xsd:gYear "2018"^^xsd:gYear "2017"^^xsd:gYear }
    ?s a qb:Slice ;
    wes-dimension:station    ?station ;
    
    wes-dimension:year ?year;
    qb:observation [
    a qb:Observation ;
    wes-attribute:observationDate ?date ;
    wes-measure:avgDailyTemperature ?temp_avg;
    wes-measure:minDailyTemperature ?temp_min;
    wes-measure:rainfall24h ?rainfall ] .
    ?station a weo:WeatherStation ; rdfs:label ?stationName.
    #BIND(month(?date) as ?month)
    }
    
    ORDER BY ?date`
    
    return query
    
}


export function build_queryByDayOnStation(StationName, date){
    let query = `
    PREFIX sosa: <http://www.w3.org/ns/sosa/>
    PREFIX wep: <http://ns.inria.fr/meteo/ontology/property/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX weo: <http://ns.inria.fr/meteo/ontology/>
    prefix wevp: <http://ns.inria.fr/meteo/vocab/weatherproperty/> 
        SELECT  ?time (?n as ?stationName) ((?v - 273.15) as ?temperature)
        WHERE 
        {
            VALUES ?date {"${date}"^^xsd:dateTime}
            ?obs a <http://ns.inria.fr/meteo/ontology/MeteorologicalObservation>;
            sosa:observedProperty wevp:airTemperature ;
            sosa:hasSimpleResult  ?v; 
            wep:madeByStation ?station ;
            sosa:resultTime ?time .
            ?station rdfs:label ?n ;  weo:stationID ?stationID .

            FILTER(?time>= xsd:date(?date))
            BIND ( bif:dateadd('day', 1, xsd:date(?date)) as ?jourSuivant)
            FILTER(?time < ?jourSuivant)
            VALUES ?n{"${StationName}"}
        } 
        GROUP BY ?n ?time
        ORDER BY ?n ?time
    `
    return query
}