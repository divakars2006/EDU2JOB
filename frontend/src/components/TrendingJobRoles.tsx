import React, { useState, useEffect } from 'react';

const trendingData = [
    {
        category: "AI / ML",
        fullCategory: "AI / ML Engineering",
        roles: "ML Engineer, AI Engineer",
        growth: 35,
        color: "#8b5cf6" // Violet
    },
    {
        category: "Data",
        fullCategory: "Data Roles",
        roles: "Data Scientist, Data Analyst",
        growth: 25,
        color: "#3b82f6" // Blue
    },
    {
        category: "Software",
        fullCategory: "Software Development",
        roles: "Software Engineer",
        growth: 15,
        color: "#10b981" // Emerald
    },
    {
        category: "Business",
        fullCategory: "Business / Consulting",
        roles: "Product Manager",
        growth: 10,
        color: "#f59e0b" // Amber
    },
    {
        category: "Marketing",
        fullCategory: "Marketing / Creative",
        roles: "Digital Marketer",
        growth: 8,
        color: "#ec4899" // Pink
    },
    {
        category: "Other",
        fullCategory: "Other (Green, Sales)",
        roles: "Sustainability Expert",
        growth: 7,
        color: "#64748b" // Slate
    }
];

const TrendingJobRoles = () => {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        setTimeout(() => setAnimate(true), 100);
    }, []);

    const maxGrowth = 40;

    return (
        <div className="info-card" style={{ marginTop: '2rem' }}>
            <div className="card-header">
                <span className="card-icon">📊</span>
                <h3 className="card-title">Trending Roles (Growth %)</h3>
            </div>

            <div className="card-content" style={{ padding: '0 1rem 1rem 1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '30px' }}>

                    {/* CHART AREA (Bars + Grid) */}
                    <div style={{
                        height: '300px',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'flex-end',
                        borderBottom: '2px solid rgba(255,255,255,0.2)' // Explicit 0% baseline
                    }}>

                        {/* Grid Lines (Background) */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' }}>
                            {[10, 20, 30, 40].map((val) => (
                                <div key={val} style={{
                                    position: 'absolute',
                                    bottom: `${(val / maxGrowth) * 100}%`,
                                    width: '100%',
                                    borderBottom: '1px dashed rgba(255,255,255,0.1)'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        left: '-40px',
                                        top: '-8px',
                                        fontWeight: 'bold',
                                        fontSize: '0.8rem',
                                        opacity: 0.5,
                                        width: '35px',
                                        textAlign: 'right'
                                    }}>{val}%</span>
                                </div>
                            ))}
                            {/* 0% Label */}
                            <span style={{
                                position: 'absolute',
                                left: '-40px',
                                bottom: '-8px',
                                fontWeight: 'bold',
                                fontSize: '0.8rem',
                                opacity: 0.5,
                                width: '35px',
                                textAlign: 'right'
                            }}>0%</span>
                        </div>

                        {/* Bars Container */}
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end',
                            zIndex: 1,
                            gap: '10px',
                            cursor: 'default'
                        }}>
                            {trendingData.map((item, index) => (
                                <div key={index} style={{
                                    flex: 1,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'flex-end',
                                    alignItems: 'center'
                                }}>
                                    {/* Value Tag */}
                                    <div style={{
                                        marginBottom: '8px',
                                        fontWeight: 'bold',
                                        fontSize: '0.95rem',
                                        opacity: animate ? 1 : 0,
                                        transform: animate ? 'translateY(0)' : 'translateY(10px)',
                                        transition: 'all 0.5s ease 0.5s'
                                    }}>
                                        {item.growth}%
                                    </div>

                                    {/* Bar Rect */}
                                    <div style={{
                                        width: '60%',
                                        maxWidth: '50px',
                                        minWidth: '30px',
                                        height: animate ? `${(item.growth / maxGrowth) * 100}%` : '0%',
                                        background: item.color,
                                        borderRadius: '8px 8px 0 0',
                                        transition: 'height 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                    }}
                                        title={`${item.fullCategory}\nKey Roles: ${item.roles}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* LABELS AREA (X-Axis) */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '15px',
                        gap: '10px'
                    }}>
                        {trendingData.map((item, index) => (
                            <div key={index} style={{
                                flex: 1,
                                textAlign: 'center',
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                opacity: 0.8,
                                display: 'flex',
                                justifyContent: 'center'
                            }}>
                                <span className="category-label" style={{ maxWidth: '100%', lineHeight: '1.4' }}>
                                    {item.category}
                                </span>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TrendingJobRoles;
