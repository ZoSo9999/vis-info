var updateTime = 2000;

var svg = d3.select("body").append("svg")
    .attr("id","my-svg")
    .attr("viewBox", "0 0 150 70")
    .style("border", "2px solid black")
    .attr("time", "1");

function createDomain(data) {
    var values = data.map(function(d) {
        return [d.x0, d.x1, d.x2, d.y0, d.y1, d.y2];
    });
    return [0,d3.max(values.flat())];
}

function addEvent(scaleX,scaleY) {
    const svgElement = document.getElementById('my-svg');
    svgElement.addEventListener('click', (event) => {
        if (event.target === svgElement) {
            moveMosquito(scaleX,scaleY);
        }
    });
}

function drawMosquito(data,scaleX,scaleY) {
    svg.selectAll("image")
    .data(data)
    .enter()
    .append("svg:image")
    .attr("xlink:href", "zanzara.png")
    .attr("x", function(d) { return scaleX(d.x0); })
    .attr("y", function(d) { return scaleY(d.y0); })
    .attr("width", "4")
    .attr("height", "4")
    .attr("dead", "false")
}

function killMosquito(){
    var images = document.querySelectorAll("image");
    for (let i=0; i<images.length; i++) {
        images[i].addEventListener("click", function(e){
            e.target.setAttribute("dead","true");
            e.target.setAttribute("href","dead-zanzara.png");
        });
    }
}

function moveMosquito(scaleX, scaleY) {
    var mosquitos = d3.selectAll("image[dead='false']")
                    .transition()
                    .duration(updateTime)
                    .ease(d3.easeQuad);
    var time = svg.attr("time");
    if (time%3 == 1) {
        mosquitos.attr("x", function(d) { return scaleX(d.x1); })
                .attr("y", function(d) { return scaleY(d.y1); })
    }
    else if (time%3 == 2) {
        mosquitos.attr("x", function(d) { return scaleX(d.x2); })
                .attr("y", function(d) { return scaleY(d.y2); })
    }
    else {
        mosquitos.attr("x", function(d) { return scaleX(d.x0); })
                .attr("y", function(d) { return scaleY(d.y0); })
    }
    svg.attr("time",parseInt(time)+1)
}

d3.json("data.json")
    .then(function(data) {
        var domain = createDomain(data);
        var scaleX = d3.scaleLinear();
        scaleX.domain(domain);
        scaleX.range([10,140]);
        var scaleY = d3.scaleLinear();
        scaleY.domain(domain);
        scaleY.range([10,60]);

        drawMosquito(data,scaleX,scaleY);
        addEvent(scaleX,scaleY);
        killMosquito();

})
.catch(function(error) {
    console.log(error);
});