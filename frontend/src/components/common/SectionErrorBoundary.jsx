import React from 'react';
import { Result, Button } from 'antd';
import { WarningOutlined, ReloadOutlined } from '@ant-design/icons';

class SectionErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You could log this to an external service like Sentry or the backend here
        console.error('Section Error Captured:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-100 dark:border-red-900 m-4">
                    <Result
                        icon={<WarningOutlined className="text-red-500" />}
                        title={<span className="text-gray-900 dark:text-white">Failed to load this section</span>}
                        subTitle={<span className="text-gray-500 dark:text-gray-400">An unexpected error occurred while rendering this view. The rest of the application is still functional.</span>}
                        extra={[
                            <Button
                                type="primary"
                                danger
                                icon={<ReloadOutlined />}
                                key="reload"
                                onClick={() => this.setState({ hasError: false, error: null })} // Reset attempt
                            >
                                Try Again
                            </Button>
                        ]}
                    />
                </div>
            );
        }

        return this.props.children;
    }
}

export default SectionErrorBoundary;
