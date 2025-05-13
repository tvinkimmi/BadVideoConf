import React, { useContext, useEffect, useState } from 'react';
import '../styles/MeetPage.css';
import {useParams} from 'react-router-dom';
import {SocketContext, socketEvents, SocketEventsMap} from '../context/SocketContext';
import {config, useClient} from '../AgoraSetup';
import VideoPlayer from '../components/VideoPlayer';
import Controls from '../components/Controls';
import Participants from '../components/Participants';
import Chat from '../components/Chat';

import AgoraRTC from "agora-rtc-react";
import participants from "../components/Participants";


export const videoConfig = {
  encoderConfig: {
    width: 1280,
    height: 720,
    bitrate: 400,
    frameRate: 15,
    orientationMode: "adaptative",
    minBitrate: 100,
    maxBitrate: 500,
    minFrameRate: 15,
    maxFrameRate: 30,
  }
}

const MeetRoom =  () => {
  const {id} = useParams();
  const [roomName, setroomName] = useState('')
  const {socket, inCall, setInCall, client, users, setUsers, ready, setReady, tracks, setTracks, setStart, setParticipants, start, setAudioTracks} = useContext(SocketContext);
  const userId = localStorage.getItem("userId");
  const [hostId, setHostId] = useState(null);

  useEffect(() =>{
    if (!inCall) {
      socket.emit('join-room', {userId, roomId: id});
      setInCall(true);
    }

    socket.on("room-host", ({host}) => setHostId(host));

    socket.emit('get-room-host', { roomId: id });

    socket.on("participants-list", async ( {usernames, roomName})=>{
      setParticipants(usernames);
      setroomName(roomName);
    });

    socket.on("user-joined", async () => {
      socket.emit('get-participants', {roomId: id});
    });

    socket.emit('get-participants', {roomId: id});

    socket.on("force-mute", async ({ targetUserId }) => {
        if (targetUserId === userId) {
          const audioTrack = client.localTracks.find((track) => track.trackMediaType === "audio");

          if (audioTrack) {
            await audioTrack.setMuted(true);
            socketEvents.emit(SocketEventsMap.AudioMuted, true)
          }
        }
    });

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

          setAudioTracks((prevAudioTracks) => {
            return [...prevAudioTracks, user];
          });
        }
      });

      client.on("user-unpublished", (user, mediaType) => {

        if (mediaType === "audio") {
          if (user.audioTrack) user.audioTrack.stop();
          setAudioTracks((prevAudioTracks) => {
            return prevAudioTracks.filter((audioTrack) => audioTrack.uid !== user.uid);
          });

          return;
        }

        setUsers((prevUsers) => {
          return prevUsers.filter((User) => User.uid !== user.uid);
        });

      });

      client.on("user-left", async () => {
        await socket.emit("get-participants", {roomId: id});
      });

      try {
        await client.join(config.appId, name, config.token, userId);
        try {

          const [audioTrack, videoTrack] = await Promise.all([AgoraRTC.createMicrophoneAudioTrack(), await AgoraRTC.createCameraVideoTrack(videoConfig)])


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
        <Participants userId={userId} hostId={hostId} roomId={id} />

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