import React, { useRef, useState, useEffect } from 'react';
import { Button, Modal, message, Progress, Space, Input, Form } from 'antd';
import { CameraOutlined, ScanOutlined, SafetyCertificateOutlined, ReloadOutlined, LockOutlined } from '@ant-design/icons';
import { request } from '../../util/helper';
import { getFaceApi } from '../../util/faceApiLoader';

const FaceEnrollment = ({ visible, onCancel, onSuccess }) => {
    const videoRef = useRef();
    const canvasRef = useRef();
    const [step, setStep] = useState('verify'); // 'verify' | 'enrolling'
    const [initializing, setInitializing] = useState(true);
    const [scanned, setScanned] = useState(false);
    const [descriptor, setDescriptor] = useState(null);
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [form] = Form.useForm();

    // Reset state on open
    useEffect(() => {
        if (visible) {
            setStep('verify');
            setScanned(false);
            setDescriptor(null);
            form.resetFields();
        }
    }, [visible, form]); // Added form to dependency array

    // Load models only when entering 'enrolling' step
    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            try {
                console.log("Loading Face API Models...");
                const api = getFaceApi();
                console.log("FaceAPI object:", api); // Keep existing console.log

                await Promise.all([
                    api.loadSsdMobilenetv1Model(MODEL_URL),
                    api.loadFaceLandmarkModel(MODEL_URL),
                    api.loadFaceRecognitionModel(MODEL_URL),
                ]);
                console.log("Face API Models Loaded");
                setInitializing(false);
            } catch (err) {
                console.error("Failed to load models", err);
                message.error("Failed to load face recognition models: " + err.message);
            }
        };

        if (visible && step === 'enrolling') {
            loadModels();
        }
    }, [visible, step]);

    // Start video only when in 'enrolling' step
    useEffect(() => {
        let stream = null; // Declare stream outside to be accessible in cleanup
        if (!initializing && visible && step === 'enrolling') {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then((s) => {
                    stream = s; // Assign stream here
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch((err) => {
                    console.error(err);
                    message.error("Camera access denied");
                });
        }
        return () => {
            // Cleanup stream
            if (stream) { // Check if stream was successfully obtained
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [initializing, visible, step]);

    const handleVerifyPassword = async (values) => {
        setVerifyLoading(true);
        try {
            const res = await request("auth/verify-password", "post", { password: values.password });
            if (res && res.success) {
                setStep('enrolling');
            } else {
                message.error(res.message || "Incorrect password");
            }
        } catch (err) {
            message.error("Verification failed");
        } finally {
            setVerifyLoading(false);
        }
    };

    const handleScan = async () => {
        if (videoRef.current) {
            // Ensure models are loaded
            if (initializing) return;

            const api = getFaceApi();
            const detections = await api.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();

            if (detections) {
                setDescriptor(Array.from(detections.descriptor)); // Convert Float32Array to normal array
                setScanned(true);
                message.success("Face scanned successfully!"); // Original message
            } else {
                message.warning("No face detected. Please look at the camera.");
            }
        }
    };

    const handleSave = async () => {
        if (!descriptor) return;
        try {
            const res = await request("auth/enroll-face", "post", { descriptor });
            if (res && res.success) {
                message.success("Face enrolled successfully!");
                onSuccess();
            } else {
                message.error(res.message || "Failed to enrol face");
            }
        } catch (err) {
            message.error("Error saving face data");
        }
    };

    return (
        <Modal
            title={step === 'verify' ? "Security Verification" : "Face ID Enrollment"}
            open={visible}
            onCancel={onCancel}
            footer={null}
            destroyOnClose
            maskClosable={false}
        >
            {step === 'verify' ? (
                <div style={{ padding: '20px 0' }}>
                    <p style={{ marginBottom: 20 }}>Please enter your password to modify Face ID settings.</p>
                    <Form form={form} onFinish={handleVerifyPassword} layout="vertical">
                        <Form.Item name="password" rules={[{ required: true, message: 'Please enter your password' }]}>
                            <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={verifyLoading} block>
                                Verify & Continue
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            ) : (
                <div style={{ textAlign: 'center' }}>
                    {initializing ? (
                        <div>Loading AI Models... <Progress percent={80} status="active" /></div>
                    ) : (
                        <>
                            <div style={{ position: 'relative', margin: '0 auto', width: 320, height: 240, overflow: 'hidden', borderRadius: 8, background: '#000' }}>
                                <video ref={videoRef} autoPlay muted width="320" height="240" style={{ objectFit: 'cover' }} />
                                <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
                            </div>

                            <Space style={{ marginTop: 20 }}>
                                {!scanned ? (
                                    <Button type="primary" icon={<ScanOutlined />} onClick={handleScan}>
                                        Scan Face
                                    </Button>
                                ) : (
                                    <>
                                        <Button icon={<ReloadOutlined />} onClick={() => { setScanned(false); setDescriptor(null); }}>
                                            Retake
                                        </Button>
                                        <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={handleSave}>
                                            Save Face Data
                                        </Button>
                                    </>
                                )}
                            </Space>

                            <p style={{ marginTop: 10, color: '#888' }}>
                                {scanned ? "Face captured! Click Save to finish." : "Ensure good lighting and look directly at the camera."}
                            </p>
                        </>
                    )}
                </div>
            )}
        </Modal>
    );
};

export default FaceEnrollment;
