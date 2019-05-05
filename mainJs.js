d3.queue()
    .defer(d3.json, "txn_records0328.json")
    .defer(d3.json, "txn_acct_list.json")
    .await(callback);

// ============= setting dropdown menu properties ===================================================
const inputField = document.querySelector('.chosen-value');
const dropdown = document.querySelector('.value-list');
const dropdownArrayAcct = [];
const select = document.getElementById('selector');
let margin = { top: 50, bottom: 50, left: 50, right: 50}
let svg = d3.select("#sna_graph").append('svg')
                                  .attr('id', '#graph')
                                  .attr('width', 600)
                                  .attr('height', 600);

let color = d3.scaleOrdinal(d3.schemeCategory20);
let width = 600 - margin.left - margin.right;
let height = 600 - margin.top - margin.bottom;

// =======================================================================================
function callback(error, graph, list) {
  if (error) throw error;

  // append alert acct_nbr into an array
  for(i =0; i<list.length; i++){
    if (list[i].alert === 'T'){
      dropdownArrayAcct.push(list[i].acct_nbr)
    };
  };

  // append array into a selector
  for (var i = 0; i < dropdownArrayAcct.length; i++) {
    var li = document.createElement("li");
    var text = document.createTextNode(dropdownArrayAcct[i]);
    li.appendChild(text);
    select.insertBefore(li, select.childNodes[i]);
  };

  // =============handling selection effect ========================
  const dropdownArray = [... document.querySelectorAll('li')];
  dropdown.classList.add('open');
  inputField.focus(); // Demo purposes only

  let valueArray = [];
  dropdownArray.forEach(item => {
    valueArray.push(item.textContent);
  });

  const closeDropdown = () => {
    dropdown.classList.remove('open');
  }

  inputField.addEventListener('input', () => {
    dropdown.classList.add('open');
    let inputValue = inputField.value.toLowerCase();
    let valueSubstring;
    // comparing input value and dropdown array
    if (inputValue.length > 0) {
      for (let j = 0; j < valueArray.length; j++) {
        if (!(inputValue.substring(0, inputValue.length) === valueArray[j].substring(0, inputValue.length).toLowerCase())) {
          dropdownArray[j].classList.add('closed');
        } else {
          dropdownArray[j].classList.remove('closed');
        }
      }
    } else {
      for (let i = 0; i < dropdownArray.length; i++) {
        dropdownArray[i].classList.remove('closed');
      }
    }
  });

  dropdownArray.forEach(item => {
    item.addEventListener('click', (evt) => {
      inputField.value = item.textContent;
      // ============= filtering graph and acct_nbr list ========================
      let alert_acct = inputField.value;
      let new_graph = [];
      let acct_list = [];
      let new_list = [];
      for(let i=0; i<graph.length; i++){
        if(graph[i].source == alert_acct | graph[i].target == alert_acct){
          if (!(graph[i] in new_graph)){
            new_graph.push(graph[i]);
          }
        }
      };
      new_graph.forEach(function(element){
        acct_list.push(element.source);
        acct_list.push(element.target);
      });
      acct_list = [...new Set(acct_list)];
      acct_list.forEach(function(element){
        list.forEach(function(ele){
          if(element === ele.acct_nbr){
            new_list.push(ele);
          }
        })
      })

      draw(new_graph, new_list, alert_acct);

      dropdownArray.forEach(dropdown => {
        dropdown.classList.add('closed');
      });
    });
  })

  inputField.addEventListener('focus', () => {
     inputField.placeholder = 'Type to filter';
     dropdown.classList.add('open');
     dropdownArray.forEach(dropdown => {
       dropdown.classList.remove('closed');
     });
  });

  inputField.addEventListener('blur', () => {
     inputField.placeholder = 'Select Account Number';
    dropdown.classList.remove('open');
  });

  document.addEventListener('click', (evt) => {
    const isDropdown = dropdown.contains(evt.target);
    const isInput = inputField.contains(evt.target);
    if (!isDropdown && !isInput) {
      dropdown.classList.remove('open');
    }
  });
};
  // ============= sna graph illustration ========================
function draw(g,l,a){

  d3.selectAll('g').remove();
  // set the nodes
  let nodes = l;
  // links between nodes
  let links = g;

  let acct = a;


  // console.log(nodes);
  // console.log(links);
  //create node size scale
  let linkSizeScale = d3.scaleLinear()
    .domain(d3.extent(links, d => d.txn_amt))
    .range([5, 10]);
  let linkStrengthScale = d3.scaleLinear()
    .domain(d3.extent(links, d => d.txn_cnt))
    .range([2, 3]);

  //set up the simulation and add forces
  let simulation = d3.forceSimulation().nodes(nodes);
  let link_force =  d3.forceLink(links).id(function(d) { return d.acct_nbr; }).strength(function(d) {
      return linkStrengthScale(d.txn_cnt);
  });
  let charge_force = d3.forceManyBody().strength(-1000);
  let center_force = d3.forceCenter(width/2, height/3);

  simulation
      .force("charge_force", charge_force)
      .force("center_force", center_force)
      .force("link",link_force);

  //add tick instructions:
  simulation.on("tick", tickActions);
  let defs = svg.append("defs");
  //add svg for arrows
  let arrows = defs.selectAll("marker")
                  	.data(["end", "end-active"])
                  	.enter().append("marker")
                  	.attr('markerUnits', 'userSpaceOnUse')
                  	.attr("id", function (d) { return d; })
                  	.attr("viewBox", "0 -5 10 10")
                  	.attr("refX", 0)
                  	.attr("refY", 0)
                  	.attr("markerWidth", 12)
                  	.attr("markerHeight", 12)
                  	.attr("orient", "auto-start-reverse")
                  	.append("path")
                  	.attr("d", "M0,-5L10,0L0,5");

  //define the classes for each of the markers.
  defs.select("#end").attr("class", "arrow");
  defs.select("#end-active").attr("class", "arrow-active");
  //add encompassing group for the zoom
  var g = svg.append("g")
             .attr("class", "everything").attr('transform', 'translate(' + margin.top + ',' + margin.left + ')');;

  // add the curved links to our graphic
  var link = g.selectAll(".link")
              .data(links)
              .enter()
              .append("path")
              .attr("class", "link")
              .style('stroke', "#bfcaca")
              .attr('fill', 'None')
              .attr('stroke-opacity', 0.5)
              .attr('stroke-width', d => {return linkSizeScale(d.txn_amt);})
              .attr("marker-end", "url(#end)");

  //draw circles for the nodes
  var node = g.append("g")
              .attr("class", "nodes")
              .selectAll("circle")
              .data(nodes)
              .enter()
              .append("circle")
              .attr("r", 10)
              .attr("fill", function(d){if(d.alert == 'T'){return '#cc3300'}else if(d.bank_code == '他行'){return "#FF9966"}else{return '#ffcc00'}})
              .on("mouseover", mouseOver(.1))
              .on("mouseout", mouseOut);

  //add text labels
  var text = g.append("g")
              .attr("class", "labels")
              .selectAll("text")
              .data(nodes)
              .enter().append("text")
              .style("text-anchor","middle")
              .style("font-weight", "bold")
              .style("pointer-events", "none")
              .attr("dy", ".35em")
              .text('');



  dashboardOut(nodes,links,acct);
  //add drag capabilities
  var drag_handler = d3.drag()
                        .on("start", drag_start)
                        .on("drag", drag_drag)
                        .on("end", drag_end);

  drag_handler(node);


  //add zoom capabilities
  var zoom_handler = d3.zoom()
                       .on("zoom", zoom_actions);

  zoom_handler(svg);

  /** Functions **/

  //Drag functions
  //d is the node
  function drag_start(d) {
   if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
  }

  //make sure you can't drag the circle outside the box
  function drag_drag(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function drag_end(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  //Zoom functions
  function zoom_actions(){
      g.attr("transform", d3.event.transform)
  }

  function tickActions() {
      //update circle positions each tick of the simulation
         node
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });

        //update link positions
        link.attr("d", positionLink1);
    	  link.filter(function(d){ return JSON.stringify(d.target) !== JSON.stringify(d.source); })
            .attr("d",positionLink2);

        text.attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; });
  }


  function positionLink1(d) {
      var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx * dx + dy * dy);
      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
  }

    // recalculate and back off the distance
  function positionLink2(d) {
  	    // length of current path
      var pl = this.getTotalLength(),
          // radius of circle plus marker head
          r = 10 + 12, //12 is the "size" of the marker Math.sqrt(12**2 + 12 **2)
          // position close to where path intercepts circle
          m = this.getPointAtLength(pl - r);

       var dx = m.x - d.source.x,
           dy = m.y - d.source.y,
           dr = Math.sqrt(dx * dx + dy * dy);

        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + m.x + "," + m.y;
  }

  // build a dictionary of nodes that are linked
  var linkedByIndex = {};
  links.forEach(function(d) {
      linkedByIndex[d.source.index + "," + d.target.index] = 1;
  });

  // check the dictionary to see if nodes are linked
  function isConnected(a, b) {
      return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
  }

  // fade nodes on hover
  function mouseOver(opacity) {
      return function(d) {
          // check all other nodes to see if they're connected to this one. if so, keep the opacity at 1, otherwise fade

          // text.text(function(o) {
          //   return isConnected(d, o) ? o.acct_nbr : "";
          // })

          node.style("stroke-opacity", function(o) {
              thisOpacity = isConnected(d, o) ? 1 : opacity;
              return thisOpacity;
          });
          node.style("fill-opacity", function(o) {
              thisOpacity = isConnected(d, o) ? 1 : opacity;
              return thisOpacity;
          });
          text.style("fill-opacity", function(o) {
              thisOpacity = isConnected(d, o) ? 1 : opacity;
              return thisOpacity;
          });
          // also style link accordingly
          link.style("stroke-opacity", function(o) {
              return o.source === d || o.target === d ? 1 : opacity;
          });

          link.attr("marker-end", function(o) {
              return o.source === d || o.target === d ? "url(#end-active)" : "url(#end)";
          });

          d3.selectAll("table tr").style('background-color', function() {
              if(d3.select(this).text().includes(d.acct_nbr)){
                return '#511400';
              };
          });
      };
  }

  function mouseOut() {
      node.style("stroke-opacity", 1);
      node.style("fill-opacity", 1);
      // text.text('');
      link.style("stroke-opacity", 0.5);
      link.style("stroke", "#bfcaca");
      link.attr("marker-end", "url(#end)");
      // d3.selectAll(".text-tip tr").style('background-color', "transparent");

  }


  function dashboardOut(l,g,a){

    d3.selectAll(".text-tip").remove();


    let selected = l.find(function(element) {
         return element.acct_nbr === a;
        });

    //create detail transaction records dashboard
    var dashboard = d3.select("#desc_div")
                      .append("section")
                      .attr("class", 'text-tip')
                      .attr("x", 0)
                      .attr("y", 0)
                      .style("width", 400)
                      .style('height', 500)
                      .style("overflow", "scroll")
                      .style("visibility", "hidden")
                      .style('padding-right', '10px');


    dashboard.classed("open", true);
    dashboard
        .transition()
        .style("margin-left", "0px")
        .style('visibility', 'visible')
        .duration(1000)
        .attr({"opacity": 0});
    svg
        .transition()
        // .style("margin-left", "200px")
        .duration(1250);



    //DASHBOARD INFORMATION
    dashboard.append("text")
          .attr("class", "text-tip").html("<img src='search.png' width=33 height=30 style='display: inline-block; padding-right: 5px;'><h5 style='display: inline-block;'>帳戶號碼: " +   selected.acct_nbr + "</h5>")
          .style("display", "block")
          .style("color", "#f5f5f5")
          .style("font-family", 'Noto Sans TC')
          .style("font-size", "20px")
          .style('padding-bottom', '10px');

    let table = dashboard.append('table')
                         .attr("class", "table table-condensed table-striped");
    let thead = table.append("thead");
    let tbody = table.append("tbody");
    let columns = ['轉出帳戶', '轉入帳戶', '交易金額', '轉出次數', '轉入次數'];

    let header = thead.append("tr")
		                  .selectAll("th")
		                  .data(columns)
		                  .enter()
		                  .append("th")
			                .text(function(d){ return d;})
                      .style("display", "inline-block")
                      .style("color", "#f5f5f5")
                      .style("padding", "10px 0px")
                      .style("font-family", 'Noto Sans TC')
                      .style("font-size", "12px")
                      .style('width', "20%")
                      .style('text-align', 'center')
                      .style('border-bottom', '1px solid #ddd')
			                .on("click", function(d){
                        if (d == "轉入帳戶"){
                          rows.sort(function(a, b) {
                            if (a['source'] < b['source']){ return -1; }
						                if (a['source'] > b['source']){ return 1; }
                            else{ return 0; }
    				               });
				                   }
                        else if (d == "轉出帳戶"){
                          rows.sort(function(a, b) {
                            if (a['target'] < b['target']){ return -1; }
                            if (a['target'] > b['target']){ return 1; }
                            else{ return 0; }
                            });
                            }
                        else if (d == "交易金額"){
                          rows.sort(function(a, b){
                          return b['txn_amt'] - a['txn_amt'];
                          })
                          }
                        else if (d == "轉出次數"){
                          rows.sort(function(a, b){
                          return b['outdegree_cnt'] - a['outdegree_cnt'];
                          })
                          }
                        else {
					                rows.sort(function(a, b){
						              return b['indegree_cnt'] - a["indegree_cnt"];
					                })
				                  }
  			                  });

    let rows = tbody.selectAll("tr")
                  	.data(g)
                  	.enter()
                  	.append("tr")
                    // .on('mouseover', function(d){
                    //   let linkedByIndex_tr = {};
                    //   d.forEach(function(d) {
                    //       linkedByIndex_tr[d.source.index + "," + d.target.index] = 1;
                    //   });
                    //   node.style("fill-opacity", function(o) {
                    //     thisOpacity = isConnected2(d, o) ? 1 : .1;
                    //     return thisOpacity;
                    //   });
                    //   // text.text(function(o) {
                    //   //   return isConnected(d, o) ? o.acct_nbr : "";
                    //   // })
                    //
                    //
                    // });


    function formatNumber(num) {
      return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
    }

    let cells = rows.selectAll("td")
                  	.data(function(row){
                                return columns.map(function (column) {
                                  if(column === "轉出帳戶"){
                                    return {column: column, value: row['source']['acct_nbr']};
                                  }
                                  else if(column ==="轉入帳戶"){
                                    return {column: column, value: row['target']['acct_nbr']};
                                  }
                                  else if (column === "交易金額") {
                                    return {column: column, value: formatNumber(row['txn_amt'])};
                                  }
                                  else if (column === "轉出次數") {
                                    return {column: column, value: row['outdegree_cnt']};
                                  }else{
                                    return {column: column, value: row['indegree_cnt']};
                                  }
                                })
                              })
                  	.enter()
                  	.append("td")
                  	.html(function(d){ return d.value;})
                    .style("display", "inline-block")
                    .style("color", "#f5f5f5")
                    .style("padding", "10px 0px")
                    .style("font-family", 'Noto Sans TC')
                    .style("font-size", "12px")
                    .style('width', '20%')
                    .style('text-align', 'center')
                    .style('border-bottom', '1px solid #ddd');

      };

};
