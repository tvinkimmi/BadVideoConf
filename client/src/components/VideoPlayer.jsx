import { AgoraVideoPlayer } from "agora-rtc-react";

import {SocketContext, socketEvents, SocketEventsMap} from "../context/SocketContext";
import {useContext, useEffect, useMemo, useState} from "react";
import {Box} from "@mui/material";
import {useClient } from "../AgoraSetup";
import {EventEmitter} from "../utils/event-emitter";

export const VideoEventsMap = {
    setActiveUser: 'setActiveUser',
};
export const videoEventEmitter = new EventEmitter();

export default function Video({ userId }) {
  const { users, participants} = useContext(SocketContext);

  const client = useClient();
  const [isVideoMuted, setIsVideoMuted] = useState(client.localTracks.find((track) => track.trackMediaType === "video").muted);

    const videoTrack = useMemo(() => {
        return client.localTracks.find((track) => track.trackMediaType === "video");
    }, [client.localTracks]);

    const [selectedVideoTrack, setSelectedVideoTrack] = useState(videoTrack);

    useEffect(() => {
        const handler = (uid) => {
            if (uid === userId) {
                setSelectedVideoTrack(videoTrack);
                return;
            }

            const nextVideoTrack = users.find((user) => user.uid === uid)?.videoTrack;

            if (nextVideoTrack) {
                setSelectedVideoTrack(nextVideoTrack);
            }
        }

        videoEventEmitter.on(VideoEventsMap.setActiveUser, handler);

        return () => {
            videoEventEmitter.off(VideoEventsMap.setActiveUser, handler);
        }
    }, [videoTrack])

    useEffect(() => {
        socketEvents.on(SocketEventsMap.VideoMuted, setIsVideoMuted);

        return () => {
            socketEvents.off(SocketEventsMap.VideoMuted, setIsVideoMuted);
        }
    }, []);


    const handleVideoSelect = (videoTrack) => {
        if (!videoTrack || !videoTrack.play) return;
        setSelectedVideoTrack(videoTrack);
    };

    const videoUsers = users.filter(user => {
        return user.videoTrack !== selectedVideoTrack && user.hasVideo;
    });

    return (
        <Box sx={{
            height: '92vh',
            width: '100%',
            padding: '2%',
            display: 'flex',
            gap: '20px',
            bgcolor: 'rgb(1, 8, 15)',
        }}>
            <Box sx={{
                width: videoUsers.length > 0 ? '65%' : '100%',
                height: '100%',
                borderRadius: '0.7rem',
                overflow: 'hidden',
            }}>
                {selectedVideoTrack ? (
                    selectedVideoTrack === videoTrack ?  isVideoMuted ?
                            <Box sx={{
                                height: '100%',
                                width: '100%',
                                borderRadius: '0.7rem',
                                overflow: 'hidden',
                                position: 'relative',
                                cursor: 'pointer',
                                border: '1px solid rgba(255, 255, 255, 0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                typography: 'h3',
                                color: 'white'
                            }}>
                                You
                            </Box>
                            : <AgoraVideoPlayer style={{
                            height: '92vh',
                        }} videoTrack={selectedVideoTrack} />
                        : <AgoraVideoPlayer style={{
                            height: '92vh',
                        }} videoTrack={selectedVideoTrack} />

                ) : videoTrack && (
                    <AgoraVideoPlayer style={{
                        height: '92vh',
                    }} videoTrack={videoTrack} />
                )}
            </Box>

            <Box sx={{
                width: '35%',
                height: '100%',
                display: videoUsers.length > 0 ? 'flex' : 'none',
                flexDirection: 'column',
                gap: '20px',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                    display: 'none'
                },
                scrollbarWidth: 'none',
            }}>
                {selectedVideoTrack !== videoTrack && <Box sx={{
                    height: '51vh',
                    width: '100%',
                    borderRadius: '0.7rem',
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: 'pointer',
                    border: '1px solid rgba(255, 255, 255, 0.4)'
                }} onClick={() => handleVideoSelect(videoTrack)}>
                    <AgoraVideoPlayer style={{
                        height: '51vh'
                    }} videoTrack={videoTrack} />
                    <div style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        color: 'rgb(227, 230, 233)',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                    }}>
                        You
                    </div>
                </Box>}

                {videoUsers.map((user) => {
                    return (
                        <Box
                            key={user.uid}
                            sx={{
                                height: '51vh',
                                width: '100%',
                                borderRadius: '0.7rem',
                                overflow: 'hidden',
                                position: 'relative',
                                cursor: 'pointer',
                                border: '1px solid rgba(255, 255, 255, 0.4)'
                            }}
                            onClick={() => handleVideoSelect(user.videoTrack)}
                        >
                            <AgoraVideoPlayer style={{
                                height: '51vh'
                            }} videoTrack={user.videoTrack} />
                            <Box sx={{
                                position: 'absolute',
                                bottom: '10px',
                                left: '10px',
                                color: 'rgb(227, 230, 233)',
                                bgcolor: 'rgba(0, 0, 0, 0.5)',
                                padding: '4px 8px',
                                borderRadius: '4px',
                            }}>
                                {participants[user.uid] || user.uid}
                            </Box>
                        </Box>
                    )
                })}
            </Box>
        </Box>
    );
};
