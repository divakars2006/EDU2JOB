import { useMemo, useState, useEffect } from 'react';

interface MatchScoreChartProps {
    user?: any;
    data?: any[];
    title?: string;
    className?: string;
}

const MatchScoreChart = ({ user, data: customData, title, className }: MatchScoreChartProps) => {

    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        // Trigger animation on mount/update
        setAnimate(false);
        setTimeout(() => setAnimate(true), 100);
    }, [user, customData]);

    const data = useMemo(() => {
        if (customData) {
            // If custom data provided, assume it has role and score (0-100 or 0-1)
            // We might need to normalize score to 0-100 if it is 0-1
            return customData.map((d: any, index: number) => ({
                role: d.role,
                // Check if score is <= 1 (likely percentage as decimal), otherwise assume 0-100
                score: d.score <= 1 ? Math.round(d.score * 100) : Math.round(d.score),
                x: d.x !== undefined ? d.x : (index / (customData.length - 1)) * 100
            }));
        }

        if (!user) return [];

        const skills = (user.skills || []).map((s: string) => s.toLowerCase());
        const educations = user.educations || [];
        const profileText = [
            ...skills,
            ...educations.map((e: any) => `${e.degree} ${e.specialization}`.toLowerCase())
        ].join(' ');

        const roles = [
            {
                role: 'Software Dev',
                fullRole: 'Software Developer',
                keywords: ['software', 'developer', 'engineering', 'coding', 'java', 'c++', 'javascript', 'react', 'node', 'web']
            },
            {
                role: 'Data Analyst',
                fullRole: 'Data Analyst',
                keywords: ['data', 'analyst', 'sql', 'excel', 'tableau', 'power bi', 'statistics', 'analysis', 'python']
            },
            {
                role: 'ML Engineer',
                fullRole: 'Machine Learning Engineer',
                keywords: ['machine learning', 'ml', 'ai', 'tensor', 'pytorch', 'python', 'deep learning', 'algorithm', 'model']
            },
            {
                role: 'Cloud Engineer',
                fullRole: 'Cloud Engineer',
                keywords: ['cloud', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'devops', 'linux', 'server', 'network']
            }
        ];

        return roles.map((r, index) => {
            let matchCount = 0;
            r.keywords.forEach(k => {
                if (skills.some((s: string) => s.includes(k))) matchCount += 2;
                else if (profileText.includes(k)) matchCount += 1;
            });

            // Normalize to 0-100% (Assume 6 points is max for Demo)
            let percentage = Math.min(100, (matchCount / 6) * 100);
            percentage = Math.round(percentage);

            return {
                role: r.role,
                fullRole: r.fullRole,
                score: percentage,
                x: (index / (roles.length - 1)) * 100 // Distribute evenly 0-100%
            };
        });

    }, [user, customData]);

    if (!user && !customData) return null;

    // SVG Dimenstions
    const height = 250;
    const width = 800;
    const padding = 40;

    // Helper to map 0-100% to pixels
    const getX = (percent: number) => padding + (percent / 100) * (width - padding * 2);
    const getY = (score: number) => height - padding - (score / 100) * (height - padding * 2);

    // Generate Path (Start with straight lines for simplicity, then smooth?)
    // Actually, let's do a simple Catmull-Rom or just manual bezier for 4 points.
    // For 4 points, we can just produce a smooth curve.

    const points = data.map(d => ({ x: getX(d.x), y: getY(d.score) }));

    const getSmoothPath = (pts: { x: number, y: number }[]) => {
        if (pts.length === 0) return "";

        let path = `M ${pts[0].x},${pts[0].y}`;

        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = i > 0 ? pts[i - 1] : pts[i];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
        }
        return path;
    };

    const linePath = getSmoothPath(points);
    const areaPath = `${linePath} L ${getX(100)},${height} L ${getX(0)},${height} Z`;

    return (
        <div className={`info-card match-score-chart-card ${className || ''}`}>
            <div className="card-header">
                <span className="card-icon">📊</span>
                <h3 className="card-title">{title || "Job Role Match Score"}</h3>
            </div>
            <div className="card-content">
                <div className="svg-chart-container">
                    <svg viewBox={`0 0 ${width} ${height}`} className="match-chart-svg">
                        <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#667eea" stopOpacity="0.6" />
                                <stop offset="100%" stopColor="#764ba2" stopOpacity="0.1" />
                            </linearGradient>
                            <linearGradient id="areaGradientLight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.05" />
                            </linearGradient>
                        </defs>

                        {/* Grid Lines (Horizontal) */}
                        {[0, 25, 50, 75, 100].map(val => (
                            <line
                                key={val}
                                x1={padding}
                                y1={getY(val)}
                                x2={width - padding}
                                y2={getY(val)}
                                stroke="currentColor"
                                strokeOpacity="0.1"
                                strokeWidth="1"
                            />
                        ))}

                        {/* Area Fill */}
                        <path
                            d={areaPath}
                            fill="url(#areaGradient)"
                            className={`chart-area ${animate ? 'animate-in' : ''}`}
                        />

                        {/* Stroke Line */}
                        <path
                            d={linePath}
                            fill="none"
                            stroke="#667eea"
                            strokeWidth="3"
                            strokeLinecap="round"
                            className={`chart-line ${animate ? 'animate-in' : ''}`}
                        />

                        {/* Points & Labels */}
                        {data.map((d, i) => (
                            <g key={d.role} className={`chart-point-group ${animate ? 'animate-in' : ''}`} style={{ transitionDelay: `${i * 0.1}s` }}>
                                <circle
                                    cx={getX(d.x)}
                                    cy={getY(d.score)}
                                    r="6"
                                    fill="#fff"
                                    stroke="#667eea"
                                    strokeWidth="2"
                                />
                                <text
                                    x={getX(d.x)}
                                    y={getY(d.score) - 15}
                                    textAnchor="middle"
                                    fill="currentColor"
                                    fontSize="14"
                                    fontWeight="bold"
                                >
                                    {d.score}%
                                </text>
                                <text
                                    x={getX(d.x)}
                                    y={height - 5}
                                    textAnchor="middle"
                                    fill="currentColor"
                                    fontSize="14"
                                    className="axis-label"
                                >
                                    {d.role}
                                </text>
                            </g>
                        ))}
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default MatchScoreChart;
