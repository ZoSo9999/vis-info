
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

function drawNodes(svg,data,selectedNodeId){
  const spanY = 100
  const linksGroup = svg.append("g")
      .attr("id", "linksGroup");
  const groups = svg.selectAll("g")
    .filter(function(d) {return this.getAttribute("id") !== "linksGroup";})
    .data(data)
    .enter()
    .append("g")
    .attr("transform", (d, i) => `translate(40, ${i * spanY})`)
    .attr("y",(d, i) => i * spanY);
  const nodes = groups.selectAll("circle")
      .data(d => d)
      .enter().append("circle")
      .attr("class", "node")
      .attr("r", function(d) {
        if (d.id === selectedNodeId) {
            return 8;
        } else {
            return 5; 
        }
      })
      .attr("id",function(d) {return d.id;})
      .style("fill", function(d) { return color(d.gender); })
      .attr("cx", (d, i) => i * 50 + 50)
      .attr("cy", spanY/2);
  data.flat().forEach((d) => {
    let y = parseInt(document.getElementById(d.id).getAttribute('cy'))
            + parseInt(document.getElementById(d.id).parentNode.getAttribute('y'));
    let x = parseInt(document.getElementById(d.id).getAttribute('cx'))
    d.tx = x;
    d.ty = y;
  });
}

function readAction(nAction){
  var actionCodesObject = window.action_codes[nAction];
  var actionDescription = actionCodesObject['action description'];
  return actionDescription;
}


function drawEdges(svg,filteredLinks){

  filteredLinks.forEach(function(l){
      var x1=parseInt(document.getElementById(l.source.id).getAttribute('cx'))+40;
      var y1=parseInt(document.getElementById(l.source.id).getAttribute('cy'))
                +parseInt(document.getElementById(l.source.id).parentNode.getAttribute('y'));
      var x2=parseInt(document.getElementById(l.target.id).getAttribute('cx'))+40;
      var y2=parseInt(document.getElementById(l.target.id).getAttribute('cy'))
                +parseInt(document.getElementById(l.target.id).parentNode.getAttribute('y'));

      svg.select("#linksGroup")
        .append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('etichetta', l.source.label+" "+readAction(l.action)+" "+l.target.label)
        .style("stroke-width", function(d) { return 5; })
        .style("stroke","#828282");
  })
  d3.selectAll("line").attr("order", -1);
}

function createTree(filteredNodes,filteredLinks,selectedNodeId) {
  
  allNodes = [];
  spanY = 100;
  levelLinks = [];
  svg = d3.select("#treeSVG").attr("width", 300)
          .attr("height", 600)
          .attr("class",null);
  descents = filteredLinks.filter(function(l) {
      return parseInt(l.action)==1;
    });
  pairs = filteredLinks.filter(function(l) {
    return parseInt(l.action)==2;
  });

  while (filteredNodes.length != 0){
    let levelNodes = [];
    for (let i = 0; i < filteredNodes.length; i++){
      let flag = true;
      for(let j=0;j<descents.length;j++){
        if (descents[j].source == filteredNodes[i]) {
          flag = false;
          break;
        }  
      }

      if (flag == true) {
          levelNodes.push(filteredNodes[i]);
          filteredNodes.splice(i, 1);
          i--;
      }
    }
    for(let i=0;i<levelNodes.length;i++){
      var risultato = true;
      for(let j=0;j<pairs.length;j++){
        if(pairs[j].source == levelNodes[i]){
            risultato=levelNodes.includes(pairs[j].target);
            break;
        }else if(pairs[j].target == levelNodes[i]){
            risultato=levelNodes.includes(pairs[j].source);
            break;
        }
      }
      if(risultato==false){
        filteredNodes.push(levelNodes[i]);
        levelNodes.splice(i, 1);
        i--;
      }
    }
    allNodes.push(levelNodes);
    levelLinks = [];
    for (let i = 0; i < descents.length; i++){
      for(let j=0;j<levelNodes.length;j++){
        if (descents[i].target == levelNodes[j]) {
          levelLinks.push(descents[i]);
          descents.splice(i, 1);
          i--;
          break;
        }
      }
    }
  }

  drawNodes(svg,allNodes,selectedNodeId);
  drawEdges(svg,filteredLinks);
  showNodeforTree();
  showLinkForTree();
  
}

function showLink(){
  d3.selectAll(".link")
  .on("mouseover", function(d) {
    var actionCodesObject = window.action_codes[d.action];
    var actionDescription = actionCodesObject['action description'];
    d3.select("#link-info")
    .text(d.source.label + " " + actionDescription + " " +d.target.label)
    .style("visibility", "visible")
    .style("font-size", "25px"); 
  })
  .on("mouseout", function() {
  d3.select("#link-info").style("visibility", "hidden");
  });
}

function showLinkForTree(){
  var lines=d3.selectAll("svg#treeSVG line")
  var linesOfInterest = lines[0];
  console.log(linesOfInterest);
  d3.selectAll(linesOfInterest)
  .on("mouseover", function(d) {
    var etichetta=d3.select(this).attr('etichetta');
    d3.select("#link-info")
    .text(etichetta)
    .style("visibility", "visible")
    .style("font-size", "25px"); 
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


function showNodeforTree(){
  d3.selectAll(".node")
  .on("mouseover", function(d) {
    var popup = d3.select("body")
      .append("div")
      .attr("class", "popup")
      .style("left", d3.event.pageX + "px")
      .style("top", d3.event.pageY + "px");

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
  .on("mouseout", function(d) {
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


 
  svg = d3.select("#graphSVG")
          .attr("width", width)
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
        .style("stroke-width", function(d) { return 4; })
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
    d3.select("#treeSVG").selectAll("*").remove();
    

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
      .style("stroke-width", function(d) { return 5; })
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
      createTree(filteredNodes,filteredLinks,selectedNodeId);
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
