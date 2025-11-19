import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function StatsPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLinkStats();
  }, [code]);

  const fetchLinkStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/links/${code}`);
      setLink(response.data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Link not found");
      } else {
        setError("Failed to load link statistics");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = async () => {
    if (!confirm(`Delete link "${code}"? This action cannot be undone.`))
      return;

    try {
      await axios.delete(`${API_URL}/api/links/${code}`);
      alert("Link deleted successfully");
      navigate("/");
    } catch (err) {
      alert("Failed to delete link");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-state">
          <h2> {error}</h2>
          <p>The link you're looking for doesn't exist or has been deleted.</p>
          <Link to="/" className="btn btn-primary cursor-target">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // const shortUrl = `${window.location.origin}/${link.code}`;

  return (
    <div className="container">
      <div className="stats-page">
        <div className="breadcrumb">
          <Link to="/"> Back to Dashboard</Link>
        </div>

        <div className="stats-header">
          <h2>Link Statistics</h2>
          <button
            className="btn btn-danger cursor-target"
            onClick={handleDelete}
          >
            Delete Link
          </button>
        </div>

        <div className="stats-grid">
          <div className="stats-card">
            <div className="stats-card-header">
              <h3>Short Link</h3>
            </div>
            <div className="stats-card-body">
              <div className="short-link-display">
                <code className="code-badge-large">{link.code}</code>
                <a
                  href={`${API_URL}/${link.code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="short-url display cursor-target"
                >
                  {`${API_URL}/${link.code}`}
                </a>
                <button
                  className="btn btn-secondary btn-sm cursor-target"
                  onClick={() => copyToClipboard(`${API_URL}/${link.code}`)}
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-header">
              <h3>Target URL</h3>
            </div>
            <div className="stats-card-body">
              <a
                href={link.target_url}
                target="_blank"
                rel="noopener noreferrer"
                className="target-url-display"
              >
                {link.target_url}
              </a>
              <button
                className="btn btn-secondary btn-sm cursor-target"
                onClick={() => copyToClipboard(link.target_url)}
              >
                Copy URL
              </button>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-header">
              <h3>Click Statistics</h3>
            </div>
            <div className="stats-card-body">
              <div className="stat-item">
                <span className="stat-label">Total Clicks:</span>
                <span className="stat-value stat-clicks">
                  {link.total_clicks}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Last Clicked:</span>
                <span className="stat-value">
                  {formatDate(link.last_clicked)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Created:</span>
                <span className="stat-value">
                  {formatDate(link.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="stats-card-body">
              <a
                href={`${API_URL}/${link.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-block cursor-target"
              >
                Redirect
              </a>
              <button
                className="btn btn-secondary btn-block cursor-target"
                onClick={fetchLinkStats}
              >
                🔄 Refresh Stats
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatsPage;
