import React from 'react';

function SourcesPanel({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="panel sources-panel">
      <h2 className="panel-title">📚 Knowledge Sources</h2>
      <p className="sources-description">
        This creature was generated using the following knowledge documents:
      </p>
      <ul className="sources-list">
        {sources.map((source) => (
          <li key={source} className="source-item">
            <span className="source-icon">📄</span>
            <span className="source-name">{source}</span>
          </li>
        ))}
      </ul>
      <p className="sources-note">
        ✅ Knowledge retrieved from Azure AI Search / Foundry IQ semantic search.
      </p>
    </div>
  );
}

export default SourcesPanel;
