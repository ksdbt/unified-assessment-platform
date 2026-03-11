import React from 'react';
import { Card } from 'antd';
import * as Icons from '@ant-design/icons';

const CategoryCard = ({ category, onClick, active }) => {
    const IconComponent = Icons[category.icon] || Icons.BookOutlined;

    return (
        <Card
            hoverable
            className={`transition-all duration-300 transform ${active ? 'ring-2 ring-indigo-500 scale-105 shadow-xl' : 'hover:-translate-y-1 shadow-md'
                }`}
            style={{ borderLeft: `4px solid ${category.color || '#4f46e5'}` }}
            onClick={() => onClick(category)}
        >
            <div className="flex flex-col items-center text-center p-2">
                <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${category.color}20`, color: category.color }}
                >
                    <IconComponent style={{ fontSize: '24px' }} />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-white mb-1">{category.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{category.description}</p>
            </div>
        </Card>
    );
};

export default CategoryCard;
