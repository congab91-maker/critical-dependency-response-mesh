import React from 'react';
import { getContractAddress, getRpcEndpoint } from '../genlayer/client';

export const Footer: React.FC = () => {
  const contractAddr = getContractAddress();
  const rpcUrl = getRpcEndpoint();

  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-col">
          <h3 className="footer-heading">Critical Dependency Response Mesh</h3>
          <p className="footer-desc">
            Decentralized supply-chain vulnerability coordination on GenLayer Studionet. Non-economic,
            consensus-driven triage combining official multi-source CVE intelligence and maintainer claim graphs.
          </p>
        </div>

        <div className="footer-col">
          <h4 className="footer-subheading">Network & Deployment</h4>
          <ul className="footer-list">
            <li>
              <span>Target Network:</span> <strong>GenLayer Studionet (61999)</strong>
            </li>
            <li>
              <span>RPC Endpoint:</span> <code>{rpcUrl}</code>
            </li>
            <li>
              <span>Contract Address:</span>{' '}
              {contractAddr ? (
                <code>{contractAddr}</code>
              ) : (
                <span className="text-muted">Unconfigured (Configure VITE_CONTRACT_ADDRESS)</span>
              )}
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-subheading">Security Invariants</h4>
          <ul className="footer-list">
            <li>
              <span>Consensus Model:</span> <strong>3-Source Official LLM Triage (CISA / NVD / OSV)</strong>
            </li>
            <li>
              <span>Native Upgradability:</span> <strong>Authorized Upgrader Consensus</strong>
            </li>
            <li>
              <span>Graph Invariants:</span> <strong>Max 24 nodes, 8 hops traversal depth</strong>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Critical Dependency Response Mesh • Non-economic Public Infrastructure</p>
      </div>
    </footer>
  );
};
