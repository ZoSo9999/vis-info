var updateTime = 1000;
var domain = [0,1000];

var scaleX = d3.scaleLinear();
scaleX.domain(domain);
scaleX.range([10,140]);

var scaleY = d3.scaleLinear();
scaleY.domain(domain);
scaleY.range([10,60]);

var svg = d3.select("body").append("svg")
    .attr("id","my-svg")
    .attr("viewBox", "0 0 150 70")
    .style("border", "2px solid black")
    .attr("time", "1");





function addEvent() {
    const svgElement = document.getElementById('my-svg');
    svgElement.addEventListener('click', (event) => {
        if (event.target === svgElement) {
            moveMosquito();
        }
    });
}

function drawMosquito(data) {
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
        });
    }
}

function moveMosquito() {
    var mosquitos = d3.selectAll("image[dead='false']")
                    .transition()
                    .duration(updateTime);
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
        drawMosquito(data);
        addEvent();
        killMosquito();

})
.catch(function(error) {
    console.log(error);
});