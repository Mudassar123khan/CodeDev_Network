import React, { useState, useEffect, useContext } from 'react';
import { getAllContacts, updateContactStatus, deleteContact } from '../../api/admin.api';
import { Context } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import '../Manage.css';

export default function MessagesManage() {
  const { url, token } = useContext(Context);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal State
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await getAllContacts(url, token);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await updateContactStatus(url, token, id, newStatus);
      if (res.data.success) {
        toast.success('Status updated');
        setMessages((prev) =>
          prev.map((msg) => (msg._id === id ? { ...msg, status: newStatus } : msg))
        );
        if (selectedMsg?._id === id) {
          setSelectedMsg((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await deleteContact(url, token, id);
      if (res.data.success) {
        toast.success('Message deleted');
        setMessages((prev) => prev.filter((msg) => msg._id !== id));
        if (selectedMsg?._id === id) {
          setShowModal(false);
          setSelectedMsg(null);
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete message');
    }
  };

  const openModal = (msg) => {
    setSelectedMsg(msg);
    setShowModal(true);
  };

  // Filtering
  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || msg.type === filterType;
    const matchesStatus = filterStatus === 'all' || msg.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="manage-container">
      <div className="manage-header">
        <h2>Manage Messages & Suggestions</h2>
        <button className="secondary-btn" onClick={fetchMessages}>
          Refresh
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search name, email, subject..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            minWidth: '240px',
            fontSize: '14px',
          }}
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
          }}
        >
          <option value="all">All Categories</option>
          <option value="query">Query</option>
          <option value="suggestion">Suggestion</option>
          <option value="bug_report">Bug Report</option>
          <option value="other">Other</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
          }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="resolved">Resolved</option>
        </select>

        <span style={{ fontSize: '13px', color: '#64748b', marginLeft: 'auto' }}>
          Total: {filteredMessages.length}
        </span>
      </div>

      {/* Messages Table */}
      <div className="table-responsive">
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
            Loading messages...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
            No messages found.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Sender</th>
                <th>Category</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map((msg) => (
                <tr key={msg._id}>
                  <td style={{ fontSize: '13px', whiteSpace: 'nowrap', color: '#64748b' }}>
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{msg.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{msg.email}</div>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        background:
                          msg.type === 'suggestion'
                            ? '#fef3c7'
                            : msg.type === 'bug_report'
                            ? '#fee2e2'
                            : '#f1f5f9',
                        color:
                          msg.type === 'suggestion'
                            ? '#b45309'
                            : msg.type === 'bug_report'
                            ? '#b91c1c'
                            : '#475569',
                      }}
                    >
                      {msg.type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.subject}
                  </td>
                  <td>
                    <select
                      value={msg.status || 'pending'}
                      onChange={(e) => handleStatusChange(msg._id, e.target.value)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 500,
                        border: '1px solid #cbd5e1',
                        background:
                          msg.status === 'resolved'
                            ? '#dcfce7'
                            : msg.status === 'in_review'
                            ? '#e0e7ff'
                            : '#fff',
                        color:
                          msg.status === 'resolved'
                            ? '#15803d'
                            : msg.status === 'in_review'
                            ? '#4338ca'
                            : '#334155',
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_review">In Review</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className="action-btn edit"
                      onClick={() => openModal(msg)}
                      title="View full message"
                    >
                      View
                    </button>
                    <a
                      href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                      className="action-btn"
                      style={{ color: '#059669', textDecoration: 'none' }}
                      title="Reply via Email"
                    >
                      Reply
                    </a>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDelete(msg._id)}
                      title="Delete message"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Details Modal */}
      {showModal && selectedMsg && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Message Details</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div>
                <strong>Sender:</strong> {selectedMsg.name} (
                <a href={`mailto:${selectedMsg.email}`} style={{ color: '#2563eb' }}>
                  {selectedMsg.email}
                </a>
                )
              </div>

              <div>
                <strong>Category:</strong>{' '}
                <span style={{ textTransform: 'capitalize' }}>
                  {selectedMsg.type?.replace('_', ' ')}
                </span>
              </div>

              <div>
                <strong>Date:</strong> {new Date(selectedMsg.createdAt).toLocaleString()}
              </div>

              <div>
                <strong>Status:</strong>{' '}
                <select
                  value={selectedMsg.status || 'pending'}
                  onChange={(e) => handleStatusChange(selectedMsg._id, e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    marginLeft: '6px',
                    fontSize: '13px',
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="in_review">In Review</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div>
                <strong>Subject:</strong> {selectedMsg.subject}
              </div>

              <div>
                <strong>Message:</strong>
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    marginTop: '6px',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                    maxHeight: '260px',
                    overflowY: 'auto',
                  }}
                >
                  {selectedMsg.message}
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <a
                href={`mailto:${selectedMsg.email}?subject=Re: ${encodeURIComponent(selectedMsg.subject)}`}
                className="primary-btn"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                Reply via Email
              </a>
              <button className="secondary-btn" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
