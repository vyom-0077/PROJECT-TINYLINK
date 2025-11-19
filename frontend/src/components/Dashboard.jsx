import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function Dashboard() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");

  const [formData, setFormData] = useState({
    target_url: "",
    code: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/links`);
      setLinks(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load links");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess(false);
    setFormLoading(true);

    if (!formData.target_url) {
      setFormError("Please enter a URL");
      setFormLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/links`, formData);
      setFormSuccess(true);
      setFormData({ target_url: "", code: "" });
      fetchLinks();
      setTimeout(() => {
        setShowModal(false);
        setFormSuccess(false);
      }, 1500);
    } catch (err) {
      if (err.response?.status === 409) {
        setFormError("This code is already taken. Please choose another.");
      } else if (err.response?.data?.error) {
        setFormError(err.response.data.error);
      } else {
        setFormError("Failed to create link. Please try again.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (code) => {
    if (!confirm(`Delete link "${code}"?`)) return;

    try {
      await axios.delete(`${API_URL}/api/links/${code}`);
      fetchLinks();
    } catch (err) {
      alert("Failed to delete link");
      console.error(err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const filteredLinks = links
    .filter(
      (link) =>
        link.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.target_url.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "clicks") return b.total_clicks - a.total_clicks;
      if (sortBy === "code") return a.code.localeCompare(b.code);
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  const truncateUrl = (url, maxLength = 50) => {
    return url.length > maxLength ? url.substring(0, maxLength) + "..." : url;
  };

  return (
    <div className="container">
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>Dashboard</h2>
          <button
            className="btn btn-primary cursor-target display"
            onClick={() => setShowModal(true)}
          >
            + Add New Link
          </button>
        </div>

        <div className="filters">
          <input
            type="text"
            placeholder="Search by code or URL..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading && <div className="loading">Loading links...</div>}

        {error && <div className="error-message">{error}</div>}

        {!loading && filteredLinks.length === 0 && !searchTerm && (
          <div className="empty-state">
            <p>No links yet. Create your first shortened link!</p>
          </div>
        )}

        {!loading && filteredLinks.length === 0 && searchTerm && (
          <div className="empty-state">
            <p>No links match your search.</p>
          </div>
        )}

        {!loading && filteredLinks.length > 0 && (
          <div className="table-container">
            <table className="links-table ">
              <thead>
                <tr>
                  <th>Short Code</th>
                  <th>Target URL</th>
                  <th>Clicks</th>
                  <th>Last Clicked</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLinks.map((link) => (
                  <tr key={link.id}>
                    <td>
                      <code className="code-badge">{link.code}</code>
                      <button
                        className="btn-icon cursor-target"
                        onClick={() =>
                          copyToClipboard(`${API_URL}/${link.code}`)
                        }
                        title="Copy link"
                      >
                        Copy!!
                      </button>
                    </td>
                    <td>
                      <a
                        href={link.target_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="target-url"
                        title={link.target_url}
                      >
                        {truncateUrl(link.target_url)}
                      </a>
                    </td>
                    <td className="text-center">{link.total_clicks}</td>
                    <td>{formatDate(link.last_clicked)}</td>
                    <td className="actions">
                      <Link
                        to={`/code/${link.code}`}
                        className="btn btn-sm btn-secondary cursor-target"
                      >
                        Stats
                      </Link>
                      <button
                        className="btn btn-sm btn-danger cursor-target"
                        onClick={() => handleDelete(link.code)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add New Link</h3>
                <button
                  className="close-btn cursor-target"
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="form">
                <div className="form-group">
                  <label htmlFor="target_url">Target URL *</label>
                  <input
                    type="url"
                    id="target_url"
                    placeholder="https://example.com"
                    value={formData.target_url}
                    onChange={(e) =>
                      setFormData({ ...formData, target_url: e.target.value })
                    }
                    required
                    disabled={formLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="code">Custom Code (optional)</label>
                  <input
                    type="text"
                    id="code"
                    placeholder="mycode (6-8 characters)"
                    pattern="[A-Za-z0-9]{6,8}"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    disabled={formLoading}
                  />
                  <small>Leave empty to generate random code</small>
                </div>

                {formError && <div className="error-message">{formError}</div>}
                {formSuccess && (
                  <div className="success-message">
                    Link created successfully!
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary cursor-target"
                    onClick={() => setShowModal(false)}
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary cursor-target"
                    disabled={formLoading}
                  >
                    {formLoading ? "Creating..." : "Create Link"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
