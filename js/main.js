
import {initCollapsibleSections} from "./collapsible.js";
import {initMap} from "./map.js";
import "./d3.v5.min.js";

window.onload = init;

let bonjour = null;

function init() {
    // ici on a accès au DOM !!!! Tous les éléments HTML sont définis
    console.log("Page chargée, j'ai accès à tous les éléments de la page");
    initCollapsibleSections();
    initMap();
}
    