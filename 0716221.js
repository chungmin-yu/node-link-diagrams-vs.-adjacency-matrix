
//colorset
const colorset = function(d) {
  return d3.schemeCategory10[d.group];
};

//dragging
const dragging = simulation => {
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }
  
  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }
  
  function draggedend(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
  
  return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", draggedend);
};

var highlight = [];
var linkid = [];
d3.csv('http://vis.lab.djosix.com:2020/data/infect-dublin.edges').then((data) => {
  var links = [];    
  var nodes = [];
  var link_num = [];

  //reset link numbers
  for (var i = 1; i <411; i++) {
  	link_num.push(0);
  }
  
  //push data of link
  data.forEach((d) => {
    var split = d[Object.keys(d)].split(' ');
    d.source = split[0];
    d.target = split[1];
    d.value = 1;
    links.push(d);
    linkid["L"+d.source+"x"+d.target] = 1;
    link_num[parseInt(split[0], 10)] += 1;
    link_num[parseInt(split[1], 10)] += 1;
  });
  
  //push data of nodes
	for (var i=1; i<411; i++) {
    var element = [];
    element.id = String(i);
    element.group = Math.ceil(link_num[i]/10);
    element.total_link = link_num[i];
    nodes.push(element);
	}
  
  //record link of two nodes
	var two_link = [];
  links.forEach((d) => {
    var edge = d.source + ":" + d.target;
    two_link[edge] = 1;
    var edge = d.target + ":" + d.source;
    two_link[edge] = 1;
  });
  
  //set grid of matrix
  var matrix = [];
  for(var y=1; y<411; y++) {
    var row = [];
    for(var x=1; x<411; x++) {
      var grid = 0;
      if(two_link[y + ":" + x]){
        grid = 1;
      }
      row.push(grid);
    }
    matrix.push(row);
  }
  console.log(matrix)

  var row_labels=[]
  var col_labels=[]
  for(var i=1; i<411; i++){
      var label = i;
      row_labels.push(label);
      col_labels.push(label);
  }
  console.log(row_labels)
  console.log(col_labels)

  //implement node-link diagram
  //build svg
  const svg = d3.select('#svg1');
	const width = +svg.attr('width');
	const height = +svg.attr('height');
	//use d3force
  const simulation = d3.forceSimulation(nodes)
  	.force('link', d3.forceLink(links).id(d => d.id))
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(width / 2, height / 2));

 //construct link
  const link = svg
    .append('g')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke-width', (d) => Math.sqrt(d.value))
    .attr("id", d => "L" + d.source.id + "x" +d.target.id);

  //construct node
  const node = svg
    .append('g')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .selectAll('circle')
    .data(nodes)
    .join('circle')
    .attr('r', 5)
    .attr('fill', colorset)
    .call(dragging(simulation))
    .on('click', alldata => {
      var id = alldata.path[0].childNodes[0].__data__.id;
      d3.selectAll('rect').style('stroke-width', '1px').style('stroke', '#4682B4');
      highlight.forEach(function(d){return d3.select(d).attr('stroke-width', 1).attr('stroke', '#999');});
      highlight.length = 0;
      for(var i=1;i<411;i++) {
        d3.select("#g"+i+"x"+id).style('stroke-width', '3px').style('stroke', '#6633CC');
        d3.select("#g"+id+"x"+i).style('stroke-width', '3px').style('stroke', '#6633CC');
      }
      d3.select('#caption').text("The row and column of node " + id + " are highlighted.");
    });

  //show node id and link number
  node.append("title").text(function(d){return 'Node '+ d.id + ' ( ' +d.total_link+' links )'});

  simulation.on('tick', () => {
    link
      .attr('x1', function(d){return d.source.x})
      .attr('y1', function(d){return d.source.y})
      .attr('x2', function(d){return d.target.x})
      .attr('y2', function(d){return d.target.y});    
    node
      .attr("cx", function(d){return d.x})
      .attr("cy", function(d){return d.y});
  });
  
  //zoom
  svg.call(
    d3.zoom()
    .extent([[0, 0],[width, height],])
    .scaleExtent([0.3, 3])
    .on('zoom', zoomed));
  function zoomed({ transform }) {
    link.attr('transform', transform);
    node.attr('transform', transform);
  }


  //implement adjacency matrix
  //build svg
  var margin2 = {top: 80, right: 0, bottom: 10, left: 80},
  width2 = 3000 - margin2.left - margin2.right,
  height2 = 3000 - margin2.top - margin2.bottom;

  var svg2 = d3.select("#svg2").append("svg").attr("width", width2 + margin2.left + margin2.right)
    .attr("height", height2 + margin2.top + margin2.bottom)
    .append("g")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

  //caption and tell what to do
  svg2.append('text')
  .attr('id', 'caption')
  .attr('y', -40)
  .attr('x', 800)
  .text("click node on left graph or click grid on right graph")
  .attr('fill', "#4682B4")
  .attr('font-size', '1.3em');

  table({matrix: matrix, row_labels: row_labels, col_labels: col_labels});
  
  //build matrix and color grid of matrix
  function table(json) {
  var matrix = json.matrix,
  row_labels = json.row_labels,
  col_labels = json.col_labels,
  row_perm = json.row_permutation,
  col_perm = json.col_permutation,
  row_inv, col_inv,
  n = matrix.length,
  m = matrix[0].length,
  i;

  if (! row_labels) {
  row_labels = Array(n);
  for (i = 0; i < n; i++) 
      row_labels[i] = i+1;
  }
  if (! col_labels) {
  col_labels = Array(m);
  for (i = 0; i < n; i++) 
      col_labels[i] = i+1;
  }

  if (! row_perm)
  row_perm = reorder.permutation(n);
  row_inv = reorder.inverse_permutation(row_perm);

  if (! col_perm)
  col_perm = reorder.permutation(m);
  col_inv = reorder.inverse_permutation(col_perm);

  var colorLow = 'white', colorHigh = 'orange';
  var color = d3.scaleLinear()
      .domain([0, 1])
      .range([colorLow, colorHigh]);

  var gridSize = Math.min(width2 / matrix.length, height2 / matrix[0].length),
  h = gridSize,
  th = h*n,
  w = gridSize,
  tw = w*m;

  var x = function(i) { return w*col_inv[i]; },
  y = function(i) { return h*row_inv[i]; };

  var row = svg2
    .selectAll(".row")
    .data(matrix, function(d, i) { return 'row'+i; })
    .enter().append("g")
          .attr("id", function(d, i) { return "row"+i; })
          .attr("class", "row")
          .attr("transform", function(d, i) {
  return "translate(0,"+y(i)+")";
    });

  var tmpx = function(i) { return i+1; },
  tmpy = function(i) { return i+1; };


  for(var t=0;t<410;t++){
  var cell = svg2.select("#row"+t).selectAll(".cell")
    .data(function(d) { return d; })
    .enter().append("rect")
          .attr("class", "cell")
          .attr("x", function(d, i) { return x(i); })
          .attr("width", w)
          .attr("height", h)
          .attr('id', function(d,i){return "g" + tmpx(i) + "x" + tmpy(t)})
          .style("fill", function(d) { return color(d); })
          .style('fill-opacity', 0.4)
          .style("stroke", 'black')
          .on("click", alldata => {
          d3.selectAll("rect").style("stroke-width", "1px").style("stroke", "#4682B4");
          highlight.forEach(function(d){return d3.select(d).attr("stroke-width", 1).attr("stroke", "#999");});
          highlight.length = 0;
          console.log(alldata)
          d3.select("#"+alldata.path[0].id).style("stroke-width", "3px").style("stroke", '#FF0000');
          if(alldata.path[0].style['fill'] == "rgb(255, 255, 255)"){
            //no link
            var spilt = alldata.path[0].id.replace('g', '');
            spilt = spilt.split('x');
            d3.select("#caption").text("The grid you choose don't have link (node " + spilt[0] + " & node " + spilt[1] + ")");
          }else{
            //exist link
            var spilt = alldata.path[0].id.replace('g', '');
            spilt = spilt.split('x');
            if(linkid[alldata.path[0].id.replace('g', 'L')]){
              d3.select("#caption").text("The link (node " + spilt[0] + " & node " + spilt[1] + ") is highlighted.");
              d3.select("#"+alldata.path[0].id.replace('g', 'L')).attr("stroke-width", 10).attr("stroke", "#FF69B4");
              highlight.push("#"+alldata.path[0].id.replace('g', 'L'));
            }else{
              d3.select("#caption").text("The link (node " + spilt[0] + " & node " + spilt[1] + ") is highlighted.");
              d3.select("#L"+spilt[1]+"x"+spilt[0]).attr("stroke-width", 10).attr("stroke", "#FF69B4");
              highlight.push("#L"+spilt[1]+"x"+spilt[0]);
            }
          }
      });

      }

      row.append("text")
      .attr("x", -6)
      .attr("y", h / 2)
      .style('font-size','7px')
      .attr("text-anchor", "end")
      .text(function(d, i) { return row_labels[i]; });

      var col = svg2.selectAll(".col")
        .data(matrix[0])
        .enter().append("g")
        .attr("id", function(d, i) { return "col"+i; })
        .attr("class", "col")
        .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

      col.append("text")
      .attr("x", 6)
      .attr("y", w / 2)
      .style('font-size','7px')
      .attr("text-anchor", "start")
      .text(function(d, i) { return col_labels[i]; });

      function order(rows, cols) {
      row_perm = rows;
      row_inv = reorder.inverse_permutation(row_perm);
      col_perm = cols;
      col_inv = reorder.inverse_permutation(col_perm);
      
      var t = svg2.transition().duration(150);

      t.selectAll(".row")
        .attr("transform", function(d, i) { return "translate(0," + y(i) + ")"; })
        .selectAll(".cell")
        .attr("x", function(d, i) { return x(i); });

      t.selectAll(".col")
        .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
      }
      table.order = order;
  }


  //use reoder API
  svg2.append('text')
      .attr('y', -40)
      .attr('x', 20)
      .attr('fill', "#4682B4")
      .attr('font-size', '1.3em')
      .text('Random Permute');
  svg2.append('ellipse')
      .attr('cy', -45)
      .attr('cx', 90)
      .attr('r', 20)
      .attr('rx', 100)
      .attr('ry', 20)
      .attr('fill', '#E6842A')
      .style('fill-opacity', 0.2)
      .on("click", alldata => {
        table.order(reorder.randomPermutation(matrix.length),
        reorder.randomPermutation(matrix[0].length));
      });
  svg2.append('text')
      .attr('y', -40)
      .attr('x', 224)
      .attr('fill', "#4682B4")
      .attr('font-size', '1.3em')
      .text('Optimal Leaf Order Permute');
  svg2.append('ellipse')
    .attr('cy', -45)
    .attr('cx', 342)
    .attr('r', 20)
    .attr('rx', 140)
    .attr('ry', 20)
    .attr('fill', '#137B80')
    .style('fill-opacity', 0.2)
    .on("click", alldata => {
      var transpose = reorder.transpose(matrix),
        dist_rows = reorder.dist()(matrix),
        dist_cols = reorder.dist()(transpose),
        order = reorder.optimal_leaf_order(),
        row_perm = order.distanceMatrix(dist_rows)(matrix),
        col_perm = order.distanceMatrix(dist_cols)(transpose);          
        table.order(row_perm, col_perm);
    });
  svg2.append('text')
      .attr('y', -40)
      .attr('x', 520)
      .attr('fill', "#4682B4")
      .attr('font-size', '1.3em')
      .text('Initial Order');
  svg2.append('ellipse')
    .attr('cy', -45)
    .attr('cx', 570)
    .attr('r', 20)
    .attr('rx', 70)
    .attr('ry', 20)
    .attr('fill', '#28004D')
    .style('fill-opacity', 0.2)
    .on("click", alldata => {
      table.order(reorder.permutation(matrix.length),
      reorder.permutation(matrix[0].length));
    });


//initialization for optimal_leaf_order
var transpose2 = reorder.transpose(matrix),
        dist_rows2 = reorder.dist()(matrix),
        dist_cols2 = reorder.dist()(transpose2),
        order2 = reorder.optimal_leaf_order(),
        row_perm2 = order2.distanceMatrix(dist_rows2)(matrix),
        col_perm2 = order2.distanceMatrix(dist_cols2)(transpose2);
        
        table.order(row_perm2, col_perm2);

});

