Based on the D3 code from Mike Bostock: http://bl.ocks.org/mbostock/7607535
Also the original Sankey extension: http://branch.qlik.com/#!/project/56728f52d1e497241ae69783


Someone posed the question on the community about the fact that the sankey extension object was duplicating nodes rather than allowing intermediaries to work properly. https://community.qlik.com/thread/213922

So I got hold of the D3 code and slightly changed the way it works.
– Now works from three fields; Source Destination and Size
– Added the ability to double click on nodes to select the source or destination
– Number formatting tweak
– Size added to the labels

Included is an example file which includes code to shred a delimited path into the two fields required

Overall this isn’t a huge change, just a small refinement
