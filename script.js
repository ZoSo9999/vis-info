var svg = d3.select("body").append("svg")
    .attr("viewBox", "0 0 150 70")
    .style("border", "2px solid black");   


function drawMosquito(data) {
    svg.selectAll("image")
    .data(data)
    .enter()
    .append("svg:image")
    .attr("xlink:href", "zanzara.png")
    .attr("x", function(d) { return d.x1; })
    .attr("y", function(d) { return d.y1; })
    .attr("width", "5")
    .attr("height", "5")
    .attr("id", function(d) { return d.id; })
    .attr("onclick", "move()")
}

d3.json("data.json")
    .then(function(data) {
    drawMosquito(data)

})
.catch(function(error) {
    console.log(error);
});