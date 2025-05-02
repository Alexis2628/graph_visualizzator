import json
import argparse
import networkx as nx

try:
    import igraph as ig
except ImportError:
    ig = None


def compute_layout(json_input, json_output, iterations=100, dim=3):
    with open(json_input, "r") as f:
        data = json.load(f)

    # Costruisci grafo NetworkX
    G = nx.Graph()
    for n in data.get("nodes", []):
        G.add_node(n["id"])
    for e in data.get("edges", []):
        G.add_edge(e["source"], e["target"])

    n_nodes = G.number_of_nodes()
    n_edges = G.number_of_edges()
    print(f"Graph: {n_nodes} nodi, {n_edges} archi")

    if ig and n_nodes > 2000:
        # Converti in igraph per layout veloce
        edges = list(G.edges())
        g_ig = ig.Graph(edges, directed=False)
        layout = g_ig.layout_fruchterman_reingold(
            dim=dim, niter=iterations, maxdelta=0.1, coord=None
        )
        coords = list(layout.coords)
    else:
        # Caduta di fallback su NetworkX
        coords_dict = nx.spring_layout(G, dim=dim, iterations=iterations, seed=42)
        coords = [coords_dict[n] for n in G.nodes()]

    # Assegna coordinate ai nodi
    for i, n in enumerate(G.nodes()):
        x, y = coords[i][0], coords[i][1]
        data["nodes"][i]["x"] = float(x)
        data["nodes"][i]["y"] = float(y)
        if dim == 3:
            data["nodes"][i]["z"] = float(coords[i][2])

    with open(json_output, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Layout salvato in: {json_output}")
