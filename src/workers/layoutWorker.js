// src/workers/layoutWorker.js
import Graph from 'graphology';
import {assign} from 'graphology-layout-forceatlas2';

self.onmessage = ({ data }) => {
  const graphData = data.graphData;      // l’oggetto plain JSON
  // 1) ricostruisci un vero Graphology Graph
  const graph = new Graph();
  graph.import(graphData);

  // 2) esegui ForceAtlas2 “in place”
  assign(graph, {
    settings: {
      gravity: 1,
      scalingRatio: 2,
      slowDown: 1
    },
    iterations: 100
  });

  // 3) estrae solo le nuove posizioni
  const positions = {};
  graph.forEachNode((node, attr) => {
    positions[node] = { x: attr.x, y: attr.y };
  });

  // 4) rimanda al main thread
  self.postMessage({ positions });
};
