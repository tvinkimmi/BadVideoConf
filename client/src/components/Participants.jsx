import React, {useContext, useEffect, useMemo} from 'react';
import '../styles/MeetPage.css';
import { SocketContext } from '../context/SocketContext';
import {videoEventEmitter, VideoEventsMap} from "./VideoPlayer";
import MicOffIcon from '@mui/icons-material/MicOff';
import MicIcon from '@mui/icons-material/Mic';
import IconButton from '@mui/material/IconButton';

const Participants = ({ userId, hostId }) => {
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

    useEffect(() => {
        console.log('audioTracks')
        console.log(audioTracks);
    }, [audioTracks])


    const handleMuteUser = (targetUserId) => {
        // Здесь будет логика отключения звука пользователя через сокет
        if (userId === hostId) {
            // Эмитим событие на сервер для отключения звука
            socket.emit('mute-user', { targetUserId });
        }
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

                        console.log('eblan', user)

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

                                {isHost && id !== hostId && (
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMuteUser(id);
                                        }}
                                        size="small"
                                    >
                                        {user?.hasAudio ? <MicIcon fontSize="small"  /> : <MicOffIcon fontSize="small" />}
                                    </IconButton>
                                )}
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