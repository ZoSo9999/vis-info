
var primaVolta=true;
var svg = null;
var force = null;
var node;
var link;
var nodi = [];
var links =[];
var width = 900;
var height = 600;
var color = d3.scale.category10();
//var select = d3.selectAll("select");

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
            document.getElementById("loadFileFromClient").disabled = true;
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
function findConnectedComponent(selectedNodeId) {
  var component = new Set();
  var visited = new Set();

  // Utilizza una ricerca in ampiezza (BFS) per trovare tutti i nodi connessi
  var queue = [selectedNodeId];
  while (queue.length > 0) {
    var nodeId = queue.shift();
    component.add(nodeId);
    visited.add(nodeId);
    window.links.forEach(function(link) {
      if (parseInt(link.action) <= 2) {
        if (link.source.id === nodeId && !visited.has(link.target.id)) {
          queue.push(link.target.id);
          visited.add(link.target.id);
        } else if (link.target.id === nodeId && !visited.has(link.source.id)) {
          queue.push(link.source.id);
          visited.add(link.source.id);
        }
      }
    });
  }

  return component;
}

// Funzione per verificare se un nodo appartiene a una componente specifica
function isNodeInComponent(node, component) {
  return component.has(node.id);
}

function drawNode(svg,n,x,y){
  console.log(y)
  node = svg.selectAll(".node")
      .data(n)
      .enter().append("circle")
      .attr("class", "node")
      .attr("r", 5)
      .style("fill", function(d) { return color(d.gender); })
      .attr("cx", (d, i) => (i+1) * (x/10))
      .attr("cy",(d, i) => y*(i/5));
      
}

function drawEdges(svg,descents){
  link = svg.selectAll(".link")
  .data(descents)
  .enter().append("line")
  .attr("class", "link")
  .style("stroke-width", function(d) { return 3; })
  .style("stroke","#828282");
}

function findRootNode(nodes, links) {
  var nodeIdsWithParents = new Set();
  
  // Trova i nodi che hanno un nodo genitore
  links.forEach(function(link) {
    nodeIdsWithParents.add(link.target.id);
  });
  
  // Trova il nodo che non ha un nodo genitore
  var rootNode = nodes.find(function(node) {
    return !nodeIdsWithParents.has(node.id);
  });
  return rootNode;
}

function createTree(filteredNodes,filteredLinks) {

      var width = 700;
      var height = 700;
      var margin = { top: 20, right: 20, bottom: 20, left: 20 }; // Margine intorno all'albero

      var tree = d3.layout.tree()
      .size([height - margin.top - margin.bottom, width - margin.left - margin.right]);

      var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });

      var svg = d3.select("#treeSVG").attr("width", width)
          .attr("height", height)
          .attr("class",null);

      var root =  findRootNode(filteredNodes, filteredLinks); 
      //console.log(Object.values(root));
    // Creazione della gerarchia dei nodi
      var nodeById = d3.map();
      filteredNodes.forEach(function(nodo) {
        nodo.children = []; // Inizializza 'children' come array vuoto
        nodo.same = [];
        nodeById.set(nodo.id, nodo);
      });
      filteredLinks.forEach(function(coll) {
      var parent = nodeById.get(coll.source.id);
      var person = nodeById.get(coll.target.id);

      if (coll.action === 1) {
        parent.children.push(person);
      } else {
        parent.same.push(person);
      }
    });



      var nodesG = tree.nodes(root);
      var linksG = tree.links(nodesG);
      //console.log(nodesG);
      //console.log(linksG);

      var nodiNuovi=[];
      svg.selectAll(".node")
        .data(nodesG)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", 10)
        .attr("fill", function(d){ return color(d.gender);})
        .attr("cx", function(d) { return d.y; })
        .attr("cy", function(d) { nodiNuovi.push([d.id,d.x,d.y]);return d.x; });    //fare questo in un ciclo a parte 
                                                                                    //per risolvere problema cosa si vede meglio


        svg.selectAll("path")
          .data(tree.links(nodesG))
          .enter().append("path")
          .attr("d", function(d) {

            var sorgente = nodiNuovi.filter(function(el) {
              //console.log(el[0]+ " "+ d.source.id);
              return el[0] === d.source.id;
            });
            var destinatario = nodiNuovi.filter(function(el) {
              return el[0] === d.target.id;
            });
        
            //console.log("Sorgente: "+sorgente[1]+" "+sorgente[2]+" | Destinatario: "+destinatario[1]+" " +destinatario[2]);
            var source = { x: (sorgente[0])[1], y: (sorgente[0])[2] };
            var target = { x: (destinatario[0])[1], y: (destinatario[0])[2] };
            return "M" + source.y + "," + source.x + "L" + target.y + "," + target.x;
          })
          .style("stroke", "gray")
          .style("stroke-width", 2);
    svg.selectAll(".node").raise();
    
      
}

function showLink(){
  d3.selectAll(".link")
  .on("mouseover", function(d) {
    var actionCodesObject = window.action_codes[d.action];
    var actionDescription = actionCodesObject['action description'];
    d3.select("#link-info")
    .text(d.source.label + " " + actionDescription + " " +d.target.label)
    .style("visibility", "visible");
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


 
  svg = d3.select("#graphSVG").attr("width", width)
                .attr("height", height);

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
  showLink();


  d3.selectAll(".node")                                        //GESTIONE NODI
  .on("click", function(clickedNode) {              //ON CLICK
    d3.select(".popup").remove();
    

    var selectedNodeId = clickedNode.id; // id del nodo selezionato
    var selectedComponent = findConnectedComponent(selectedNodeId); // trova la componente connessa al nodo selezionato

    // Filtra i link mantenendo solo quelli appartenenti alla componente connessa
    var filteredLinks = links.filter(function(d) {
      return isNodeInComponent(d.source, selectedComponent)
        && isNodeInComponent(d.target, selectedComponent)
        && parseInt(d.action)<=2;
    });

    // var sameLevelLinks = filteredLinks.filter(function(d) {
    //   return parseInt(d.action) != 1;
    // });
    // var siblings = [];
    // sameLevelLinks.forEach(function(d) {
    //   couple = {"source":d.source.id,
    //             "target":d.target.id};
    //   siblings.push(couple);
    // });

	  link.remove();
    node.remove();
	
    link = svg.selectAll(".link")
      .data(filteredLinks)
      .enter().append("line")
      .attr("class", "link")
      .style("stroke-width", function(d) { return 3; })
      .style("stroke","#828282");

    // Filtra i nodi mantenendo solo quelli appartenenti alla componente connessa
    var filteredNodes = nodi.filter(function(d) {
      return isNodeInComponent(d, selectedComponent);
    });

    node = svg.selectAll(".node")
      .data(filteredNodes)
      .enter().append("circle")
      .attr("class", "node")
      .attr("r", function(d) {
        if (d.id === selectedNodeId) {
            return 8;
        } else {
            return 5; 
        }
      })
      .style("fill", function(d) { return color(d.gender); })
      .call(force.drag);
	
	    showLink();
	    showNode();
      createTree(filteredNodes,filteredLinks);
  });

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

window.addEventListener("beforeunload", function(event) {
  document.getElementById("drawButton").disabled = true;
  document.getElementById("updateButton").disabled = true;
  document.getElementById("myCheckbox").checked = false;
  document.getElementById("check-span").classList.add('hidden');
  document.getElementById("treeSVG").classList.add('hidden');
  //event.returnValue = "Stai per lasciare la pagina. Sei sicuro di volerla ricaricare?";
});
