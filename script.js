var svg = d3.select("body").append("svg")
    .attr("viewBox", "0 0 150 70")
    .style("border", "2px solid black")
    .attr("time", "1")
    .on("click", moveMosquito);

function drawMosquito() {
    svg.selectAll("image")
    .data(window.data)
    .enter()
    .append("svg:image")
    .attr("xlink:href", "zanzara.png")
    .attr("x", function(d) { return d.x0; })
    .attr("y", function(d) { return d.y0; })
    .attr("width", "5")
    .attr("height", "5")
    .attr("id", function(d) { return d.id; });
    
}

function moveMosquito() {
    var mosquitos = svg.selectAll("image")
                    .data(window.data);
    var time = svg.attr("time");
    if (time%3 == 1) {
        mosquitos.attr("x", function(d) { return d.x1; })
                .attr("y", function(d) { return d.y1; })
    }
    else if (time%3 == 2) {
        mosquitos.attr("x", function(d) { return d.x2; })
                .attr("y", function(d) { return d.y2; })
    }
    else {
        mosquitos.attr("x", function(d) { return d.x0; })
                .attr("y", function(d) { return d.y0; })
    }
    svg.attr("time",parseInt(time)+1)
}

d3.json("data.json")
    .then(function(data) {
    window.data = data;
    drawMosquito();

})
.catch(function(error) {
    console.log(error);
});