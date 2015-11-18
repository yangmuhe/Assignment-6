var margin = {t:50,l:50,b:50,r:50},
    width = document.getElementById('map').clientWidth-margin.l-margin.r,
    height = document.getElementById('map').clientHeight-margin.t-margin.b;

var map = d3.select('.canvas')
    .append('svg')
    .attr('width',width+margin.l+margin.r)
    .attr('height',height+margin.t+margin.b)
    .append('g').attr('class','map')
    .attr('transform',"translate("+margin.l+","+margin.t+")");

//Set up projection and geo path generator
var projection = d3.geo.albersUsa()
	.translate([width/2, height/2]);

var path = d3.geo.path()
	.projection(projection);

var popByState = d3.map();

//Scales
var scaleR = d3.scale.sqrt().range([5,130]),
    scaleColor = d3.scale.linear().domain([70,90]).range(['white','red']);

//import data
queue()
	.defer(d3.json, "data/gz_2010_us_040_00_5m.json")
    .defer(d3.csv, "data/2014_state_pop.csv", parseData)
	.await(function(err, states, pop){

        //mine data to complete scales
        var maxPop = d3.max(pop);
        scaleR.domain([0,maxPop]);

        //construct a new array of data
        var data = states.features.map(function(d){
            var centroid = path.centroid(d); //provides two numbers [x,y] indicating the screen coordinates of the state

            return {
                fullName:d.properties.NAME,
                state:d.properties.STATE,
                x0:centroid[0],
                y0:centroid[1],
                x:centroid[0],
                y:centroid[1]
            }
        });
        console.log(data);

		var nodes = map.selectAll('.state')
            .data(data, function(d){return d.state});

        //Represent as a cartogram of populations
        var nodesEnter = nodes.enter()
            .append('g')
            .attr('class','state');
        nodes.exit().remove();

        nodes
            .attr('transform',function(d){
                return 'translate('+d.x+','+d.y+')';
            })
        nodes
            .append('circle')
            .attr('r',function(d){
                var pop = (popByState.get(d.state)).pop;
                return scaleR(pop);
            })
            .style('fill',function(d){
                var pct18Plus = (popByState.get(d.state)).pop18plus;
                return scaleColor(pct18Plus);
            })
            .style('fill-opacity',.7);
        nodes
            .append('text')
            .text(function(d){
                return d.name;
            })
            .attr('text-anchor','middle');

        //TODO: create a force layout
        //with what physical parameters?
        var force = d3.layout.force()
        //on "tick" event ...

	});

function parseData(d){
    //Use the parse function to populate the lookup table of states and their populations/% pop 18+

    popByState.set(d.STATE,{
        'pop':+d.POPESTIMATE2014,
        'pop18plus':+d.PCNT_POPEST18PLUS
    });

    return +d.POPESTIMATE2014;
}
