import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Result, Spin, Typography } from 'antd';
import { SafetyCertificateOutlined, AlertOutlined, ReloadOutlined } from '@ant-design/icons';
import { adminAPI } from '../../services/api';
import { toast } from 'react-toastify';

const { Text, Paragraph } = Typography;

const IntegrityStatus = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // { valid: boolean, brokenIndex: number }
    const hasFetched = useRef(false);

    const verifySystem = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.verifyLogIntegrity();
            setStatus(response.data);
            if (response.data.valid) {
                toast.success('System Integrity Verified: Blockchain Hash Chain is Intact');
            } else {
                toast.error(`TAMPER DETECTED at Index ${response.data.brokenIndex}`);
            }
        } catch (error) {
            toast.error('Verification Failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!hasFetched.current) {
            verifySystem();
            hasFetched.current = true;
        }
    }, []);

    return (
        <Card
            title={<span><SafetyCertificateOutlined /> Cryptographic Ledger Integrity</span>}
            extra={<Button icon={<ReloadOutlined />} onClick={verifySystem}>Verify Chain</Button>}
            className="mb-6 shadow-md"
        >
            {loading ? (
                <div className="flex flex-col items-center gap-4 py-8">
                    <Spin size="large" />
                    <Text type="secondary">Scanning SHA256 Hash Chain...</Text>
                </div>
            ) : status ? (
                <Result
                    status={status.valid ? "success" : "error"}
                    title={status.valid ? "System Integrity Intact" : "Ledger Tampering Detected"}
                    subTitle={status.valid
                        ? "All audit logs are cryptographically chained and verified."
                        : `Hash chain broken at sequence index #${status.brokenIndex}. Investigation required.`}
                    icon={status.valid ? <SafetyCertificateOutlined /> : <AlertOutlined />}
                >
                    {status.valid && (
                        <div className="text-center">
                            <Text type="secondary">
                                Secured by SHA256 Hash-Chaining Technology
                            </Text>
                        </div>
                    )}
                </Result>
            ) : null}
        </Card>
    );
};

export default IntegrityStatus;
