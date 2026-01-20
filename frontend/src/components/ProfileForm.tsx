import { ChangeEvent, useState } from 'react';

interface ProfileFormProps {
    type: string;
    formData: any;
    handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleSave: () => void;
    handleCancel: () => void;
    handleFileChange?: (e: ChangeEvent<HTMLInputElement>) => void;
    editingId: string | null;
    certFileName?: string;
}

const ProfileForm = ({
    type,
    formData,
    handleChange,
    handleSave,
    handleCancel,
    handleFileChange,
    editingId,
    certFileName
}: ProfileFormProps) => {

    const DEGREE_OPTIONS = [
        "B. Tech", "B.E", "B. Sc", "B. Com", "B.A", "BCA", "BBA", "B. Arch", "B. Pharm", "B. Ed"
    ];

    const UNIVERSITY_OPTIONS = [
        "IIT Madras",
        "IIT Delhi",
        "IIT Bombay",
        "IISc Bangalore",
        "NIT Trichy",
        "Anna University",
        "University of Delhi",
        "BITS Pilani",
        "VIT University",
        "SRM University",
        "Manipal University",
        "REC University"
    ];

    const SPECIALIZATION_OPTIONS = [
        "Computer Science Engineering (CSE)", "Information Technology (IT)", "Artificial Intelligence & Data Science",
        "Artificial Intelligence & Machine Learning", "Data Science", "Cyber Security", "Cloud Computing",
        "Software Engineering", "Computer Engineering", "Electronics and Communication Engineering (ECE)",
        "Electrical and Electronics Engineering (EEE)", "Mechanical Engineering", "Civil Engineering",
        "Robotics and Automation", "Mechatronics Engineering", "Biomedical Engineering", "Mathematics",
        "Statistics", "Physics", "Chemistry", "Biotechnology", "Microbiology", "Data Analytics",
        "Environmental Science", "Finance", "Marketing", "Human Resource Management", "Business Analytics",
        "Operations Management", "International Business", "Entrepreneurship", "Supply Chain Management",
        "Accounting", "Banking and Insurance", "Corporate Secretaryship", "Taxation", "Cost and Management Accounting",
        "Economics", "Psychology", "Sociology", "Political Science", "History", "English Literature",
        "Journalism & Mass Communication", "Public Administration", "Pharmacy", "Clinical Research",
        "Pharmaceutical Chemistry", "Pharmacology", "Healthcare Management", "Architecture", "Interior Design",
        "Urban Planning", "Industrial Design", "Law", "Criminology", "International Relations"
    ];

    const SKILL_OPTIONS = [
        "Python", "Java", "SQL", "Machine Learning", "Data Analysis", "Web Development",
        "Cloud Computing", "Cyber Security", "Git & GitHub", "Communication Skills"
    ];

    const CERTIFICATION_OPTIONS = [
        "Python Programming Certification", "Data Science Certification", "Machine Learning Certification",
        "AWS Cloud Practitioner", "Full Stack Development Certification", "Cyber Security Fundamentals",
        "Business Analytics Certification", "Agile / Scrum Certification"
    ];

    const JOB_ROLE_OPTIONS = [
        "Software Developer", "Software Engineer", "Full Stack Developer", "Frontend Developer",
        "Backend Developer", "Mobile App Developer", "Web Developer", "DevOps Engineer",
        "Data Scientist", "Data Analyst", "Machine Learning Engineer", "AI Engineer",
        "Business Intelligence Analyst", "Big Data Engineer", "Business Analyst", "Product Analyst",
        "Product Manager", "Project Manager", "Operations Analyst", "System Analyst",
        "Database Administrator", "Cloud Engineer", "Network Engineer", "IT Support Engineer",
        "Graduate Trainee Engineer", "Junior Software Developer", "Associate Data Analyst",
        "Management Trainee"
    ];

    const [errors, setErrors] = useState<{ [key: string]: boolean }>({});

    const validateAndSave = () => {
        const newErrors: { [key: string]: boolean } = {};
        let isValid = true;

        const checkRequired = (field: string) => {
            const val = formData[field];
            if (!val || val.toString().trim() === '' || val === 'Other') {
                newErrors[field] = true;
                isValid = false;
            }
        };

        if (type === 'Education') {
            checkRequired('degree');
            checkRequired('specialization');
            checkRequired('university');
            checkRequired('year');
            checkRequired('dropoutYear');
            checkRequired('cgpa');
        } else if (type === 'Skills') {
            checkRequired('skillName');
        } else if (type === 'Certification') {
            checkRequired('certName');
            checkRequired('organization');
            checkRequired('certDate');
        } else if (type === 'Placement Status') {
            checkRequired('role');
            checkRequired('company');
            checkRequired('type');
            checkRequired('joinDate');
        } else if (type === 'Password') {
            checkRequired('newPassword');
            checkRequired('confirmPassword');
        }

        setErrors(newErrors);
        if (isValid) {
            handleSave();
        }
    };

    // Education Form
    if (type === 'Education') {
        return (
            <div className="section">
                <h3 className="section-title">{editingId ? 'Edit Education' : 'Add New Education'}</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="degree">Degree *</label>
                        <div className="flex flex-col gap-2">
                            <select
                                id="degree"
                                name="degree"
                                value={(formData.degree && !DEGREE_OPTIONS.includes(formData.degree)) ? 'Other' : formData.degree}
                                onChange={handleChange}
                                className={`form-select ${errors.degree ? 'border-red-500' : ''}`}
                                style={errors.degree ? { border: '1px solid red' } : {}}
                            >
                                <option value="">Select Degree</option>
                                {DEGREE_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                                <option value="Other">Other</option>
                            </select>
                            {(formData.degree === 'Other' || (formData.degree && !DEGREE_OPTIONS.includes(formData.degree))) && (
                                <input
                                    type="text"
                                    name="degree"
                                    value={formData.degree === 'Other' ? '' : formData.degree}
                                    onChange={handleChange}
                                    placeholder="Enter Degree"
                                    className={`mt-2 ${errors.degree ? 'border-red-500' : ''}`}
                                    style={errors.degree ? { border: '1px solid red' } : {}}
                                />
                            )}
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="specialization">Specialization *</label>
                        <div className="flex flex-col gap-2">
                            <select
                                id="specialization"
                                name="specialization"
                                value={(formData.specialization && !SPECIALIZATION_OPTIONS.includes(formData.specialization)) ? 'Other' : formData.specialization}
                                onChange={handleChange}
                                className={`form-select ${errors.specialization ? 'border-red-500' : ''}`}
                                style={errors.specialization ? { border: '1px solid red' } : {}}
                            >
                                <option value="">Select Specialization</option>
                                {SPECIALIZATION_OPTIONS.map(spec => (
                                    <option key={spec} value={spec}>{spec}</option>
                                ))}
                                <option value="Other">Other</option>
                            </select>
                            {(formData.specialization === 'Other' || (formData.specialization && !SPECIALIZATION_OPTIONS.includes(formData.specialization))) && (
                                <input
                                    type="text"
                                    id="specialization-custom"
                                    name="specialization"
                                    value={formData.specialization === 'Other' ? '' : formData.specialization}
                                    onChange={handleChange}
                                    placeholder="Enter Specialization"
                                    className={`mt-2 ${errors.specialization ? 'border-red-500' : ''}`}
                                    style={errors.specialization ? { border: '1px solid red' } : {}}
                                />
                            )}
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="university">University *</label>
                        <div className="flex flex-col gap-2">
                            <select
                                id="university"
                                name="university"
                                value={(formData.university && !UNIVERSITY_OPTIONS.includes(formData.university)) ? 'Other' : formData.university}
                                onChange={handleChange}
                                className={`form-select ${errors.university ? 'border-red-500' : ''}`}
                                style={errors.university ? { border: '1px solid red' } : {}}
                            >
                                <option value="">Select University</option>
                                {UNIVERSITY_OPTIONS.map(uni => (
                                    <option key={uni} value={uni}>{uni}</option>
                                ))}
                                <option value="Other">Other</option>
                            </select>
                            {(formData.university === 'Other' || (formData.university && !UNIVERSITY_OPTIONS.includes(formData.university))) && (
                                <input
                                    type="text"
                                    id="university-custom"
                                    name="university"
                                    value={formData.university === 'Other' ? '' : formData.university}
                                    onChange={handleChange}
                                    placeholder="Enter University Name"
                                    className={`mt-2 ${errors.university ? 'border-red-500' : ''}`}
                                    style={errors.university ? { border: '1px solid red' } : {}}
                                />
                            )}
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="year">Year of Graduation *</label>
                        <input
                            type="number"
                            id="year"
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                            placeholder="e.g., 2024"
                            min="1950"
                            max={new Date().getFullYear() + 10}
                            style={errors.year ? { border: '1px solid red' } : {}}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="dropoutYear">Year of Dropout *</label>
                        <select
                            id="dropoutYear"
                            name="dropoutYear"
                            value={formData.dropoutYear || ''}
                            onChange={handleChange}
                            className={`form-select ${errors.dropoutYear ? 'border-red-500' : ''}`}
                            style={errors.dropoutYear ? { border: '1px solid red' } : {}}
                        >
                            <option value="">Select Year</option>
                            <option value="nil">nil</option>
                            {Array.from({ length: 86 }, (_, i) => new Date().getFullYear() + 10 - i).map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="cgpa">CGPA *</label>
                        <input
                            type="number"
                            id="cgpa"
                            name="cgpa"
                            value={formData.cgpa}
                            onChange={handleChange}
                            placeholder="e.g., 9.00"
                            min="0"
                            max="10"
                            step="0.01"
                            style={errors.cgpa ? { border: '1px solid red' } : {}}
                        />
                    </div>
                </div>
                <div className="form-actions">
                    <button className="save-btn" onClick={validateAndSave}>{editingId ? 'UPDATE' : 'SAVE'}</button>
                    {editingId && <button className="cancel-btn" onClick={handleCancel}>CANCEL</button>}
                </div>
            </div>
        );
    }

    // Certification Form
    if (type === 'Certification') {
        return (
            <div className="section">
                <h3 className="section-title">{editingId ? 'Edit Certification' : 'Add New Certification'}</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Certification Name *</label>
                        <div className="flex flex-col gap-2">
                            <select
                                name="certName"
                                value={(formData.certName && !CERTIFICATION_OPTIONS.includes(formData.certName)) ? 'Other' : formData.certName}
                                onChange={handleChange}
                                className={`form-select ${errors.certName ? 'border-red-500' : ''}`}
                                style={errors.certName ? { border: '1px solid red' } : {}}
                            >
                                <option value="">Select Certification</option>
                                {CERTIFICATION_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                                <option value="Other">Other</option>
                            </select>
                            {(formData.certName === 'Other' || (formData.certName && !CERTIFICATION_OPTIONS.includes(formData.certName))) && (
                                <input
                                    type="text"
                                    name="certName"
                                    value={formData.certName === 'Other' ? '' : formData.certName}
                                    onChange={handleChange}
                                    placeholder="Enter Certification Name"
                                    className={`mt-2 ${errors.certName ? 'border-red-500' : ''}`}
                                    style={errors.certName ? { border: '1px solid red' } : {}}
                                />
                            )}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Organization *</label>
                        <input type="text" name="organization" value={formData.organization} onChange={handleChange} placeholder="e.g. Amazon" style={errors.organization ? { border: '1px solid red' } : {}} />
                    </div>
                    <div className="form-group">
                        <label>Date *</label>
                        <input type="date" name="certDate" value={formData.certDate} onChange={handleChange} style={errors.certDate ? { border: '1px solid red' } : {}} />
                    </div>
                    <div className="form-group">
                        <label>Certificate File (Image or PDF)</label>
                        <input
                            type="file"
                            name="certFile"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange as any}
                            className="file-input"
                        />
                        {formData.certFile && (
                            <div className="file-preview">
                                Selected: {formData.certFile.name}
                            </div>
                        )}
                        {editingId && !formData.certFile && (
                            <div className="file-note">
                                {certFileName || 'No file uploaded'}
                            </div>
                        )}
                    </div>
                </div>
                <div className="form-actions">
                    <button className="save-btn" onClick={validateAndSave}>{editingId ? 'UPDATE' : 'SAVE'}</button>
                    {editingId && <button className="cancel-btn" onClick={handleCancel}>CANCEL</button>}
                </div>
            </div>
        );
    }

    // Skills Form
    if (type === 'Skills') {
        return (
            <div className="section">
                <h3 className="section-title">Add New Skill</h3>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="form-group">
                        <label>Skill Name *</label>
                        <div className="flex flex-col gap-2">
                            <select
                                name="skillName"
                                value={(formData.skillName && !SKILL_OPTIONS.includes(formData.skillName)) ? 'Other' : formData.skillName}
                                onChange={handleChange}
                                className={`form-select ${errors.skillName ? 'border-red-500' : ''}`}
                                style={errors.skillName ? { border: '1px solid red' } : {}}
                            >
                                <option value="">Select Skill</option>
                                {SKILL_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                                <option value="Other">Other</option>
                            </select>
                            {(formData.skillName === 'Other' || (formData.skillName && !SKILL_OPTIONS.includes(formData.skillName))) && (
                                <input
                                    type="text"
                                    name="skillName"
                                    value={formData.skillName === 'Other' ? '' : formData.skillName}
                                    onChange={handleChange}
                                    placeholder="Enter Skill Name"
                                    className={`mt-2 ${errors.skillName ? 'border-red-500' : ''}`}
                                    style={errors.skillName ? { border: '1px solid red' } : {}}
                                />
                            )}
                        </div>
                    </div>
                </div>
                <div className="form-actions">
                    <button className="save-btn" onClick={validateAndSave}>SAVE</button>
                </div>
            </div>
        );
    }

    // Placement Form
    if (type === 'Placement Status') {
        return (
            <div className="section">
                <h3 className="section-title">{editingId ? 'Edit Placement' : 'Add New Placement'}</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Role / Job Title *</label>
                        <div className="flex flex-col gap-2">
                            <select
                                name="role"
                                value={(formData.role && !JOB_ROLE_OPTIONS.includes(formData.role)) ? 'Other' : formData.role}
                                onChange={handleChange}
                                className={`form-select ${errors.role ? 'border-red-500' : ''}`}
                                style={errors.role ? { border: '1px solid red' } : {}}
                            >
                                <option value="">Select Job Role</option>
                                {JOB_ROLE_OPTIONS.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                                <option value="Other">Other</option>
                            </select>
                            {(formData.role === 'Other' || (formData.role && !JOB_ROLE_OPTIONS.includes(formData.role))) && (
                                <input
                                    type="text"
                                    name="role"
                                    value={formData.role === 'Other' ? '' : formData.role}
                                    onChange={handleChange}
                                    placeholder="Enter Job Title"
                                    className={`mt-2 ${errors.role ? 'border-red-500' : ''}`}
                                    style={errors.role ? { border: '1px solid red' } : {}}
                                />
                            )}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Company Name *</label>
                        <input type="text" name="company" value={formData.company} onChange={handleChange} placeholder="e.g. Google" style={errors.company ? { border: '1px solid red' } : {}} />
                    </div>
                    <div className="form-group">
                        <label>Type *</label>
                        <select name="type" value={formData.type} onChange={handleChange} className="form-select" style={errors.type ? { border: '1px solid red' } : {}}>
                            <option value="Job">Job</option>
                            <option value="Internship">Internship</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Date Joined *</label>
                        <input type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} style={errors.joinDate ? { border: '1px solid red' } : {}} />
                    </div>
                </div>
                <div className="form-actions">
                    <button className="save-btn" onClick={validateAndSave}>{editingId ? 'UPDATE' : 'SAVE'}</button>
                    {editingId && <button className="cancel-btn" onClick={handleCancel}>CANCEL</button>}
                </div>
            </div>
        );
    }

    // Password Form
    if (type === 'Password') {
        return (
            <div className="section">
                <h3 className="section-title">Change Password</h3>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                    <div className="form-group">
                        <label>New Password *</label>
                        <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} placeholder="Enter new password" style={errors.newPassword ? { border: '1px solid red' } : {}} />
                    </div>
                    <div className="form-group">
                        <label>Confirm Password *</label>
                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm new password" style={errors.confirmPassword ? { border: '1px solid red' } : {}} />
                    </div>
                </div>
                <div className="form-actions">
                    <button className="save-btn" onClick={validateAndSave}>SAVE</button>
                </div>
            </div>
        );
    }

    return null;
};

export default ProfileForm;
