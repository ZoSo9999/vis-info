var primaVolta=true;
var svg = null;
var force = null;
var node;
var link;
var nodi = [];
var links =[];
var select = d3.selectAll("select");



function leggiJSON() {
  fetch('hrafnkel_saga_network.json') 
          .then(response => response.json())
          .then(data => {
            // Assegna le sotto-tabelle a variabili separate
            window.nodes = data.nodes;
            window.links = data.links;
            window.action_codes = data.action_codes;
            window.gender_codes = data.gender_codes;

            document.getElementById("drawButton").disabled = false;
            document.getElementById("updateButton").disabled = false;
            document.getElementById("check-span").classList.remove('hidden');

            const chapterSelect = document.getElementById("chapter-select");
            const checkbox = document.getElementById("myCheckbox");

            checkbox.addEventListener('change', function() {
                if (checkbox.checked) {
                chapterSelect.classList.remove('hidden');
				
                } else {
                chapterSelect.classList.add('hidden');
                }
            });
          })
          .catch(error => {
            console.log('Si è verificato un errore:', error);
          });   
    }

// Funzione per trovare la componente connessa al nodo selezionato
function findConnectedComponent(nodes, links, selectedNodeId) {
  var component = new Set();
  var visited = new Set();

  // Utilizza una ricerca in ampiezza (BFS) per trovare tutti i nodi connessi
  var queue = [selectedNodeId];
  while (queue.length > 0) {
    var nodeId = queue.shift();
    component.add(nodeId);
    visited.add(nodeId);

    links.forEach(function(link) {
      if (link.source.id === nodeId && !visited.has(link.target.id)) {
        queue.push(link.target.id);
        visited.add(link.target.id);
      } else if (link.target.id === nodeId && !visited.has(link.source.id)) {
        queue.push(link.source.id);
        visited.add(link.source.id);
      }
    });
  }

  return component;
}

// Funzione per verificare se un nodo appartiene a una componente specifica
function isNodeInComponent(node, component) {
  return component.has(node.id);
}

function showLink(){
  d3.selectAll(".link")
  .on("mouseover", function(d) {
    var actionCodesObject = window.action_codes[d.action];
    var actionDescription = actionCodesObject['action description'];
    d3.select("#link-info")
    .text(d.source.label + " " + actionDescription + " " +d.target.label)
    .style("visibility", "visible");
    console.log(actionDescription);
  })
  .on("mouseout", function() {
  d3.select("#link-info").style("visibility", "hidden");
  });
}


function showNode(){
  d3.selectAll(".node")                                                   //GESTIONE NODI
  .on("mouseover", function(d) {            //ON MOUSEOVER
    // Creazione del popup
    var popup = d3.select("body")
      .append("div")
      .attr("class", "popup")
      .style("left", (d.x-80) + "px")
      .style("top", (d.y-20) + "px");

    // Aggiungi le informazioni del nodo al popup
    popup.append("h2")
      .text(d.label + "[" +d.id+"]");
    if (d.chapter !== undefined) {
      popup.append("p")
        .text("Chapter: " + d.chapter);
    }
    var genderCodesObject = window.gender_codes[d.gender];
    var genderDescription = genderCodesObject['gender description'];
    if (d.gender !== undefined) {
      popup.append("p")
        .text("Gender: " + genderDescription);
    }})
  .on("mouseout", function(d) {             //ON MOUSEOUT
    // Rimuovi il popup
    d3.select(".popup").remove();
  });

}



function draw(){
  var width = 900;
  var height = 600;

  var color = d3.scale.category10();

  var charge = document.getElementById("charge").value;
  var linkDistance = document.getElementById("linkDistance").value;
  var gravity = document.getElementById("gravity").value;
  var linkStrength = document.getElementById("linkStrength").value;
  var friction = document.getElementById("friction").value;
  var theta = document.getElementById("theta").value;
  var alpha = document.getElementById("alpha").value;
  var chargeDistance = document.getElementById("chargeDistance").value;
  var chapterSelect = document.getElementById("chapter-select");

  
  force = d3.layout.force()
      .charge(charge)
      .linkDistance(linkDistance)
      .gravity(gravity)
      .friction(friction)
      .linkStrength(linkStrength)
      .size([width, height])
      .alpha(alpha)
      .theta(theta)
      .chargeDistance(chargeDistance);
  
  if (!primaVolta) {
	  node.remove();
    link.remove();
  }


 
  svg = d3.select("svg").attr("width", width)
                .attr("height", height)
                .attr("id", "svg")
                .attr("style", "border-style: solid");

  nodi = window.nodes;
  links = window.links;
  	
if(primaVolta===true){
  links.forEach(function(link) {      //SHIFTING DOVUTO DAL FATTO CHE LA FUNZIONE LINKS PARTE IL CONTEGGIO DA 0 E NON DA 1
    link.source = link.source - 1;
    link.target = link.target - 1;
  });
}

  primaVolta=false;

  force.nodes(nodi)
    .links(links)
    .start();

 

  if(document.getElementById("myCheckbox").checked){                      //GENERAZIONE GRAFO SPECIFICO
     
    var nodiCapitolo=[];
    
    for(var i=0;i<nodi.length;i++){
      appartenenza = nodi[i].chapter <= parseInt(chapterSelect.value); //|| nodi[i].chapter === undefined;
      if (appartenenza) nodiCapitolo.push(nodi[i].id);
    }


    link = svg.selectAll(".link")
        .data(links)
        .enter().append("line")
        .filter(function(d) {
                    result = (
                        nodiCapitolo.includes(d.source.id) &&
                        nodiCapitolo.includes(d.target.id)
                    );
                    return result;
        })
        .attr("class", "link")
        .style("stroke-width", function(d) { return 3; })
        .style("stroke","#828282");

    node = svg.selectAll(".node")
        .data(nodi)
        .enter().append("circle")
        .filter(function(d) {
        return nodiCapitolo.includes(d.id);
        })
        .attr("class", "node")
        .attr("r", function(d) {
        // Imposta raggio a 10 per i nodi che soddisfano la condizione
        if (d.chapter === parseInt(chapterSelect.value)) {
            return 8;
        } else {
            return 5; // Raggio predefinito per gli altri nodi
        }
        })
        .style("fill", function(d) { return color(d.gender); })
        .call(force.drag);
      


    }else{                                                          //GENERAZIONE GRAFO GENERALE
     link = svg.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke-width", function(d) { return 3; })
        .style("stroke","#828282");
     
     node = svg.selectAll(".node")
        .data(nodi)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", 5)
        .style("fill", function(d) { return color(d.gender); })
        .call(force.drag);
  }
 
	showNode();
  d3.selectAll(".node")                                        //GESTIONE NODI
  .on("click", function(clickedNode) {              //ON CLICK
    d3.select(".popup").remove();
    

    var selectedNodeId = clickedNode.id; // id del nodo selezionato
    var selectedComponent = findConnectedComponent(node, link, selectedNodeId); // trova la componente connessa al nodo selezionato

    // Filtra i link mantenendo solo quelli appartenenti alla componente connessa
    var filteredLinks = links.filter(function(d) {
      return d.source.id === selectedNodeId || d.target.id === selectedNodeId ||
             (isNodeInComponent(d.source, selectedComponent) || isNodeInComponent(d.target, selectedComponent));
    });

	link.remove();
    node.remove();
	
    link = svg.selectAll(".link")
      .data(filteredLinks)
      .enter().append("line")
      .attr("class", "link")
      .style("stroke-width", function(d) { return 3; })
      .style("stroke","#828282");

    // Filtra i nodi mantenendo solo quelli appartenenti alla componente connessa
    var filteredNodes = nodes.filter(function(d) {
      return isNodeInComponent(d, selectedComponent);
    });

    node = svg.selectAll(".node")
      .data(filteredNodes)
      .enter().append("circle")
      .attr("class", "node")
      .attr("r", 5)
      .style("fill", function(d) { return color(d.gender); })
      .call(force.drag);
	
	showLink();
	showNode();
  });

	showLink();

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; }); 
  });   

}
 
function resume(){

  var width = 900;
  var height = 600;

  var charge = document.getElementById("charge").value;
  var linkDistance = document.getElementById("linkDistance").value;
  var gravity = document.getElementById("gravity").value;
  var linkStrength = document.getElementById("linkStrength").value;
  var friction = document.getElementById("friction").value;
  var theta = document.getElementById("theta").value;
  var alpha = document.getElementById("alpha").value;
  var chargeDistance = document.getElementById("chargeDistance").value;
  
  force.charge(charge)
    .linkDistance(linkDistance)
    .gravity(gravity)
    .friction(friction)
    .linkStrength(linkStrength)
    .size([width, height])
    .alpha(alpha)
    .theta(theta)
    .chargeDistance(chargeDistance);

  
  force.start();

}