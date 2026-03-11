import React from 'react';
import { Result, Button } from 'antd';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Frontend Error Captured:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-gray-50 p-6">
                    <Result
                        status="error"
                        title="Application Error"
                        subTitle="Something went wrong while loading this component. This may be due to a network issue or a temporary failure."
                        extra={[
                            <Button type="primary" key="reload" onClick={() => window.location.reload()}>
                                Reload Application
                            </Button>,
                            <Button key="back" onClick={() => window.history.back()}>
                                Go Back
                            </Button>
                        ]}
                    />
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
