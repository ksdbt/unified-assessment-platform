import React, { useState } from 'react';
import { Modal, Input, Button, Result, Typography, Space, Form } from 'antd';
import { SafetyCertificateOutlined, LockOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const MFAModal = ({ visible, onVerify, onCancel, loading }) => {
    const [code, setCode] = useState('');

    const handleVerify = () => {
        onVerify(code);
    };

    return (
        <Modal
            open={visible}
            onCancel={onCancel}
            footer={null}
            centered
            width={400}
            title={null}
            closable={!loading}
            maskClosable={false}
        >
            <div className="text-center p-4">
                <Result
                    icon={<SafetyCertificateOutlined style={{ color: '#1890ff' }} />}
                    title={<Title level={4}>Security Verification</Title>}
                    subTitle="High-privilege access requires secondary verification. Enter your security code to proceed."
                />

                <Form onFinish={handleVerify}>
                    <Space direction="vertical" size="large" className="w-full">
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Enter 6-digit code"
                            size="large"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="text-center text-xl tracking-widest"
                            maxLength={6}
                            disabled={loading}
                        />

                        <Button
                            type="primary"
                            size="large"
                            block
                            htmlType="submit"
                            loading={loading}
                        >
                            Verify and Login
                        </Button>

                        <div className="text-center">
                            <Text type="secondary" className="text-xs">
                                Demo Hint: The default security code is <Text code>123456</Text>
                            </Text>
                        </div>
                    </Space>
                </Form>
            </div>
        </Modal>
    );
};

export default MFAModal;
