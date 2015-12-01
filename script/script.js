var margin = {t:50,l:50,b:50,r:50},
    width = document.getElementById('map').clientWidth-margin.l-margin.r,
    height = document.getElementById('map').clientHeight-margin.t-margin.b;

var map = d3.select('.canvas')
    .append('svg')
    .attr('width',width+margin.l+margin.r)
    .attr('height',height+margin.t+margin.b)
    .append('g').attr('class','map')
    .attr('transform',"translate("+margin.l+","+margin.t+")");

//Compare with Week-10-in-Class Exercise 3
// Set up projection and geo path generator
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
        console.log(states);
        console.log(pop);

        //mine data to complete scales
        var maxPop = d3.max(pop);
        scaleR.domain([0,maxPop]);

        //construct a new array of data
        var data = states.features.map(function(d){
            //states.features is a 52 element array of GeoJSON objects
            var centroid = path.centroid(d); //provides two numbers [x,y] indicating the screen coordinates of the state

            return {
                fullName:d.properties.NAME,
                state:d.properties.STATE,
                x0:centroid[0],
                y0:centroid[1],
                x:centroid[0],
                y:centroid[1],
                r: scaleR((popByState.get(d.properties.STATE)).pop)
            }
        });
        console.log(data);

		var nodes = map.selectAll('.state')
            .data(data, function(d){return d.state});  //only look at the state attribute

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
                return d.fullName;
            })
            .attr('text-anchor','middle');



        //TODO: create a force layout
        //with what physical parameters?
        //refer to Week-11-in-class Exercise 2 -complete
        var force = d3.layout.force();

        force
            .size([width,height])
            .charge(0)
            .gravity(0)
            //collision detection:
            .nodes(data)   //add data array to the force layout, not nodes
            .on('tick', onTick)
            .start();

        function onTick(e){
            var q = d3.geom.quadtree(data),
                i = 0,
                n = data.length;

            while(++i<n){
                q.visit(collide(data[i]));
            }

            nodes
                .each(gravity(e.alpha *.1))
                .attr('cx',function(d){return d.x})
                .attr('cy',function(d){return d.y})
                .attr('transform',function(d){
                    return 'translate('+d.x+','+d.y+')';   //!!!
                });

            //custom gravity
            function gravity(k){
                return function(d){
                    //take each circle towards gravitational center (d.x0,d.y0)
                    d.y += (d.y0 - d.y)*k;
                    d.x += (d.x0 - d.x)*k;
                }
            }

            function collide(dataPoint){
                var nr = dataPoint.r + 5,
                    nx1 = dataPoint.x - nr,
                    ny1 = dataPoint.y - nr,
                    nx2 = dataPoint.x + nr,
                    ny2 = dataPoint.y + nr;

                return function(quadPoint,x1,y1,x2,y2){
                    if(quadPoint.point && (quadPoint.point !== dataPoint)){
                        var x = dataPoint.x - quadPoint.point.x,
                            y = dataPoint.y - quadPoint.point.y,
                            l = Math.sqrt(x*x+y*y),
                            r = nr + quadPoint.point.r;
                        if(l<r){
                            l = (l-r)/l*.1;
                            dataPoint.x -= x*= (l*.05);
                            dataPoint.y -= y*= l;
                            quadPoint.point.x += (x*.05);
                            quadPoint.point.y += y;
                        }
                    }
                    return x1>nx2 || x2<nx1 || y1>ny2 || y2<ny1;
                }
            }

        }

	});



function parseData(d){
    //Use the parse function to populate the lookup table of states and their populations/% pop 18+

    popByState.set(d.STATE,{
        'pop':+d.POPESTIMATE2014,
        'pop18plus':+d.PCNT_POPEST18PLUS
    });

    return +d.POPESTIMATE2014;
}

