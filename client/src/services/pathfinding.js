/**
 * Haversine distance formula — returns distance in km
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Build a graph from nodes (libraries + student position)
 * Returns adjacency list: { nodeId: [{ to: nodeId, weight: km }] }
 */
export function buildGraph(nodes) {
  const graph = {};
  for (const n of nodes) {
    graph[n.id] = [];
    for (const m of nodes) {
      if (n.id !== m.id) {
        const dist = haversineDistance(n.lat, n.lng, m.lat, m.lng);
        graph[n.id].push({ to: m.id, weight: dist });
      }
    }
  }
  return graph;
}

/**
 * Dijkstra's Algorithm
 * graph: { nodeId: [{ to, weight }] }
 * Returns { distances, previousNodes }
 */
export function dijkstra(graph, startNode) {
  const distances = {};
  const previousNodes = {};
  const visited = new Set();
  const nodes = Object.keys(graph);

  // Initialize
  for (const node of nodes) {
    distances[node] = node === startNode ? 0 : Infinity;
    previousNodes[node] = null;
  }

  // Priority queue (simple array-based min-heap simulation)
  const queue = [{ node: startNode, dist: 0 }];

  while (queue.length) {
    // Get node with smallest distance
    queue.sort((a, b) => a.dist - b.dist);
    const { node: current } = queue.shift();

    if (visited.has(current)) continue;
    visited.add(current);

    for (const { to, weight } of graph[current] || []) {
      const newDist = distances[current] + weight;
      if (newDist < distances[to]) {
        distances[to] = newDist;
        previousNodes[to] = current;
        queue.push({ node: to, dist: newDist });
      }
    }
  }

  return { distances, previousNodes };
}

/**
 * Reconstruct path from Dijkstra previousNodes
 */
export function reconstructPath(previousNodes, startNode, endNode) {
  const path = [];
  let current = endNode;
  while (current !== null) {
    path.unshift(current);
    current = previousNodes[current];
    if (current === startNode) {
      path.unshift(startNode);
      break;
    }
  }
  return path;
}

/**
 * A* Algorithm
 * graph: adjacency list
 * nodesMap: { nodeId: { lat, lng } } for heuristic
 * Returns path array of nodeIds
 */
export function aStar(graph, start, goal, nodesMap) {
  const openSet = new Set([start]);
  const closedSet = new Set();
  const cameFrom = {};

  const gScore = {};
  const fScore = {};
  const nodes = Object.keys(graph);
  for (const n of nodes) {
    gScore[n] = Infinity;
    fScore[n] = Infinity;
  }
  gScore[start] = 0;
  fScore[start] = haversineDistance(
    nodesMap[start].lat, nodesMap[start].lng,
    nodesMap[goal].lat, nodesMap[goal].lng
  );

  while (openSet.size > 0) {
    // Current = node in openSet with lowest fScore
    let current = null;
    let lowestF = Infinity;
    for (const node of openSet) {
      if (fScore[node] < lowestF) {
        lowestF = fScore[node];
        current = node;
      }
    }

    if (current === goal) {
      // Reconstruct path
      const path = [goal];
      let c = goal;
      while (cameFrom[c]) {
        c = cameFrom[c];
        path.unshift(c);
      }
      return path;
    }

    openSet.delete(current);
    closedSet.add(current);

    for (const { to, weight } of graph[current] || []) {
      if (closedSet.has(to)) continue;
      const tentativeG = gScore[current] + weight;
      if (tentativeG < gScore[to]) {
        cameFrom[to] = current;
        gScore[to] = tentativeG;
        fScore[to] = gScore[to] + haversineDistance(
          nodesMap[to].lat, nodesMap[to].lng,
          nodesMap[goal].lat, nodesMap[goal].lng
        );
        openSet.add(to);
      }
    }
  }

  return []; // No path found
}

async function fetchRoadRoute(studentLat, studentLng, targetLat, targetLng) {
  const url = `https://router.project-osrm.org/route/v1/driving/${studentLng},${studentLat};${targetLng},${targetLat}?overview=full&geometries=geojson&steps=false`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Road routing failed with status ${response.status}`);
  }

  const data = await response.json();
  const route = data.routes?.[0];
  if (!route?.geometry?.coordinates?.length) {
    throw new Error('No road route found');
  }

  return {
    coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
  };
}

async function fetchWalkingRoute(studentLat, studentLng, targetLat, targetLng) {
  const url = `https://router.project-osrm.org/route/v1/foot/${studentLng},${studentLat};${targetLng},${targetLat}?overview=full&geometries=geojson&steps=false`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Walking routing failed with status ${response.status}`);
  }

  const data = await response.json();
  const route = data.routes?.[0];
  if (!route?.geometry?.coordinates?.length) {
    throw new Error('No walking route found');
  }

  return {
    coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
  };
}

function buildFallbackRoute(studentLat, studentLng, targetLat, targetLng) {
  const coords = [
    [studentLat, studentLng],
    [targetLat, targetLng],
  ];
  const distanceKm = haversineDistance(studentLat, studentLng, targetLat, targetLng);

  return {
    coords,
    distanceKm,
    durationMin: (distanceKm / 30) * 60,
  };
}

/**
 * Full navigation: given student position + libraries,
 * find optimal road route to target library.
 */
export async function findOptimalRoute(studentLat, studentLng, libraries, targetLibId) {
  const studentNode = { id: 'student', lat: studentLat, lng: studentLng };
  const libNodes = libraries.map(lib => ({
    id: lib._id,
    lat: lib.location.lat,
    lng: lib.location.lng
  }));
  const allNodes = [studentNode, ...libNodes];
  const graph = buildGraph(allNodes);
  const nodesMap = {};
  for (const n of allNodes) nodesMap[n.id] = { lat: n.lat, lng: n.lng };

  const targetLibrary = libraries.find(lib => lib._id === targetLibId);
  if (!targetLibrary) {
    throw new Error('Target library not found');
  }

  let roadRoute;
  let walkingRoute;
  try {
    roadRoute = await fetchRoadRoute(
      studentLat,
      studentLng,
      targetLibrary.location.lat,
      targetLibrary.location.lng
    );
    walkingRoute = await fetchWalkingRoute(
      studentLat,
      studentLng,
      targetLibrary.location.lat,
      targetLibrary.location.lng
    );
  } catch (err) {
    const fallback = buildFallbackRoute(
      studentLat,
      studentLng,
      targetLibrary.location.lat,
      targetLibrary.location.lng
    );
    roadRoute = fallback;
    walkingRoute = fallback;
  }

  const straightPath = aStar(graph, 'student', targetLibId, nodesMap);
  const straightCoords = straightPath.map(id => [nodesMap[id].lat, nodesMap[id].lng]);

  return {
    routeCoords: roadRoute.coords,
    roadCoords: roadRoute.coords,
    straightCoords,
    aStarCoords: roadRoute.coords,
    dijkstraCoords: straightCoords,
    totalDistance: Math.round(roadRoute.distanceKm * 100) / 100,
    walkingDistance: Math.round(walkingRoute.distanceKm * 100) / 100,
    walkingTime: Math.round(walkingRoute.durationMin),
    drivingTime: Math.round(roadRoute.durationMin),
  };
}
