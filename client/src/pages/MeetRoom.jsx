import React, { useContext, useEffect, useState } from 'react';
import '../styles/MeetPage.css';
import {useParams} from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import { config } from '../AgoraSetup';
import VideoPlayer from '../components/VideoPlayer';
import Controls from '../components/Controls';
import Participants from '../components/Participants';
import Chat from '../components/Chat';

import AgoraRTC from "agora-rtc-react";
import participants from "../components/Participants";



const MeetRoom =  () => {
  const {id} = useParams();
  const [roomName, setroomName] = useState('')
  const {socket, inCall, setInCall, client, users, setUsers, ready, setReady, tracks, setTracks, setStart, setParticipants, start} = useContext(SocketContext);
  const userId = localStorage.getItem("userId");
  
  useEffect(() =>{
    if (!inCall) {
      socket.emit('join-room', {userId, roomId: id});      
      setInCall(true);
    }

    socket.on("participants-list", async ( {usernames, roomName})=>{
      setParticipants(usernames);
      setroomName(roomName);
    });

    socket.on("user-joined", async () => {
      socket.emit('get-participants', {roomId: id});
    });

    socket.emit('get-participants', {roomId: id});
  }, [socket]);
    
    
  useEffect(() => {
    let init = async (name) => {
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "video") {
          setUsers((prevUsers) => {
            return [...prevUsers, user];
          });
        }
        if (mediaType === "audio") {
          user.audioTrack.play();
        }
      });

      client.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "audio") {
          if (user.audioTrack) user.audioTrack.stop();
        }
        if (mediaType === "video") {
          setUsers((prevUsers) => {
            return prevUsers.filter((User) => User.uid !== user.uid);
          });
        }
      });

      client.on("user-left", () => {
        socket.emit("get-participants", {roomId: id});
      });

      try {
        await client.join(config.appId, name, config.token, userId);
        try {

          const [audioTrack, videoTrack] = await Promise.all([AgoraRTC.createMicrophoneAudioTrack(), await AgoraRTC.createCameraVideoTrack()])


          setTracks([audioTrack, videoTrack]);
          setReady(true);

          await Promise.all([
            audioTrack.setMuted(true),
            videoTrack.setMuted(true)
          ])

          // 3. Publish tracks
          await client.publish([audioTrack, videoTrack]);
          setStart(true);
        } catch (trackError) {
          console.error("Device access error:", trackError);
          alert("Please allow microphone and camera access!");
        }
        
      } catch (joinError) {
        console.error("Join failed:", joinError);
      }
    };
    
      if (!ready) {
      try {
        init(id);
      } catch (error) {
        console.log(error);
      }
    }
  }, [id, client, ready, tracks]);
 
  return (

    <div className='meetPage'>

        <div className="meetPage-header">
          <h3>Meet: <span>{roomName}</span></h3>
          <p>Meet Id: <span id='meet-id-copy'>{id}</span></p>
        </div>
        <Participants userId={userId} />

        <Chat roomId={id} userId={userId}  />
       

        <div className="meetPage-videoPlayer-container">

        {start && tracks ?
        <VideoPlayer tracks={tracks} users={users} userId={userId} />
        : ''
        }

        </div>

        <div className="meetPage-controls-part">

        {ready && tracks && (
          <Controls tracks={tracks} roomId={id} userId={userId} />
        )}

        </div>

        

    </div>
  )
}

export default MeetRoom;