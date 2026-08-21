import React, { useState } from 'react';
import { IncidentGraph } from '../genlayer/types';

interface GraphWorkspaceProps {
  graph: IncidentGraph;
  selectedNodeId: string | null;
  onSelectNode: (projectId: string) => void;
  onTriggerTriage?: (projectId: string) => void;
  onAcknowledge?: (projectId: string) => void;
  isTriageAllowed?: boolean;
  isAckAllowed?: boolean;
}

export const GraphWorkspace: React.FC<GraphWorkspaceProps> = ({
  graph,
  selectedNodeId,
  onSelectNode,
  onTriggerTriage,
  onAcknowledge,
  isTriageAllowed = false,
  isAckAllowed = false,
}) => {
  const [viewMode, setViewMode] = useState<'visual' | 'table'>('visual');

  const selectedNode = graph.nodes.find((n) => n.project_id === selectedNodeId) || null;

  const getClassificationBadgeClass = (classification: string) => {
    switch (classification) {
      case 'AFFECTED':
        return 'badge-quarantine';
      case 'UNAFFECTED':
        return 'badge-safe';
      case 'UNCERTAIN':
        return 'badge-uncertain';
      default:
        return 'badge-unassessed';
    }
  };

  const getNodeFill = (classification: string) => {
    switch (classification) {
      case 'AFFECTED':
        return 'var(--color-quarantine-muted)';
      case 'UNAFFECTED':
        return 'var(--color-safe-muted)';
      case 'UNCERTAIN':
        return 'var(--color-uncertain-muted)';
      default:
        return 'var(--color-paper-sunken)';
    }
  };

  const getNodeStroke = (classification: string) => {
    switch (classification) {
      case 'AFFECTED':
        return 'var(--color-quarantine)';
      case 'UNAFFECTED':
        return 'var(--color-safe)';
      case 'UNCERTAIN':
        return 'var(--color-uncertain)';
      default:
        return 'var(--color-border)';
    }
  };

  // Compute 2D node layout positions deterministically
  const totalNodes = graph.nodes.length;
  const layoutWidth = 720;
  const layoutHeight = 360;
  const centerX = layoutWidth / 2;
  const centerY = layoutHeight / 2;
  const radius = Math.min(layoutWidth, layoutHeight) * 0.35;

  const nodePositions = new Map<string, { x: number; y: number }>();
  graph.nodes.forEach((node, index) => {
    if (totalNodes === 1) {
      nodePositions.set(node.project_id, { x: centerX, y: centerY });
    } else {
      const angle = (index / totalNodes) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      nodePositions.set(node.project_id, { x, y });
    }
  });

  return (
    <section className="card graph-workspace-card" aria-labelledby="graph-workspace-heading">
      <div className="workspace-header">
        <div>
          <h2 id="graph-workspace-heading" className="workspace-title">
            Dependency Claim Graph
          </h2>
          <p className="workspace-subtitle">
            {graph.nodes.length} registered project nodes, {graph.edges.length} declared dependency edges
          </p>
        </div>

        <div className="view-toggle-group" role="group" aria-label="Graph View Mode">
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'visual' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('visual')}
          >
            Visual Graph
          </button>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('table')}
          >
            Accessible Table
          </button>
        </div>
      </div>

      {graph.nodes.length === 0 ? (
        <div className="empty-graph-state">
          <div className="empty-icon" aria-hidden="true">🕸</div>
          <h3>No Dependency Claims Registered</h3>
          <p>Maintainers have not registered project claims for this incident yet.</p>
        </div>
      ) : viewMode === 'visual' ? (
        <div className="graph-layout">
          {/* Visual SVG Graph */}
          <div className="svg-container" aria-label="Interactive Dependency Graph Canvas">
            <svg
              viewBox={`0 0 ${layoutWidth} ${layoutHeight}`}
              className="dependency-svg"
              role="img"
              aria-label="Node and edge topological diagram"
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="22"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-ink-muted)" />
                </marker>
              </defs>

              {/* Render Directed Edges */}
              {graph.edges.map((edge, idx) => {
                const sourcePos = nodePositions.get(edge.from_project);
                const targetPos = nodePositions.get(edge.to_project);
                if (!sourcePos || !targetPos) return null;

                return (
                  <g key={`edge-${edge.from_project}-${edge.to_project}-${idx}`}>
                    <line
                      x1={sourcePos.x}
                      y1={sourcePos.y}
                      x2={targetPos.x}
                      y2={targetPos.y}
                      stroke="var(--color-ink-muted)"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      markerEnd="url(#arrow)"
                    />
                  </g>
                );
              })}

              {/* Render Node Circles */}
              {graph.nodes.map((node) => {
                const pos = nodePositions.get(node.project_id);
                if (!pos) return null;
                const isSelected = node.project_id === selectedNodeId;

                return (
                  <g
                    key={`node-${node.project_id}`}
                    className={`svg-node-group ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectNode(node.project_id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Node ${node.project_id}, package ${node.declared_package}, status ${node.classification}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectNode(node.project_id);
                      }
                    }}
                  >
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isSelected ? 26 : 22}
                      fill={getNodeFill(node.classification)}
                      stroke={isSelected ? 'var(--color-cobalt)' : getNodeStroke(node.classification)}
                      strokeWidth={isSelected ? 3 : 2}
                      className="node-circle"
                    />
                    <text
                      x={pos.x}
                      y={pos.y + 4}
                      textAnchor="middle"
                      className="svg-node-icon"
                      aria-hidden="true"
                    >
                      {node.classification === 'AFFECTED'
                        ? '⚠'
                        : node.classification === 'UNAFFECTED'
                        ? '✓'
                        : node.classification === 'UNCERTAIN'
                        ? '?'
                        : '○'}
                    </text>
                    <text
                      x={pos.x}
                      y={pos.y + 36}
                      textAnchor="middle"
                      className="svg-node-label"
                    >
                      {node.project_id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Node Inspector Drawer */}
          {selectedNode && (
            <div className="node-inspector" aria-labelledby="node-inspector-title">
              <div className="inspector-header">
                <div>
                  <h3 id="node-inspector-title" className="inspector-title">
                    {selectedNode.project_id}
                  </h3>
                  <div className="inspector-badges">
                    <span className={`badge ${getClassificationBadgeClass(selectedNode.classification)}`}>
                      {selectedNode.classification}
                    </span>
                    <span className="badge badge-action">
                      Action: {selectedNode.recommended_action}
                    </span>
                    {selectedNode.acknowledged && (
                      <span className="badge badge-safe">✓ Acknowledged</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="inspector-body">
                <div className="inspector-field">
                  <span className="field-name">Maintainer Address:</span>
                  <code className="field-val">{selectedNode.maintainer_address}</code>
                </div>
                <div className="inspector-field">
                  <span className="field-name">Declared Package / Version:</span>
                  <span className="field-val">
                    <code>{selectedNode.declared_package}</code> @ <code>{selectedNode.declared_version}</code>
                  </span>
                </div>
                {selectedNode.impact_kind && (
                  <div className="inspector-field">
                    <span className="field-name">Impact Kind:</span>
                    <span className="field-val">{selectedNode.impact_kind}</span>
                  </div>
                )}
                {selectedNode.confidence_band && (
                  <div className="inspector-field">
                    <span className="field-name">Confidence Band:</span>
                    <span className="field-val">{selectedNode.confidence_band}</span>
                  </div>
                )}
                {selectedNode.reason_code && (
                  <div className="inspector-field">
                    <span className="field-name">Reason Code:</span>
                    <code>{selectedNode.reason_code}</code>
                  </div>
                )}

                {selectedNode.triage_notes && (
                  <div className="inspector-notes">
                    <span className="field-name">Validator Consensus Notes:</span>
                    <p className="notes-box">{selectedNode.triage_notes}</p>
                  </div>
                )}

                {selectedNode.acknowledged && selectedNode.acknowledgement_uri && (
                  <div className="inspector-field">
                    <span className="field-name">Remediation Evidence:</span>
                    <a
                      href={selectedNode.acknowledgement_uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="field-link"
                    >
                      {selectedNode.acknowledgement_uri} ↗
                    </a>
                  </div>
                )}
                {selectedNode.acknowledged && selectedNode.acknowledgement_note_hash && (
                  <div className="inspector-field">
                    <span className="field-name">Note Hash:</span>
                    <code className="field-val">{selectedNode.acknowledgement_note_hash}</code>
                  </div>
                )}
              </div>

              <div className="inspector-actions">
                {isTriageAllowed && selectedNode.classification === 'UNASSESSED' && onTriggerTriage && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm btn-block"
                    onClick={() => onTriggerTriage(selectedNode.project_id)}
                  >
                    ⚡ Run AI Consensus Triage
                  </button>
                )}
                {isAckAllowed && !selectedNode.acknowledged && onAcknowledge && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm btn-block"
                    onClick={() => onAcknowledge(selectedNode.project_id)}
                  >
                    ✓ Acknowledge Action
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Accessible Table View */
        <div className="table-responsive">
          <table className="accessible-table" aria-label="Registered dependency claims table">
            <thead>
              <tr>
                <th scope="col">Project ID</th>
                <th scope="col">Package & Version</th>
                <th scope="col">Classification</th>
                <th scope="col">Action</th>
                <th scope="col">Impact</th>
                <th scope="col">Remediation</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {graph.nodes.map((node) => (
                <tr
                  key={node.project_id}
                  className={node.project_id === selectedNodeId ? 'row-selected' : ''}
                >
                  <td>
                    <strong>{node.project_id}</strong>
                  </td>
                  <td>
                    <code>{node.declared_package}</code>@{node.declared_version}
                  </td>
                  <td>
                    <span className={`badge ${getClassificationBadgeClass(node.classification)}`}>
                      {node.classification}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-action">{node.recommended_action}</span>
                  </td>
                  <td>{node.impact_kind || '—'}</td>
                  <td>
                    {node.acknowledged ? (
                      <span className="text-safe">✓ Acknowledged</span>
                    ) : (
                      <span className="text-muted">Pending</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => onSelectNode(node.project_id)}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
