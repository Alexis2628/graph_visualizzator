import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';
import { forceManyBody, forceLink, forceCenter } from 'd3-force-3d';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';

// Palette contrastata per cluster
const colorScale = scaleOrdinal(schemeCategory10);

async function init() {
  // 1) Carica i dati
  const { nodes, edges } = await fetch('/data/graph_es.json').then(r => {
    if (!r.ok) throw new Error(`Fetch graph.json: ${r.status}`);
    return r.json();
  });

  // 2) Prepara graphData includendo name/description
  const graphData = {
    nodes: nodes.map(n => ({
      id:          n.id,
      cluster:     n.cluster,
      name:        n.name,
      description: n.description
    })),
    links: edges.map(e => ({ source: e.source, target: e.target }))
  };

  // 3) Inizializza il 3D-graph
  const Graph3D = ForceGraph3D()(document.getElementById('graph3d'))
    .graphData(graphData)
    .backgroundColor('#fafafa')

    // colorazione personalizzata
    .nodeColor(node => colorScale(node.cluster))
    .nodeThreeObject(node => {
      const geo = new THREE.SphereGeometry(4);
      const mat = new THREE.MeshPhongMaterial({ color: colorScale(node.cluster) });
      return new THREE.Mesh(geo, mat);
    })

    .linkColor(link =>
      link.source.cluster === link.target.cluster
        ? colorScale(link.source.cluster)
        : '#555'
    )
    .linkWidth(() => 1.0)
    .linkOpacity(0.8)
    .enableNavigationControls(true)
    .d3Force('charge', forceManyBody().strength(-80))
    .d3Force('link',  forceLink().id(d => d.id).distance(60).strength(0.8))
    .d3Force('center', forceCenter());

  // 4) Gestione del pannello info
  const infoPanel  = document.getElementById('info-panel');
  const infoTitle  = document.getElementById('info-title');
  const infoDesc   = document.getElementById('info-desc');
  const infoClose  = document.getElementById('info-close');

  // Mostra i dettagli del nodo nel pannello
  Graph3D.onNodeClick(node => {
    // 1) Mostra info
    infoTitle.textContent = node.name;
    infoDesc.textContent  = node.description;
    infoPanel.style.display = 'block';
  
    // 2) Pan verso il nodo mantenendo la stessa Z (niente zoom in/out)
    const camPos = Graph3D.cameraPosition();        // getter: restituisce {x,y,z}
    Graph3D.cameraPosition(
      { x: node.x, y: node.y, z: camPos.z },       // nuova posizione
      node,                                        // lookAt
      500                                          // ms transition
    );
  });

  // Chiudi il pannello
  infoClose.addEventListener('click', () => {
    infoPanel.style.display = 'none';
  });

  // Cliccando fuori dal nodo (sullo stage) chiudi
  Graph3D.onBackgroundClick(() => {
    infoPanel.style.display = 'none';
  });
}

init().catch(console.error);
