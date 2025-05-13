import React, { useEffect, useState } from 'react';
import { Select, MenuItem, IconButton } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AgoraRTC from 'agora-rtc-sdk-ng';
import {videoConfig} from "../pages/MeetRoom";

export const DeviceSelect = ({ tracks, client, icon, type }) => {
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const getDevices = async () => {
            try {
                const deviceList = await (type === 'video' ?
                    AgoraRTC.getCameras() :
                    AgoraRTC.getMicrophones());
                setDevices(deviceList);
                if (deviceList.length) setSelectedDevice(deviceList[0].deviceId);
            } catch (error) {
                console.error(`Ошибка при получении списка ${type === 'video' ? 'камер' : 'микрофонов'}:`, error);
            }
        };
        getDevices();
    }, [type]);

    const handleDeviceChange = async (deviceId) => {
        setSelectedDevice(deviceId);
        try {
            const trackIndex = type === 'video' ? 1 : 0;
            if (tracks[trackIndex]) {
                await client.unpublish(tracks[trackIndex]);
                await tracks[trackIndex].stop();
            }

            const newTrack = await (type === 'video' ?
                AgoraRTC.createCameraVideoTrack({ cameraId: deviceId, encoderConfig: videoConfig.encoderConfig }) :
                AgoraRTC.createMicrophoneAudioTrack({ microphoneId: deviceId }));

            await client.publish(newTrack);
            tracks[trackIndex] = newTrack;
        } catch (error) {
            console.error(`Ошибка при смене ${type === 'video' ? 'камеры' : 'микрофона'}:`, error);
        }
    };

    return (
        <div className="device-select-container">
            <IconButton
                onClick={() => setIsOpen(!isOpen)}
                className="device-select-button"
            >
                <KeyboardArrowDownIcon />
            </IconButton>
            {isOpen && (
                <div className="device-select-dropdown">
                    {devices.map((device) => (
                        <div
                            key={device.deviceId}
                            className={`device-option ${selectedDevice === device.deviceId ? 'selected' : ''}`}
                            onClick={() => {
                                handleDeviceChange(device.deviceId);
                                setIsOpen(false);
                            }}
                        >
                            {device.label || `Устройство ${device.deviceId.slice(0, 5)}`}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};