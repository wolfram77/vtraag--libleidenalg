const fs = require('fs');
const os = require('os');
const path = require('path');

const RGRAPH = /^Reading graph from file \s*.*\/(.*?)\.mtx\.edges/m;
const RORDER = /^Graph has (.+?) vertices and (.+?) edges\./m;
const RTTIME = /^Optimisation took (.+?) ms\./m;
const RMODUL = /^Modularity: (.+)/m;




// *-FILE
// ------

function readFile(pth) {
  var d = fs.readFileSync(pth, 'utf8');
  return d.replace(/\r?\n/g, '\n');
}

function writeFile(pth, d) {
  d = d.replace(/\r?\n/g, os.EOL);
  fs.writeFileSync(pth, d);
}




// *-CSV
// -----

function writeCsv(pth, rows) {
  var cols = Object.keys(rows[0]);
  var a = cols.join()+'\n';
  for (var r of rows)
    a += [...Object.values(r)].map(v => `"${v}"`).join()+'\n';
  writeFile(pth, a);
}




// *-LOG
// -----

function readLogLine(ln, data, state) {
  state = state || {};
  ln = ln.replace(/^\d+-\d+-\d+ \d+:\d+:\d+\s+/, '');
    if (RGRAPH.test(ln)) {
    var [, graph] = RGRAPH.exec(ln);
    if (!data.has(graph)) data.set(graph, []);
    state.graph = graph;
  }
  else if (RORDER.test(ln)) {
    var [, order, size] = RORDER.exec(ln);
    state.order = order;
    state.size  = size;
  }
  else if (RTTIME.test(ln)) {
    var [, total_time] = RTTIME.exec(ln);
    state.total_time = parseFloat(total_time);
  }
  else if (RMODUL.test(ln)) {
    var [, modularity] = RMODUL.exec(ln);
    data.get(state.graph).push(Object.assign({}, state, {
      modularity: parseFloat(modularity),
    }));
  }
  return state;
}

function readLog(pth) {
  var text  = readFile(pth);
  var lines = text.split('\n');
  var data  = new Map();
  var state = null;
  for (var ln of lines)
    state = readLogLine(ln, data, state);
  return data;
}




// PROCESS-*
// ---------

function processCsv(data) {
  var a = [];
  for (var rows of data.values())
    a.push(...rows);
  return a;
}




// MAIN
// ----

function main(cmd, log, out) {
  var data = readLog(log);
  if (path.extname(out)==='') cmd += '-dir';
  switch (cmd) {
    case 'csv':
      var rows = processCsv(data);
      writeCsv(out, rows);
      break;
    case 'csv-dir':
      for (var [graph, rows] of data)
        writeCsv(path.join(out, graph+'.csv'), rows);
      break;
    default:
      console.error(`error: "${cmd}"?`);
      break;
  }
}
main(...process.argv.slice(2));
