import React, { useState, useEffect, useContext } from 'react';
import { getAllUsers, deleteUser, createUser, updateUser, syncAllUsersApi, syncSingleUser } from '../../api/admin.api';
import { Context } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './Manage.css';

export default function UsersManage() {
  const { url, token } = useContext(Context);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit/Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    username: '',
    email: '',
    password: '',
    role: 'user',
    branch: '',
    graduationYear: '',
    leetcode: '',
    codeforces: '',
    codechef: '',
    gfg: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAllUsers(url, token);
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await deleteUser(url, token, id);
      if (res.data.success) {
        toast.success("User deleted successfully!");
        fetchUsers();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete user");
    }
  };

  const openCreateModal = () => {
    setIsEdit(false);
    setFormData({
      id: '',
      username: '',
      email: '',
      password: '',
      role: 'user',
      branch: '',
      graduationYear: '',
      leetcode: '',
      codeforces: '',
      codechef: '',
      gfg: ''
    });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setIsEdit(true);
    setFormData({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      branch: user.branch || '',
      graduationYear: user.graduationYear || '',
      password: '', // Keep empty unless being updated
      leetcode: user.platforms?.leetcode || '',
      codeforces: user.platforms?.codeforces || '',
      codechef: user.platforms?.codechef || '',
      gfg: user.platforms?.gfg || ''
    });
    setShowModal(true);
  };

  const handleSyncAll = async () => {
    if (!window.confirm("Queue all users for synchronization?")) return;
    try {
      const res = await syncAllUsersApi(url, token);
      if (res.data.success) toast.success(res.data.message);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to trigger global sync");
    }
  };

  const handleSyncSingle = async (user) => {
    try {
      const res = await syncSingleUser(url, token, user._id);
      if (res.data.success) toast.success(res.data.message);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to trigger user sync");
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        branch: formData.branch,
        graduationYear: formData.graduationYear,
        platforms: {
          leetcode: formData.leetcode,
          codeforces: formData.codeforces,
          codechef: formData.codechef,
          gfg: formData.gfg
        }
      };

      if (isEdit) {
        if (formData.password) submitData.password = formData.password;
        const res = await updateUser(url, token, formData.id, submitData);
        if (res.data.success) toast.success("User updated!");
      } else {
        submitData.password = formData.password;
        const res = await createUser(url, token, submitData);
        if (res.data.success) toast.success("User created!");
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} user`);
    }
  };

  return (
    <div className="manage-container">
      <div className="manage-header">
        <h2>Manage Users</h2>
        <div>
          <button className="secondary-btn" onClick={handleSyncAll} style={{ marginRight: '10px' }}>Sync All Users</button>
          <button className="primary-btn" onClick={openCreateModal}>+ Add User</button>
        </div>
      </div>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Branch</th>
                <th>Graduation Year</th>
                <th>Registration Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>
                    <div><strong>{user.username}</strong></div>
                    {user.platforms && (
                      <div className="user-platforms-sub">
                        {user.platforms.leetcode && <span className="platform-tag lc">LC: {user.platforms.leetcode}</span>}
                        {user.platforms.codeforces && <span className="platform-tag cf">CF: {user.platforms.codeforces}</span>}
                        {user.platforms.codechef && <span className="platform-tag cc">CC: {user.platforms.codechef}</span>}
                        {user.platforms.gfg && <span className="platform-tag gfg">GFG: {user.platforms.gfg}</span>}
                      </div>
                    )}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'admin' : 'user'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.branch || 'None'}</td>
                  <td>{user.graduationYear || 'None'}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="action-btn edit" onClick={() => openEditModal(user)}>Edit</button>
                    <button className="action-btn delete" onClick={() => handleDelete(user._id)}>Delete</button>
                    <button className="action-btn" style={{ color: '#16a34a' }} onClick={() => handleSyncSingle(user)}>Sync</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{isEdit ? 'Edit User' : 'Create User'}</h3>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Username</label>
                <input type="text" name="username" value={formData.username} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleFormChange} required />
              </div>
              <div className="form-group">
                <label>{isEdit ? 'Password (leave blank to keep current)' : 'Password'}</label>
                <input type="password" name="password" value={formData.password} onChange={handleFormChange} required={!isEdit} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select name="role" value={formData.role} onChange={handleFormChange}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Branch</label>
                <select name="branch" value={formData.branch} onChange={handleFormChange}>
                  <option value="">None / Select Branch</option>
                  <option value="Computer Engineering">Computer Engineering</option>
                  <option value="ECE">ECE</option>
                  <option value="Electical Engineering">Electical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="CSDS">CSDS</option>
                  <option value="VLSI">VLSI</option>
                  <option value="Robotics & AI">Robotics & AI</option>
                  <option value="Electrical & Computer">Electrical & Computer</option>
                  <option value="Construction Technology">Construction Technology</option>
                </select>
              </div>

              <div className="form-group">
                <label>Graduation Year</label>
                <select name="graduationYear" value={formData.graduationYear} onChange={handleFormChange}>
                  <option value="">None / Select Graduation Year</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                  <option value="2029">2029</option>
                  <option value="2030">2030</option>
                  <option value="2031">2031</option>
                </select>
              </div>

              <div className="platform-section">
                <h4>Platform Usernames</h4>
                <div className="form-group-row">
                  <div className="form-group">
                    <label>LeetCode</label>
                    <input type="text" name="leetcode" value={formData.leetcode} onChange={handleFormChange} placeholder="Username" />
                  </div>
                  <div className="form-group">
                    <label>Codeforces</label>
                    <input type="text" name="codeforces" value={formData.codeforces} onChange={handleFormChange} placeholder="Username" />
                  </div>
                </div>
                <div className="form-group-row">
                  <div className="form-group">
                    <label>CodeChef</label>
                    <input type="text" name="codechef" value={formData.codechef} onChange={handleFormChange} placeholder="Username" />
                  </div>
                  <div className="form-group">
                    <label>GeeksforGeeks</label>
                    <input type="text" name="gfg" value={formData.gfg} onChange={handleFormChange} placeholder="Username" />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn">{isEdit ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
