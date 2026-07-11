import React, { useState, useEffect, useContext } from 'react';
import { getAllInterviews, deleteInterview } from '../../api/admin.api';
import { Context } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import '../Manage.css';

export default function InterviewsManage() {
  const { url, token } = useContext(Context);
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Details Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedExp, setSelectedExp] = useState(null);

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      const res = await getAllInterviews(url, token);
      if (res.data.success) {
        setExperiences(res.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch interview experiences");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this interview experience? This action cannot be undone.")) return;
    try {
      const res = await deleteInterview(url, token, id);
      if (res.data.success) {
        toast.success("Interview experience deleted successfully!");
        fetchExperiences();
        if (selectedExp?._id === id) {
          setShowModal(false);
          setSelectedExp(null);
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete interview experience");
    }
  };

  const openDetailsModal = (exp) => {
    setSelectedExp(exp);
    setShowModal(true);
  };

  // Filter experiences by search term
  const filteredExperiences = experiences.filter(exp => {
    const term = searchTerm.toLowerCase();
    const company = exp.companyDetails?.companyName?.toLowerCase() || '';
    const role = exp.companyDetails?.role?.toLowerCase() || '';
    const candidate = exp.personalInfo?.name?.toLowerCase() || '';
    const email = exp.personalInfo?.email?.toLowerCase() || '';

    return company.includes(term) || role.includes(term) || candidate.includes(term) || email.includes(term);
  });

  return (
    <div className="manage-container">
      <div className="manage-header">
        <h2>Manage Interview Experiences</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by company, role, or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              width: '280px',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {loading ? (
        <p>Loading experiences...</p>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Candidate</th>
                <th>Outcome</th>
                <th>Rounds</th>
                <th>Posted Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExperiences.map(exp => (
                <tr key={exp._id}>
                  <td><strong>{exp.companyDetails?.companyName}</strong></td>
                  <td>{exp.companyDetails?.role}</td>
                  <td>
                    <div>{exp.personalInfo?.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{exp.personalInfo?.email}</div>
                  </td>
                  <td>
                    <span className={`badge ${exp.feedback?.outcome === 'cleared' ? 'admin' : 'user'}`} style={{
                      backgroundColor: exp.feedback?.outcome === 'cleared' ? '#dcfce7' : '#fee2e2',
                      color: exp.feedback?.outcome === 'cleared' ? '#15803d' : '#b91c1c'
                    }}>
                      {exp.feedback?.outcome}
                    </span>
                  </td>
                  <td>{exp.rounds?.length || 0} rounds</td>
                  <td>{new Date(exp.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="action-btn edit" onClick={() => openDetailsModal(exp)}>View</button>
                    <button className="action-btn delete" onClick={() => handleDelete(exp._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {filteredExperiences.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No interview experiences found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {showModal && selectedExp && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '750px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0 }}>Interview Experience Details</h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Personal & Company Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Personal Info */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#334155' }}>Candidate Info</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                    <div><strong>Name:</strong> {selectedExp.personalInfo?.name}</div>
                    <div><strong>Email:</strong> {selectedExp.personalInfo?.email}</div>
                    {selectedExp.personalInfo?.currentRole && (
                      <div><strong>Current Role:</strong> {selectedExp.personalInfo?.currentRole}</div>
                    )}
                    {selectedExp.personalInfo?.gradYear && (
                      <div><strong>Graduation Year:</strong> {selectedExp.personalInfo?.gradYear}</div>
                    )}
                    {selectedExp.personalInfo?.linkedin && (
                      <div>
                        <strong>LinkedIn:</strong>{" "}
                        <a
                          href={selectedExp.personalInfo.linkedin.startsWith("http") ? selectedExp.personalInfo.linkedin : `https://${selectedExp.personalInfo.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#3b82f6", textDecoration: "underline" }}
                        >
                          {selectedExp.personalInfo.linkedin}
                        </a>
                        {" "}({selectedExp.personalInfo.showLinkedin ? "Public" : "Private"})
                      </div>
                    )}
                    {selectedExp.user && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', borderTop: '1px dashed #cbd5e1', paddingTop: '4px' }}>
                        Registered User Account: {selectedExp.user.username} ({selectedExp.user.email})
                      </div>
                    )}
                  </div>
                </div>

                {/* Company Details */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#334155' }}>Company & Target Role</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                    <div><strong>Company Name:</strong> {selectedExp.companyDetails?.companyName}</div>
                    <div><strong>Target Role:</strong> {selectedExp.companyDetails?.role}</div>
                    {selectedExp.companyDetails?.jobType && (
                      <div><strong>Job Type:</strong> {selectedExp.companyDetails?.jobType}</div>
                    )}
                    {selectedExp.companyDetails?.location && (
                      <div><strong>Location:</strong> {selectedExp.companyDetails?.location}</div>
                    )}
                    {selectedExp.companyDetails?.experienceLevel && (
                      <div><strong>Experience Level:</strong> {selectedExp.companyDetails?.experienceLevel}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Feedback and Outcome */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#334155' }}>Outcome & Feedback</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>Outcome:</strong>
                    <span className="badge" style={{
                      backgroundColor: selectedExp.feedback?.outcome === 'cleared' ? '#dcfce7' : '#fee2e2',
                      color: selectedExp.feedback?.outcome === 'cleared' ? '#15803d' : '#b91c1c',
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      fontSize: '12px'
                    }}>
                      {selectedExp.feedback?.outcome}
                    </span>
                  </div>
                  {selectedExp.feedback?.salaryRange && (
                    <div><strong>Salary Offered / Range:</strong> {selectedExp.feedback?.salaryRange}</div>
                  )}
                  {selectedExp.feedback?.prepTips && (
                    <div>
                      <strong>Preparation Strategy & Resources:</strong>
                      <div style={{ 
                        marginTop: '6px', 
                        padding: '10px', 
                        background: '#ffffff', 
                        border: '1px solid #cbd5e1', 
                        borderRadius: '4px',
                        whiteSpace: 'pre-line',
                        fontSize: '13.5px',
                        color: '#475569'
                      }}>
                        {selectedExp.feedback?.prepTips}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rounds List */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Rounds Breakdown ({selectedExp.rounds?.length || 0})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedExp.rounds?.map((round, index) => (
                    <div key={index} style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '14px', background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                        <h5 style={{ margin: 0, fontSize: '14.5px', color: '#0f172a' }}>
                          Round #{index + 1}: {round.roundName}
                        </h5>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 6px', background: '#f1f5f9', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#475569' }}>
                            {round.roundType}
                          </span>
                          <span style={{ 
                            fontSize: '11px', 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            border: '1px solid',
                            borderColor: round.difficulty === 'Easy' ? '#bbf7d0' : round.difficulty === 'Medium' ? '#fef08a' : '#fecaca',
                            background: round.difficulty === 'Easy' ? '#f0fdf4' : round.difficulty === 'Medium' ? '#fefce8' : '#fdf2f2',
                            color: round.difficulty === 'Easy' ? '#16a34a' : round.difficulty === 'Medium' ? '#ca8a04' : '#dc2626'
                          }}>
                            {round.difficulty}
                          </span>
                          <span style={{ fontSize: '11px', padding: '2px 6px', background: '#f1f5f9', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#475569' }}>
                            {round.mode}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {round.duration && (
                          <div><strong>Duration:</strong> {round.duration}</div>
                        )}
                        <div>
                          <strong>Round Summary:</strong>
                          <div style={{ 
                            marginTop: '4px', 
                            padding: '8px', 
                            background: '#f8fafc', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '4px', 
                            whiteSpace: 'pre-line',
                            color: '#334155'
                          }}>
                            {round.summary}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', gap: '10px' }}>
              <button 
                className="action-btn delete" 
                onClick={() => handleDelete(selectedExp._id)}
                style={{ fontSize: '14px', border: '1px solid #fecaca', borderRadius: '4px', padding: '8px 16px', background: '#fdf2f2' }}
              >
                Delete Experience
              </button>
              <button 
                className="secondary-btn" 
                onClick={() => setShowModal(false)}
                style={{ padding: '8px 16px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
