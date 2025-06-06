import React, {useContext, useEffect, useMemo} from 'react';
import '../styles/MeetPage.css';
import { SocketContext } from '../context/SocketContext';
import {videoEventEmitter, VideoEventsMap} from "./VideoPlayer";
import MicOffIcon from '@mui/icons-material/MicOff';
import MicIcon from '@mui/icons-material/Mic';
import IconButton from '@mui/material/IconButton';
import LogoutIcon from "@mui/icons-material/Logout";
import {Tooltip} from "@mui/material";

const Participants = ({ userId, hostId, roomId }) => {
    const {participants, participantsListOpen, audioTracks, socket } = useContext(SocketContext);

    const members = useMemo(() => {
        return Object.entries(participants).map(([id, member]) => {
            return {
                user: audioTracks.find(user => user.uid === id),
                id,
                name: member,
            };
        })

    }, [participants, audioTracks]);

    const handleMuteUser = async (targetUserId) => {
        await socket.emit('mute-user', { targetUserId, userId, roomId });
    };

    const handleKickUser = async (targetUserId) => {
       await socket.emit('kick-user', { targetUserId, userId, roomId });
    };

    return (
        <div className='participants-page' style={participantsListOpen ? {right: "1vw"} : {right: "-25vw"}}>
            <h3>Members Online..</h3>
            <hr id='h3-hr' />
            <div className="participants-container">
                {members.length > 0 ?
                    members.map(({ id, user, name }) => {
                        const actionAllowed = user || id === userId;
                        const isHost = hostId === userId;

                        return (
                            <div className="participant"
                                 key={id}
                                 style={{
                                     cursor: actionAllowed ? 'pointer' : 'not-allowed',
                                     pointerEvents: actionAllowed ? 'auto' : 'none',
                                     display: 'flex',
                                     gap: '4px',
                                     justifyContent: 'space-between',
                                     alignItems: 'center'
                                 }}
                                 onClick={() => videoEventEmitter.emit(VideoEventsMap.setActiveUser, id)}
                            >
                                <div style={{display: 'flex', gap: '4px', alignItems: 'center'}}>
                                    <div className="participant-logo">
                                        <p>{name.charAt(0).toUpperCase()}</p>
                                    </div>
                                    <h4>{name}</h4>
                                    {hostId === id &&
                                        <p style={{
                                            padding: '0px 10px',
                                            background: 'blue',
                                            color: 'white',
                                            borderRadius: '0.7rem'
                                        }}>host</p>
                                    }
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: '4px',
                                    alignItems: 'center',
                                }}>
                                    {id !== userId && <IconButton
                                        sx={{
                                            pointerEvents: isHost ? 'auto' : 'none',
                                        }}
                                        onClick={() => {
                                            if (user?.hasAudio) {
                                                handleMuteUser(id);
                                            }
                                        }}
                                        size="small"
                                    >
                                        {user?.hasAudio ? <MicIcon fontSize="small"  /> :
                                            isHost ?
                                                <Tooltip title="Mute user" placement="top">
                                                    <MicOffIcon fontSize="small" />
                                                </Tooltip> :
                                            <MicOffIcon fontSize="small" />}
                                    </IconButton>}
                                    {isHost && id !== hostId &&
                                        <IconButton sx={{
                                            pointerEvents: 'auto',
                                        }} onClick={() => handleKickUser(id)}>
                                            <Tooltip title="Kick user" placement="top">
                                                <LogoutIcon fontSize="small" />
                                            </Tooltip>
                                        </IconButton>}
                                </div>
                            </div>
                        );
                    })
                    :
                    <p>No members</p>
                }
            </div>
        </div>
    );
};

export default Participants;