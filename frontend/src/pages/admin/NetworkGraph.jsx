import React, { useEffect, useRef, useState } from 'react';
import { Spin, Card, Empty, Tag, Tooltip } from 'antd';
import { SafetyOutlined, WarningOutlined } from '@ant-design/icons';

const NetworkGraph = ({ data, loading }) => {
    const svgRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

    useEffect(() => {
        if (!loading && data && data.nodes && data.nodes.length > 0) {
            // Simple force-directed-ish layout implementation
            const nodes = data.nodes.map((n, i) => ({
                ...n,
                x: Math.random() * dimensions.width,
                y: Math.random() * dimensions.height,
                vx: 0,
                vy: 0
            }));

            const edges = data.edges.map(e => ({
                ...e,
                sourceNode: nodes.find(n => n.id === e.source),
                targetNode: nodes.find(n => n.id === e.target)
            }));

            // Basic simulation loop (run for fixed iterations for stability)
            for (let iter = 0; iter < 50; iter++) {
                // Repulsion
                for (let i = 0; i < nodes.length; i++) {
                    for (let j = i + 1; j < nodes.length; j++) {
                        const dx = nodes[i].x - nodes[j].x;
                        const dy = nodes[i].y - nodes[j].y;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        const force = 500 / (dist * dist);
                        nodes[i].vx += (dx / dist) * force;
                        nodes[i].vy += (dy / dist) * force;
                        nodes[j].vx -= (dx / dist) * force;
                        nodes[j].vy -= (dy / dist) * force;
                    }
                }

                // Attraction (Edges)
                edges.forEach(e => {
                    const dx = e.sourceNode.x - e.targetNode.x;
                    const dy = e.sourceNode.y - e.targetNode.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = (dist - 100) * 0.05;
                    e.sourceNode.vx -= (dx / dist) * force;
                    e.sourceNode.vy -= (dy / dist) * force;
                    e.targetNode.vx += (dx / dist) * force;
                    e.targetNode.vy += (dy / dist) * force;
                });

                // Move and boundary
                nodes.forEach(n => {
                    n.x += n.vx;
                    n.y += n.vy;
                    n.vx *= 0.5;
                    n.vy *= 0.5;
                    n.x = Math.max(50, Math.min(dimensions.width - 50, n.x));
                    n.y = Math.max(50, Math.min(dimensions.height - 50, n.y));
                });
            }

            renderGraph(nodes, edges);
        }
    }, [data, loading]);

    const renderGraph = (nodes, edges) => {
        const svg = svgRef.current;
        if (!svg) return;

        // Clear previous
        while (svg.firstChild) svg.removeChild(svg.firstChild);

        // Draw edges
        edges.forEach(edge => {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", edge.sourceNode.x);
            line.setAttribute("y1", edge.sourceNode.y);
            line.setAttribute("x2", edge.targetNode.x);
            line.setAttribute("y2", edge.targetNode.y);
            line.setAttribute("stroke", "#d1d5db");
            line.setAttribute("stroke-width", edge.weight / 20);
            line.setAttribute("opacity", "0.6");
            svg.appendChild(line);

            // Weight label
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", (edge.sourceNode.x + edge.targetNode.x) / 2);
            text.setAttribute("y", (edge.sourceNode.y + edge.targetNode.y) / 2);
            text.setAttribute("font-size", "10");
            text.setAttribute("fill", "#6b7280");
            text.textContent = `${edge.weight}%`;
            svg.appendChild(text);
        });

        // Draw nodes
        nodes.forEach(node => {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", node.x);
            circle.setAttribute("cy", node.y);
            circle.setAttribute("r", 20);
            circle.setAttribute("fill", node.riskLevel === 'High' ? '#fecaca' : node.riskLevel === 'Medium' ? '#ffedd5' : '#dcfce7');
            circle.setAttribute("stroke", node.riskLevel === 'High' ? '#ef4444' : node.riskLevel === 'Medium' ? '#f97316' : '#22c55e');
            circle.setAttribute("stroke-width", "2");
            svg.appendChild(circle);

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", node.x);
            text.setAttribute("y", node.y + 35);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("font-size", "12");
            text.setAttribute("font-weight", "bold");
            text.setAttribute("fill", "#374151");
            text.textContent = node.name;
            svg.appendChild(text);
        });
    };

    if (loading) return <div className="h-[500px] flex items-center justify-center"><Spin tip="Analyzing Network Patterns..." /></div>;

    if (!data || !data.nodes || data.nodes.length === 0) {
        return <Empty description="No collusion clusters detected for this assessment" className="p-20" />;
    }

    return (
        <div className="relative border rounded-xl bg-gray-50 overflow-hidden">
            <div className="absolute top-4 left-4 z-10 space-y-2">
                <Tag color="error" className="block"><WarningOutlined className="mr-1" /> High Similarity Cluster</Tag>
                <Tag color="processing" className="block text-xs">Edge Weight = Jaccard + DNA + Risk Correl.</Tag>
            </div>
            <svg
                ref={svgRef}
                width="100%"
                height="500"
                viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                className="cursor-move"
            />
            <div className="absolute bottom-4 right-4 text-[10px] text-gray-400">
                Interactive Collusion Map v1.0
            </div>
        </div>
    );
};

export default NetworkGraph;
