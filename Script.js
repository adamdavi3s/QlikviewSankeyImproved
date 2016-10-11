//Outline template originally written by Brian Munz https://community.qlik.com/docs/DOC-3742 and slightly adapted by  APD adam@daftsolutions.co.uk
//This is template version 1.1 released 04/10/2016
//Please leave these lines in place if you're using this template


//D3 code taken from the example here: https://bost.ocks.org/mike/sankey/
//to answer the problem posed here: https://community.qlik.com/thread/213922


//set our extension name in a variable
var extensionName = "sankey"; //remember to also update this in definition.xml

//now we can use this in our extensionpath so you're not a dufus again and spend 3hours looking for the missing "/" at the end
var extensionPath = Qva.Remote + "?public=only&name=Extensions/" + extensionName +"/";

//now lets sort out our additional files:
//if Qlik crashes out then try the alternative code below

function extensionInit() {
	var jsfiles = [];
	//load jquery if required
	if (typeof jQuery == 'undefined') {
	jsfiles.push(extensionPath + "jquery.js");
	}
	//Pushing any other js files	
			Qva.LoadScript(extensionPath + "d3.v3.min.js", function() {
	Qva.LoadScript(extensionPath + "sankey.js", extensionDone);});
	//jsfiles.push(extensionPath + "additionalfileshere.js");
	
	//now load these and call next function
	 Qva.LoadScript(jsfiles, extensionDone);
							} //end extension_Init

//if Qlik crashes then it might just be it can't handle the size of the files in the push so run this code instead of the block above:
/*
function extensionInit() {
	var jsfiles = [];
	//load jquery if required
	if (typeof jQuery == 'undefined') {
	jsfiles.push(extensionPath + "jquery.js");
	}
	
	//Pushing any other js files	
	Qva.LoadScript(extensionPath + "three.js", function() {
	Qva.LoadScript(extensionPath + "tween.min.js", function() {
	Qva.LoadScript(extensionPath + "TrackballControls.js", function() {
	Qva.LoadScript(extensionPath + "CSS3DRenderer.js", function() {
Qva.LoadScript(extensionPath + "additionalfileshere.js", extensionDone);});});});}); //just make sure you get the right number of );} for your files!
							} //end extension_Init

*/							
							
							
//What I didn't realize is that in order to use the HTML select, you need to include extra code in your script.js file:
if (Qva.Mgr.mySelect == undefined) {
    Qva.Mgr.mySelect = function (owner, elem, name, prefix) {
        if (!Qva.MgrSplit(this, name, prefix)) return;
        owner.AddManager(this);
        this.Element = elem;
        this.ByValue = true;
 
        elem.binderid = owner.binderid;
        elem.Name = this.Name;
 
        elem.onchange = Qva.Mgr.mySelect.OnChange;
        elem.onclick = Qva.CancelBubble;
    }
    Qva.Mgr.mySelect.OnChange = function () {
        var binder = Qva.GetBinder(this.binderid);
        if (!binder.Enabled) return;
        if (this.selectedIndex < 0) return;
        var opt = this.options[this.selectedIndex];
        binder.Set(this.Name, 'text', opt.value, true);
    }
    Qva.Mgr.mySelect.prototype.Paint = function (mode, node) {
        this.Touched = true;
        var element = this.Element;
        var currentValue = node.getAttribute("value");
        if (currentValue == null) currentValue = "";
        var optlen = element.options.length;
        element.disabled = mode != 'e';
        //element.value = currentValue;
        for (var ix = 0; ix < optlen; ++ix) {
            if (element.options[ix].value === currentValue) {
                element.selectedIndex = ix;
            }
        }
        element.style.display = Qva.MgrGetDisplayFromMode(this, mode);
 
    }
} //end with the HTML select magic


function extensionDone() {


	Qva.AddExtension(extensionName , function(){

		//Load a CSS style sheet
		Qva.LoadCSS(extensionPath + "style.css");
		
		//make this equal _this		
			var _this = this;
			
		//setup html
			var html = "";		
		
		//add a unique name to the extension in order to prevent conflicts with other extensions.
		//basically, take the object ID and add it to a DIV
		var divName = _this.Layout.ObjectId.replace("\\", "_");
		if(_this.Element.children.length == 0) {//if this div doesn't already exist, create a unique div with the divName
			var ui = document.createElement("div");
			ui.setAttribute("id", divName);
			_this.Element.appendChild(ui);
		} else {
			//if it does exist, empty the div so we can fill it again
			$("#" + divName).empty();
		}
	


//****************************************************************************************************************
//start your extension code here	
//****************************************************************************************************************
					
var data = [];
var linksArray = [];
var node = {};
var output = {};
var nodes = [];
var links = [];
var index = {};
var color = d3.scale.category20();
var formatNumber = d3.format(",.0f");
var format = function(d) {
    return formatNumber(d) ;
};
var width = _this.GetWidth() * .95;
var height = _this.GetHeight() * .95;
var checkbox1 = _this.Layout.Text0.text.toString();


//stop the script if source and destination are set to the same
//This just forces the script to stop and not get stuck in a loop!
if(_this.Data.HeaderRows[0][0].text === _this.Data.HeaderRows[0][1].text){
	 _this.Element.innerHTML = "<div style=\" font: 6px sans-serif; color: rgb(255,0,0);\"><h1>Please ensure source and destination are different<br> F5 to refresh after changing</h1></div>";
	throw new Error("Something went badly wrong!");
};


//load the data
for (var f = 0; f < _this.Data.Rows.length; f++) {
    var row = _this.Data.Rows[f];
    var source = row[0].text;
    var destination = row[1].text;
    var size = row[2].text;

    var node = {
        "source": source,
        "target": destination,
        "value": size
    };
    data.push(node);
}


//Couldn't figure the data sorting so had to employ some help
//http://stackoverflow.com/questions/39897552/js-converting-an-array-to-a-json-linked-list

var output = data.reduce(function(result, item) {
    for (key in search = ['source', 'target']) {
        var value = item[search[key]];

        if (!result.index.hasOwnProperty(value)) {
            result.index[value] = Object.keys(result.index).length;
            result.nodes.push({
                name: value
            });
        }
    }

    result.links.push({
        source: result.index[item.source],
        target: result.index[item.target],
        value: Number(item.value)
    });

    return result;
}, {
    nodes: [],
    links: [],
    index: {}
});

delete output.index;

//END stack overflow code

//build the chart

var svg = d3.select("#" + divName)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "chart")
	


var sankey = d3.sankey()
    .nodeWidth(15)
    .nodePadding(10)
    .size([width, height]);

var path = sankey.link();

sankey
    .nodes(output.nodes)
    .links(output.links)
    .layout(32);

var link = svg.append("g").selectAll(".link")
    .data(output.links)
    .enter().append("path")
    .attr("class", "link")
    .attr("d", path)
    .style("stroke-width", function(d) {
        return Math.max(1, d.dy);
    })
    .sort(function(a, b) {
        return b.dy - a.dy;
    });

link.append("title")
    .text(function(d) {
        return d.source.name + " ->" + d.target.name + "\n" + format(d.value);
    });

var node = svg.append("g").selectAll(".node")
    .data(output.nodes)
    .enter().append("g")
    .attr("class", "node")
	.on("click",onclick)
    .attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
    })

	
    .call(d3.behavior.drag()
        .origin(function(d) {
            return d;
        })
        .on("dragstart", function() {
            this.parentNode.appendChild(this);
        })
        .on("drag", dragmove));
		

node.append("rect")
    .attr("height", function(d) {
        return d.dy;
    })
    .attr("width", sankey.nodeWidth())
    .style("fill", function(d) {
        return d.color = color(d.name.replace(/ .*/, ""));
    })
    .style("stroke", function(d) {
        return d3.rgb(d.color).darker(2);
    })
    .append("title")
    .text(function(d) {
        return d.name + "\n" + d.value;
    })
	

node.append("text")
    .attr("x", -6)
    .attr("y", function(d) {
        return d.dy / 2;
    })
    .attr("dy", ".35em")
    .attr("text-anchor", "end")
    .attr("transform", null)
    .text(function(d) {
			if(checkbox1==0){
						return d.name;
									}
			else{
				return d.name+ ' '+d.value;	
					
			}
       
    })
    .filter(function(d) {
        return d.x < width / 2;
    })
    .attr("x", 6 + sankey.nodeWidth())
    .attr("text-anchor", "start");
	


function dragmove(d) {
    d3.select(this).attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ")");
    sankey.relayout();
    link.attr("d", path);
}
					
function onclick(){
	var flarb = d3.select(this).datum();
	if(flarb.sourceLinks.length ===0){
	_this.Data.SelectTextsInColumn(1, true, flarb.name); 
	} 
	else{
	_this.Data.SelectTextsInColumn(0, true, flarb.name); 	
			
	}
}					
					
				

//****************************************************************************************************************
//end your extension code here
//****************************************************************************************************************


			
			
			},true); //end add extension				
						
						}; //end extensionDone


//This loads up firebug within the qlikview application comment it out in live!
Qva.LoadScript('https://getfirebug.com/firebug-lite.js', function(){  //comment this row out in live


extensionInit(); //call the function that kicks everything off 

}); //comment this row out in live

