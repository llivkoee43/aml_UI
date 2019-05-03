d3.queue()
    .defer(d3.json, 'alert_accts_0428.json')
    .await(callback);

 $("#instruction_title").click(function(){
   $("#instruction_content").slideToggle("slow");
 });
// ============= setting dropdown menu properties ==============================
let inputField = document.querySelector('.chosen-value');
let dropdown = document.querySelector('.value-list');
let dropdownArrayAcct = [];
let select = document.getElementById('selector');

// ============= setting graph svg properties ==================================
let margin = { top: 50, bottom: 50, left: 50, right: 50}
let svg = d3.select("#graph_container").append('svg')
                                  .attr('id', '#graph')
                                  // .attr('width', 500)
                                  // .attr('height', 400)
                                  .attr('viewBox', '0 0 500 400')
                                  .attr('preserveAspectRatio', 'xMidYMid meet')
                                  .attr('class', 'svg-content');

let color = d3.scaleOrdinal(d3.schemeCategory20);
let width = 600 - margin.left - margin.right;
let height = 600 - margin.top - margin.bottom;
// ============= setting graph svg properties ==================================
var svg_legend = d3.select("#legend_div").append('svg')
                                         .attr('width', 200)
                                         .attr('height', 400)
                                         // .attr('viewBox', '0 0 400 400')
                                         // .attr('preserveAspectRatio', 'xMidYMid')
                                         // .attr('class', 'svg-content');

svg_legend.append("circle").attr("cx",20).attr("cy",300).attr("r", 6).style("fill", "#fefd01");
svg_legend.append("circle").attr("cx",20).attr("cy",330).attr("r", 6).style("fill", "#cc3300");
svg_legend.append("circle").attr("cx",20).attr("cy",360).attr("r", 6).style("fill", "#d2a62c");
svg_legend.append("circle").attr("cx",20).attr("cy",390).attr("r", 6).style("fill", "#FF9966");

svg_legend.append("text").attr("x", 40).attr("y", 300).text("選定帳戶").style("font-size", "15px").style("fill", "#F0EDEE").attr("alignment-baseline","middle");
svg_legend.append("text").attr("x", 40).attr("y", 330).text("關注帳戶").style("font-size", "15px").style("fill", "#F0EDEE").attr("alignment-baseline","middle");
svg_legend.append("text").attr("x", 40).attr("y", 360).text("本行帳戶").style("font-size", "15px").style("fill", "#F0EDEE").attr("alignment-baseline","middle");
svg_legend.append("text").attr("x", 40).attr("y", 390).text("他行帳戶").style("font-size", "15px").style("fill", "#F0EDEE").attr("alignment-baseline","middle");




// =============================================================================
// ==================== start d3 + effects =====================================
function callback(error, list) {
  if (error) throw error;
  let nodes = list;

// =============================================================================
// ======================== init a slider ===================================
  $(".slider").slider();
// ======================== dropdown list ======================================
  //append alert acct_nbr into an array
  for(i =0; i<nodes.length; i++){
      if(!(nodes[i] in dropdownArrayAcct)){
      dropdownArrayAcct.push(nodes[i].acct_nbr);
    }
  };

  // append array into a selector
  for (var i = 0; i < dropdownArrayAcct.length; i++) {
    var li = document.createElement("li");
    var text = document.createTextNode(dropdownArrayAcct[i]);
    li.appendChild(text);
    select.insertBefore(li, select.childNodes[i]);
  };

// ============= handling selection effect =====================================
  const dropdownArray = [... document.querySelectorAll('li')];
  let valueArray = [];
  dropdownArray.forEach(item => {
    valueArray.push(item.textContent);
  });

// ============= dropdown list open & close effect =============================
// input something to open dropdown list and filter accounts
  inputField.addEventListener('input', () => {
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

// select an account from the list to illustrate a graph
  dropdownArray.forEach(item => {
    item.addEventListener('click', (evt) => {
      inputField.value = item.textContent;
// ============= A slider that removes nodes below the input threshold. ========
// ============== filtering graph and acct_nbr list ============================

      // the selected alert account Number
      let alert_acct = inputField.value;
      d3.selectAll('g').remove();
      d3.selectAll("table").remove();
      d3.selectAll(".text-tip").remove();


// ============== generate new slider range for selected account ===============
// let min_num = d3.min(sel_links, function(d) {return d.txn_amt_ttl; });
// let max_num = d3.max(sel_links, function(d) {return d.txn_amt_ttl; });
      let l1_val;
      $("#L1-slider")
        .slider({
            min: 50000,
            max: 500000000,
            value: 500000000
        })
        .slider("pips", {
            labels: { first: FormatLongNumber(50000), last: FormatLongNumber(10000000)},
            prefix: '$'
        })
        .on("slidechange", function( e, ui ) {
            l1_val = ui.value;
            d3.selectAll('g').remove();
            d3.selectAll("table").remove();
            d3.selectAll(".text-tip").remove();
            $('#L1-number').html(FormatLongNumber(l1_val));

        });

      $("#L2-slider")
        .slider({
            min: 50000,
            max: 1000000,
            value: 10000000
        })
        .slider("pips", {
            labels: { first: FormatLongNumber(50000), last: FormatLongNumber(10000000)},
            prefix: '$'
        })
        .on("slidechange", function( e, ui ) {
           let l2_val = ui.value;
           console.log(l2_val);
           console.log(l1_val);
           d3.selectAll('g').remove();
           d3.selectAll("table").remove();
           d3.selectAll(".text-tip").remove();

// ================== send request to backend ==================================
           // get the response results from input account number;
           let sel = $.ajax({
                   type:"get",
                   url: 'http://127.0.0.1:5000/table_filter',
                   data: {acct_nbr:alert_acct, L1_threshold: l1_val, L2_threshold: l2_val},
                   async: false,
                   dataType: 'json',
                   done: function(response){
                       JSON.parse(response);
                       return response;
                   },
                   fail: function( jqXHR, textStatus, errorThrown ) {
                         console.log( 'Could not get posts, server response: ' + textStatus + ': ' + errorThrown );
                     }
                   }).responseJSON;

           let new_nodes = jQuery.parseJSON(sel['acct_list']);
           let new_links = jQuery.parseJSON(sel['txn_records']);
           // console.log(jQuery.parseJSON(sel_links));

           $('#L2-number').html(FormatLongNumber(l2_val));

           let linkSizeScale = d3.scaleLinear()
                                 .domain(d3.extent(new_links, d => d.txn_amt_ttl))
                                 .range([5, 10]);
           let linkStrengthScale = d3.scaleLinear()
                                     .domain(d3.extent(new_links, d => d.txn_cnt_ttl))
                                     .range([1, 2]);

           //set up the simulation and add forces
           let simulation = d3.forceSimulation().nodes(new_nodes);
           let link_force =  d3.forceLink(new_links)
                               .id(function(d) { return d.acct_nbr; })
                               .strength(function(d) {
                                     return linkStrengthScale(d.txn_cnt_ttl);});
           let charge_force = d3.forceManyBody()
                                .strength(-1000);
           let center_force = d3.forceCenter(width/2, height/3);
           let collide_force = d3.forceCollide().radius(0.5);


           simulation
               .force("charge_force", charge_force)
               .force("center_force", center_force)
               .force("link", link_force)
               .force("collide_force", collide_force);

           //add svg for arrows
           let defs = svg.append("defs");
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
           let g = svg.append("g")
                      .attr("class", "everything")
                      .attr('transform', 'translate(' + margin.top + ',' + margin.left + ')');;

           // add the curved links to our graphic
           let link = g.selectAll(".link")
                       .data(new_links)
                       .enter()
                       .append("path")
                       .attr("class", "link")
                       .style('stroke', "#bfcaca")
                       .attr('fill', 'None')
                       .attr('stroke-opacity', 0.5)
                       .attr('stroke-width', d => {return linkSizeScale(d.txn_amt_ttl);})
                       .attr("marker-end", "url(#end)");

           //draw circles for the nodes
           let node = g.append("g")
                       .attr("class", "nodes")
                       .selectAll("circle")
                       .data(new_nodes)
                       .enter()
                       .append("circle")
                       .attr("r", 10)
                       .attr("fill", function(d){if(d.acct_nbr == alert_acct){return '#fefd01'}else if(d.alert == 'T'){return "#cc3300"}else if(d.bank_code == '他行'){return "#FF9966"}else{return '#d2a62c'}})
                       .on("mouseover", mouseOver(.1))
                       .on("mouseout", mouseOut)
                       .on("click", function(d){
                         return d3.select(this).selectAll('.labels').attr('opacity',1);
                       });

           //add text labels
           // let text = g.append("g")
           //             .attr("class", "labels")
           //             .selectAll("text")
           //             .data(new_nodes)
           //             .enter().append("text")
           //             .style("text-anchor","middle")
           //             .style("font-weight", "bold")
           //             .style("pointer-events", "none")
           //             .attr("dy", ".35em")
           //             .text(d=>d.acct_nbr)
           //             .attr('opacity', 0);

           //add drag capabilities
           let drag_handler = d3.drag()
                                 .on("start", drag_start)
                                 .on("drag", drag_drag)
                                 .on("end", drag_end);
           drag_handler(node);

           //add zoom capabilities
           let zoom_handler = d3.zoom()
                                .on("zoom", zoom_actions);

           zoom_handler(svg);
           //add tick instructions:
           simulation
               .on("tick", tickActions);

           // bring out the dashboard
           dashboardOut(new_nodes,new_links,alert_acct);

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
                 // 
                 // text.attr("x", function(d) { return d.x; })
                 //     .attr("y", function(d) { return d.y; });
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
           new_links.forEach(function(d) {
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


        });
// =============================================================================

      dropdownArray.forEach(dropdown => {
            dropdown.classList.add('closed');
      })
    })
  })

  inputField.addEventListener('focus', () => {
     inputField.placeholder = 'Type to filter';
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

// callback function end
};
// ===================== create the dashboard ==================================
function dashboardOut(l,g,a){

  d3.selectAll("table").remove();
  d3.selectAll(".text-tip").remove();
  let txn_records = consolidate_data(g);

  //create detail transaction records dashboard
  let dashboard = d3.select("#text-tip");
                    // .append("section")
                    // .attr("class", 'text-tip')
                    // .style("width", 400)
                    // .style('height', 500)
                    // .style("overflow", "scroll");


  dashboard
      .transition()
      .duration(1000);
  svg
      .transition()
      .duration(1250);

  //DASHBOARD INFORMATION
  d3.select('#txn_records_title')
            .append("span")
            .attr("class", "text-tip")
            .html("<p>關注帳戶: " + a + "</p>")
            .style("display", "inline-block")
            .style("color", "#f5f5f5")
            .style("font-family", 'Noto Sans TC')
            .style("font-size", "16px");

  let table = dashboard.append('table')
                       .attr("class", "table table-condensed table-striped")
                       .style('table-layout', 'fixed');
  let thead = table.append("thead").append("tr").style('display', 'block').attr('width', '100%');
  let tbody = table.append("tbody").style('display', 'block').attr('width', '100%').style('height','380px').style('overflow', 'scroll');
  let columns = ['L1帳戶','L2帳戶', '交易金額', '轉出金額', '轉出次數', '轉入金額', '轉入次數'];

  let header = thead
                   .selectAll("th")
                   .data(columns)
                   .enter()
                   .append("th")
                   .text(function(d){ return d;})
                    .style("display", "inline-block")
                    .style("color", "#f5f5f5")
                    .style("padding", "10px 0px")
                    .style("font-family", 'Noto Sans TC')
                    .style("font-size", "10px")
                    .style('width', function(d){if(d==='L1帳戶' || d==='L2帳戶'){return '25%'}else if(d==='交易金額'|| d==='轉入金額'|| d==='轉出金額'){return '12%'}else{return '7%'}})
                    .style('text-align', 'center')
                    .style('border-bottom', '1px solid #ddd')
                       .on("click", function(d){
                          if (d == "L1帳戶"){
                            rows.sort(function(a, b) {
                              if (a['acct_nbr'] < b['acct_nbr']){ return -1; }
                             if (a['acct_nbr'] > b['acct_nbr']){ return 1; }
                              else{ return 0; }
                            });
                            }
                          else if (d == "L2帳戶"){
                              rows.sort(function(a, b) {
                                if (a['txn_acct'] < b['txn_acct']){ return -1; }
                               if (a['txn_acct'] > b['txn_acct']){ return 1; }
                                else{ return 0; }
                              });
                              }
                          else if (d == "交易金額"){
                            rows.sort(function(a, b){
                            return b['ttl_txn_amt'] - a['ttl_txn_amt'];
                            })
                            }
                          else if (d == "轉出次數"){
                            rows.sort(function(a, b){
                            return b['outdegree_cnt'] - a['outdegree_cnt'];
                            })
                            }
                          else if (d == "轉出金額"){
                            rows.sort(function(a, b){
                            return b['outdegree_amt'] - a['outdegree_amt'];
                            })
                            }
                          else if (d == "轉入金額"){
                            rows.sort(function(a, b){
                            return b['indegree_amt'] - a['indegree_amt'];
                            })
                            }
                          else {
                           rows.sort(function(a, b){
                           return b['indegree_cnt'] - a["indegree_cnt"];
                           })
                           }
                           });


  let rows = tbody.selectAll("tr").attr('width', '100%')
                  .data(txn_records)
                  .enter()
                  .append("tr")
                  .attr('width', '100%')
                  .style('display', 'block');
                   // .on('mouseover', function(d){
                   //    let linkedByIndex_tr = {};
                   //    d.forEach(function(d) {
                   //        linkedByIndex_tr[d.source.index + "," + d.target.index] = 1;
                   //    });
                   //    node.style("fill-opacity", function(o) {
                   //      thisOpacity = isConnected2(d, o) ? 1 : .1;
                   //      return thisOpacity;
                   //    });
                   //    // text.text(function(o) {
                   //    //   return isConnected(d, o) ? o.acct_nbr : "";
                   //    // })
                   //
                   //  });

  let cells = rows.selectAll("td")
                  .data(function(row){
                              return columns.map(function (column) {
                                if(column === "L1帳戶"){
                                  return {column: column, value: row['acct_nbr']};
                                }
                                else if(column === "L2帳戶"){
                                  return {column: column, value: row['txn_acct']};
                                }
                                else if (column === "交易金額") {
                                  return {column: column, value: formatNumber(row['ttl_txn_amt'])};
                                }
                                else if (column === "轉出次數") {
                                  return {column: column, value: formatNumber(row['outdegree_cnt'])};
                                }
                                else if (column === "轉出金額") {
                                  return {column: column, value: formatNumber(row['outdegree_amt'])};
                                }
                                else if (column === "轉入次數") {
                                    return {column: column, value: formatNumber(row['indegree_cnt'])};
                                }
                                else if (column === "轉入金額"){
                                  return {column: column, value: formatNumber(row['indegree_amt'])};
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
                  .style("font-size", "10px")
                  .style('width', function(d){ if(d.column ==='L1帳戶' || d.column==='L2帳戶'){return '25%'}
                                               else if(d.column==='交易金額'|| d.column==='轉入金額'|| d.column ==='轉出金額'){return '12%'}
                                               else{return '7%'} })
                  .style('text-align', 'center')
                  .style('border-bottom', '1px solid #ddd');

};
// ===================== create table content ==================================
function consolidate_data(records){
  // sum up all transaction targets info
  let txn_info = {},
      columns = {},
      sumCols = ['indegree_amt', 'outdegree_amt', 'indegree_cnt', 'outdegree_cnt'];
  let uni_acct_nbr = [...new Set(records.map(x=>x.acct_nbr))]
  let next = [];

  $.each(uni_acct_nbr, function(index, acct){
    let result = records.filter(obj => { return obj.acct_nbr === acct });
    let temp = {}
    $.each(result, function(index, obj){
      if (!temp[obj['txn_acct']]) {
              temp[obj['txn_acct']] = {};
              temp[obj['txn_acct']]['acct_nbr'] = acct;
          }
      $.each(sumCols, function (index, col) {
              if (!temp[obj['txn_acct']][col]) {
                  temp[obj['txn_acct']][col] = 0;
              }
              if (!columns[col]) {
                  columns[col] = 0;
              }
              var val = parseFloat(obj[col]);
              if (!isNaN(val)) {
                  temp[obj['txn_acct']][col] += val;
                  columns[col] += val;
              }
      });
     })
     if(!(temp in next)){
       next.push(temp);
     }
  })
  let final = [];
  $.each(next, function(index, obj){
    $.each(obj, function(index, value){
      value.txn_acct = index;
      value.ttl_txn_amt = value.indegree_amt + value.outdegree_amt;
      value.ttl_txn_cnt = value.indegree_cnt + value.outdegree_cnt;
      final.push(value);
   })
  })


  return final;
}

// ===================== format numbers in the table ===========================
function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}
// ========================= FORMAT NUMBER BY UNIT =============================
function FormatLongNumber(value) {
  if(value == 0) {
    return 0;
  }
  else
  {
      // hundreds
      if(value <= 999){
        return Math.floor(value);
      }
      // thousands
      else if(value >= 1000 && value <= 999999){
        return Math.floor((value / 1000)) + 'K';
      }
      // millions
      else if(value >= 1000000 && value <= 999999999){
        return Math.floor((value / 1000000)) + 'M';
      }
      // billions
      else if(value >= 1000000000 && value <= 999999999999){
        return Math.floor((value / 1000000000)) + 'B';
      }
      else
        return Math.floor(value);
  }
}
// ========================= return links and nodes ============================
function collect_graph(l, n, acct=null, t=0) {
  // links, nodes, selected_acct, threshold
  let new_graph = []; // links of the selected alert account transaction targets
  let acct_list = []; // the level two account number list + alert account
  let new_list = []; // final all nodes
  let final_links = [];

  // find level2 transaction records of alert acoount number
  if(acct!==null){
    for(let i=0; i<l.length; i++){
      if(l[i].acct_nbr === acct){
        if(!(l[i] in new_graph)){
          new_graph.push(l[i]);
        }
      }
    };
  }else{
    new_graph = l;
  }

  // filter links by the given threshold
  new_graph.forEach( function (d) {
    if (d.txn_amt_ttl >= t) {
      if(!(d in final_links)){
        final_links.push(d);}
      };
  });

  // push level2 transaction targets into an array
  final_links.forEach(function(element){
    if(!(element.txn_acct in acct_list)){
      acct_list.push(element.txn_acct);
    }
  })
  acct_list = [...new Set(acct_list)];

  // push level3 transaction records into
  for(let i=0; i<l.length; i++){
    for(let n=0; n<acct_list.length; n++){
     if(l[i].acct_nbr === acct_list[n]){
       if(!(l[i] in final_links)){
         final_links.push(l[i]);
        }
      }
    }
  };

  // push level3 transaction targets into an array
  final_links.forEach(function(element){
    if(!(element.txn_acct in acct_list)){
      acct_list.push(element.txn_acct);
    }
  })

  acct_list = [...new Set(acct_list)];
  if(acct!==null){
    if(!(acct in acct_list)){
      acct_list.push(acct);
    }
  };
  acct_list = [...new Set(acct_list)];
  // node list
  n.forEach(function(ele){
    acct_list.forEach(function(element){
      if(element === ele.acct_nbr){
        if(!(ele in new_list)){
          new_list.push(ele);
        }
      }
    })
  });

  return [new_list,final_links];
}
//==============================================================================
