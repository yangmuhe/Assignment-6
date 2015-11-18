# Assignment-6: Drawing a Dorling Cartogram

In Week 10, we looked at a cartograms as an alternative representation of spatial information. In contrast to maps, some variable (population, for example) is substituted for land area. The representation of geography is distorted to accurately convey this variable.

Our in-class example began to construct a Dorling Cartogram (where geographic entities are represented as scaled circles) of the US states, showing the relative sizes of their population. In this exercise, we will use the force layout to improve the appearance of the cartogram.

## What do we need to accomplish?
In a Dorling Cartogram, geographic entities are anchored to their original locations. This however causes overlaps. Leveraging the force layout's ability to iteratively optimize a layout based on competiting forces, we can impose two constraints onto the circles in the Dorling Cartogram and determine a stable, optimized location for each of them.

The two forces are:
- Collision detection: the force layout will evaluate a pair of circles, and based on their respective location and radius, determine whether they need to be moved apart.
- Custom gravity: in the absence of other constraints, circles need to gravitate towards their original geographic location.

## Laying the ground work with data

Look at line 36 through 48
```
var data = states.features.map(function(d){
    var centroid = path.centroid(d); //provides two numbers [x,y] indicating the screen coordinates of the state

      return {
        fullName:d.properties.NAME,
        state:d.properties.STATE,
        x0:centroid[0],
        y0:centroid[1],
        x:centroid[0],
        y:centroid[1],
        r:scaleR( (popByState.get(d.properties.STATE)).pop )
    }
});
```

Knowing that we intend to draw the states as circles in a force layout with collision detection and custom gravity, we need to perform a few preparatory steps on the data itself.
