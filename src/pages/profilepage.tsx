import { useState, useEffect } from 'react';
import './profilepage.css';
import { useAuth } from '../authentication/AuthContext';
import ProfileForm from '../components/ProfileForm';
import { updateUser as apiUpdateUser } from '../services/ApiService';

interface Education {
  id: string;
  degree: string;
  specialization: string;
  university: string;
  year: string;
  cgpa: string;
}

interface Certification {
  id: string;
  name: string;
  organization: string;
  date: string;
  fileUrl?: string;
  fileName?: string;
}

interface PlacementStatus {
  id: string;
  role: string;
  company: string;
  type: 'Job' | 'Internship';
  date: string;
}

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeTab, setActiveTab] = useState('Education');

  // Local state for lists (synced with user context)
  const [educations, setEducations] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [placements, setPlacements] = useState<PlacementStatus[]>([]);

  const [formData, setFormData] = useState({
    // Education
    degree: '',
    specialization: '',
    university: '',
    year: '',
    cgpa: '',
    // Certification
    certName: '',
    organization: '',
    certDate: '',
    certFile: null as File | null,
    // Skills
    skillName: '',
    // Placement
    role: '',
    company: '',
    type: 'Job',
    joinDate: '',
    // Password
    newPassword: '',
    confirmPassword: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    // Theme logic
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Sync state with user context
    if (user) {
      if (user.educations) setEducations(user.educations);
      if (user.certifications) setCertifications(user.certifications);
      if (user.skills) setSkills(user.skills);
      if (user.placementStatus) setPlacements(user.placementStatus);
    }
  }, [theme, user]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = () => {
    logout();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleNavigation = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const saveUserData = async (updatedData: any) => {
    try {
      // Import backend service
      if (user && user.id) {
        const result = await apiUpdateUser(user.id, updatedData);
        if (result.success) {
          // Update context
          updateUser(updatedData);
          return true;
        } else {
          alert(result.message || 'Failed to save changes');
          return false;
        }
      }
      // If no valid user ID (e.g. demo mode), just update context locally
      updateUser(updatedData);
      return true;
    } catch (error) {
      console.error('Save error:', error);
      return false;
    }
  };

  const handleSave = async () => {
    if (activeTab === 'Education') {
      if (!formData.degree || !formData.specialization || !formData.university || !formData.year || !formData.cgpa) {
        alert('Please fill in all required fields');
        return;
      }

      // Year Validation
      const year = parseInt(formData.year);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1950 || year > currentYear + 10) {
        alert(`Please enter a valid graduation year between 1950 and ${currentYear + 10}`);
        return;
      }

      // CGPA Validation
      const cgpa = parseFloat(formData.cgpa);
      if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
        alert('Please enter a valid CGPA between 0 and 10');
        return;
      }

      let updatedList = [...educations];
      if (editingId) {
        updatedList = educations.map(item => item.id === editingId ? { ...item, degree: formData.degree, specialization: formData.specialization, university: formData.university, year: formData.year, cgpa: formData.cgpa } : item);
      } else {
        updatedList.push({ id: Date.now().toString(), degree: formData.degree, specialization: formData.specialization, university: formData.university, year: formData.year, cgpa: formData.cgpa });
      }
      setEducations(updatedList);
      await saveUserData({ educations: updatedList });
      resetForm();
    } else if (activeTab === 'Certification') {
      if (!formData.certName || !formData.organization || !formData.certDate) {
        alert('Please fill in all required fields');
        return;
      }

      let fileUrl = '';
      let fileName = '';

      if (formData.certFile) {
        fileUrl = URL.createObjectURL(formData.certFile);
        fileName = formData.certFile.name;
      } else if (editingId) {
        const existingCert = certifications.find(c => c.id === editingId);
        if (existingCert) {
          fileUrl = existingCert.fileUrl || '';
          fileName = existingCert.fileName || '';
        }
      }

      const newCert = {
        id: editingId || Date.now().toString(),
        name: formData.certName,
        organization: formData.organization,
        date: formData.certDate,
        fileUrl,
        fileName
      };

      let updatedList = [...certifications];
      if (editingId) {
        updatedList = certifications.map(item => item.id === editingId ? newCert : item);
      } else {
        updatedList.push(newCert);
      }

      setCertifications(updatedList);
      await saveUserData({ certifications: updatedList });
      resetForm();
    } else if (activeTab === 'Skills') {
      if (!formData.skillName) {
        alert('Please enter a skill name');
        return;
      }
      if (!skills.includes(formData.skillName)) {
        const updatedList = [...skills, formData.skillName];
        setSkills(updatedList);
        await saveUserData({ skills: updatedList });
      }
      resetForm();
    } else if (activeTab === 'Placement Status') {
      if (!formData.role || !formData.company || !formData.joinDate) {
        alert('Please fill in all required fields');
        return;
      }
      let updatedList = [...placements];
      if (editingId) {
        updatedList = placements.map(item => item.id === editingId ? { ...item, role: formData.role, company: formData.company, type: formData.type as 'Job' | 'Internship', date: formData.joinDate } : item);
      } else {
        updatedList.push({ id: Date.now().toString(), role: formData.role, company: formData.company, type: formData.type as 'Job' | 'Internship', date: formData.joinDate });
      }
      setPlacements(updatedList);
      await saveUserData({ placementStatus: updatedList });
      resetForm();
    } else if (activeTab === 'Password') {
      if (!formData.newPassword || !formData.confirmPassword) {
        alert('Please fill in all fields');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      const success = await saveUserData({ newPassword: formData.newPassword });
      if (success) {
        alert('Password updated successfully');
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      degree: '', specialization: '', university: '', year: '', cgpa: '',
      certName: '', organization: '', certDate: '', certFile: null,
      skillName: '',
      role: '', company: '', type: 'Job', joinDate: '',
      newPassword: '', confirmPassword: ''
    });
  };

  const handleEdit = (id: string, type: string) => {
    setEditingId(id);
    if (type === 'Education') {
      const item = educations.find(i => i.id === id);
      if (item) setFormData(prev => ({ ...prev, degree: item.degree, specialization: item.specialization, university: item.university, year: item.year, cgpa: item.cgpa }));
    } else if (type === 'Certification') {
      const item = certifications.find(i => i.id === id);
      if (item) {
        setFormData(prev => ({
          ...prev,
          certName: item.name,
          organization: item.organization,
          certDate: item.date,
          certFile: null
        }));
      }
    } else if (type === 'Placement Status') {
      const item = placements.find(i => i.id === id);
      if (item) setFormData(prev => ({ ...prev, role: item.role, company: item.company, type: item.type, joinDate: item.date }));
    }
  };

  const handleDelete = async (id: string, type: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      if (type === 'Education') {
        const updated = educations.filter(i => i.id !== id);
        setEducations(updated);
        await saveUserData({ educations: updated });
      } else if (type === 'Certification') {
        const updated = certifications.filter(i => i.id !== id);
        setCertifications(updated);
        await saveUserData({ certifications: updated });
      } else if (type === 'Skills') {
        const updated = skills.filter(s => s !== id);
        setSkills(updated);
        await saveUserData({ skills: updated });
      } else if (type === 'Placement Status') {
        const updated = placements.filter(i => i.id !== id);
        setPlacements(updated);
        await saveUserData({ placementStatus: updated });
      }
      if (editingId === id) resetForm();
    }
  };

  const tabs = ['Education', 'Certification', 'Skills', 'Placement Status', 'Password'];

  return (
    <div className={`profile-page ${theme}-theme`}>
      <header className="profile-header">
        <div className="header-left">
          <div className="logo-container">
            <span className="logo-icon">🎓</span>
            <h1 className="logo-text">Job Predicting</h1>
          </div>
        </div>
        <nav className="header-nav">
          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('/dashboard'); }}>Dashboard</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('/profile'); }} className="active">My Profile</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('/job-predictor'); }}>Job Predictor</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('/history'); }}>History</a>
        </nav>
        <div className="header-right">
          <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="logout-btn" onClick={handleLogout} aria-label="Log out">
            Log Out
          </button>
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U')}
          </div>
        </div>
      </header>

      <div className="profile-container">
        <main className="profile-main">
          <div className="profile-card">
            <h2 className="profile-title">Manage Profile</h2>

            <div className="profile-tabs">
              {tabs.map(tab => (
                <button
                  key={tab}
                  className={`profile-tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => { setActiveTab(tab); resetForm(); }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="tab-content">
              {/* List Sections */}
              {activeTab === 'Education' && (
                <div className="section">
                  <h3 className="section-title">Existing Educations</h3>
                  <div className="items-list">
                    {educations.map(edu => (
                      <div key={edu.id} className="list-item">
                        <div className="item-content">
                          <div className="item-main">{edu.degree} in {edu.specialization}</div>
                          <div className="item-sub">{edu.university} ({edu.year})</div>
                        </div>
                        <div className="item-actions">
                          <button className="action-btn edit-btn" onClick={() => handleEdit(edu.id, 'Education')}>✏️</button>
                          <button className="action-btn delete-btn" onClick={() => handleDelete(edu.id, 'Education')}>🗑️</button>
                        </div>
                      </div>
                    ))}
                    {educations.length === 0 && <p className="empty-message">No educations added yet.</p>}
                  </div>
                </div>
              )}

              {activeTab === 'Certification' && (
                <div className="section">
                  <h3 className="section-title">Existing Certifications</h3>
                  <div className="items-list">
                    {certifications.map(cert => (
                      <div key={cert.id} className="list-item">
                        <div className="item-content">
                          <div className="item-main">
                            {cert.name}
                            {cert.fileName && <span className="file-badge">📎 {cert.fileName}</span>}
                          </div>
                          <div className="item-sub">{cert.organization} • {cert.date}</div>
                        </div>
                        <div className="item-actions">
                          <button className="action-btn edit-btn" onClick={() => handleEdit(cert.id, 'Certification')}>✏️</button>
                          <button className="action-btn delete-btn" onClick={() => handleDelete(cert.id, 'Certification')}>🗑️</button>
                        </div>
                      </div>
                    ))}
                    {certifications.length === 0 && <p className="empty-message">No certifications added yet.</p>}
                  </div>
                </div>
              )}

              {activeTab === 'Skills' && (
                <div className="section">
                  <h3 className="section-title">Existing Skills</h3>
                  <div className="skills-container">
                    {skills.map(skill => (
                      <span key={skill} className="skill-tag">
                        {skill}
                        <button className="skill-delete-btn" onClick={() => handleDelete(skill, 'Skills')}>×</button>
                      </span>
                    ))}
                    {skills.length === 0 && <p className="empty-message">No skills added yet.</p>}
                  </div>
                </div>
              )}

              {activeTab === 'Placement Status' && (
                <div className="section">
                  <h3 className="section-title">Existing Placements</h3>
                  <div className="items-list">
                    {placements.map(p => (
                      <div key={p.id} className="list-item">
                        <div className="item-content">
                          <div className="item-main">{p.role} at {p.company}</div>
                          <div className="item-sub">{p.type} - Joined: {p.date}</div>
                        </div>
                        <div className="item-actions">
                          <button className="action-btn edit-btn" onClick={() => handleEdit(p.id, 'Placement Status')}>✏️</button>
                          <button className="action-btn delete-btn" onClick={() => handleDelete(p.id, 'Placement Status')}>🗑️</button>
                        </div>
                      </div>
                    ))}
                    {placements.length === 0 && <p className="empty-message">No placements added yet.</p>}
                  </div>
                </div>
              )}

              {/* Form Section using Component */}
              <ProfileForm
                type={activeTab}
                formData={formData}
                handleChange={handleInputChange}
                handleSave={handleSave}
                handleCancel={resetForm}
                editingId={editingId}
                handleFileChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFormData(prev => ({
                      ...prev,
                      certFile: e.target.files ? e.target.files[0] : null
                    }));
                  }
                }}
                certFileName={certifications.find(c => c.id === editingId)?.fileName}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;

