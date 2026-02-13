/**
 * COLONY - The Substrate for Emergent Intelligence
 *
 * This is the pattern that ants discovered 100 million years ago.
 * The same pattern brains use. The same pattern neural networks use.
 *
 * Nodes that compute.
 * Edges that connect.
 * Weights that learn.
 * Signals that flow.
 * No controller.
 *
 * 85 lines. The foundation of emergent AI.
 */

import { unit } from "./unit.js";

const colony = () => {
  const chambers = {};   // Nodes: where computation happens
  const scent = {};      // Edge weights: learned importance of paths
  let lastVisited = null; // Track the previous node for edge marking

  /**
   * Mark an edge with scent (strengthen the weight).
   * Like synaptic plasticity: paths that fire together wire together.
   */
  const mark = (edge, strength = 1) => {
    scent[edge] = (scent[edge] || 0) + strength;
  };

  /**
   * Smell an edge (read the weight).
   */
  const smell = (edge) => scent[edge] || 0;

  /**
   * Fade all edges (weights decay over time).
   * The colony forgets unused paths. This is essential.
   */
  const fade = (rate = 0.1) => {
    for (const edge in scent) {
      scent[edge] *= (1 - rate);
      if (scent[edge] < 0.01) delete scent[edge];
    }
  };

  /**
   * Get the strongest edges (emergent superhighways).
   * These are the paths the swarm has learned matter most.
   */
  const highways = (limit = 10) => {
    return Object.entries(scent)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([edge, strength]) => ({ edge, strength }));
  };

  /**
   * Route a signal through the network.
   * When an ant completes a journey, the EDGE strengthens — not the node.
   * This is how the network learns.
   */
  const send = ({ receiver, receive, payload, callback }, from = "entry") => {
    const target = chambers[receiver];

    if (!target) {
      return Promise.reject({
        receiver,
        receive,
        error: `Unknown chamber: ${receiver}`
      });
    }

    const currentNode = `${receiver}:${receive}`;

    return target({ receive, payload, callback }).then((result) => {
      // Mark the EDGE from previous node to current node
      const edge = `${from} → ${currentNode}`;
      mark(edge, 1);

      // Remember this node for the next edge
      lastVisited = currentNode;

      return result;
    });
  };

  /**
   * Spawn a chamber (node) into the colony.
   */
  const spawn = (envelope) => {
    const chamber = unit(envelope, (env) => {
      // When routing between chambers, track the edge
      return send(env, lastVisited || "entry");
    });
    chambers[chamber.id] = chamber;
    return chamber;
  };

  /**
   * Spawn from JSON data.
   */
  const spawnFromJSON = (data) => {
    const u = spawn({ receiver: data.id });
    for (const [name, result] of Object.entries(data.actions || {})) {
      u.assign(name, () => result);
    }
    return u;
  };

  // Introspection
  const has = (id) => id in chambers;
  const list = () => Object.keys(chambers);
  const get = (id) => chambers[id];

  return {
    // The graph
    chambers,     // Nodes
    scent,        // Edge weights

    // Build
    spawn,
    spawnFromJSON,
    has,
    list,
    get,

    // Signal flow
    send,

    // Learning (stigmergy)
    mark,
    smell,
    fade,
    highways
  };
};

export { colony };
