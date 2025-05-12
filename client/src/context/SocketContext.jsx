import React, { createContext, useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import socketIoClient from 'socket.io-client';
import { useClient } from '../AgoraSetup'
import {EventEmitter} from "../utils/event-emitter";

 
export const SocketContext = createContext();

const WS = 'http://localhost:6001';

const socket = socketIoClient(WS);

export const SocketContextProvider =  ({children}) => {
  
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [inCall, setInCall] = useState(false);
  const [users, setUsers] = useState([]);
  const [start, setStart] = useState(false);
  const client = useClient();
  const [tracks, setTracks] = useState(null);
  const [ready, setReady] = useState(false);

  const [screenTrack, setScreenTrack] = useState(null);

  const [participants, setParticipants] = useState({});

  const [myMeets, setMyMeets] = useState([]);

  const [participantsListOpen, setParticipantsListOpen] = useState(false);
  const [chatsContainerOpen, setChatsContainerOpen] = useState(false);

  const [newMeetType, setNewMeetType] = useState('');
  
  useEffect(()=>{

    socket.on('room-created', ({roomId, meetType}) =>{

      if (meetType === 'instant'){

        navigate(`/meet/${roomId}`);

      }else if(meetType === 'scheduled'){
        navigate(`/profile`);
      }
      
    });

  }, [socket]);
  
  return (
    <SocketContext.Provider  value={{myMeets, setMyMeets, newMeetType, setNewMeetType, participants, setParticipants, userId, socket, inCall, setInCall, ready, setReady, tracks, setTracks, screenTrack, setScreenTrack, client, users, setUsers, start, setStart, participantsListOpen, setParticipantsListOpen, chatsContainerOpen, setChatsContainerOpen}} >{children}</SocketContext.Provider>
  )
}

export const SocketEventsMap = {
  AudioMuted: 'AudioMuted',
  VideoMuted: 'VideoMuted',
}

export const socketEvents = new EventEmitter();


// export default socketContext