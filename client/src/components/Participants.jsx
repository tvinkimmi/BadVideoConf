import React, { useContext } from 'react';
import '../styles/MeetPage.css';
import { SocketContext } from '../context/SocketContext';
import {videoEventEmitter, VideoEventsMap} from "./VideoPlayer";

const Participants = ({ userId }) => {

    const {participants, participantsListOpen, users } = useContext(SocketContext);

  return (
    <div className='participants-page' style={participantsListOpen ? {right: "1vw"} : {right: "-25vw"}}>
        <h3>Members Online..</h3>
        <hr id='h3-hr' />
        <div className="participants-container">

            {Object.values(participants).length > 0 ?

            Object.entries(participants).map(([id, member])=>{
                const user = users.find(user => user.uid === id);
                const actionAllowed = user || id === userId;

                    return(
                    <div className="participant" style={{
                        cursor:actionAllowed ? 'pointer' : 'not-allowed',
                        pointerEvents: actionAllowed ? 'auto' : 'none',
                    }}
                         onClick={() => videoEventEmitter.emit(VideoEventsMap.setActiveUser, id)}
                    >
                    <div className="participant-logo"><p>{member.charAt(0).toUpperCase()}</p></div>
                    <h4>{member}</h4>
                </div>
                    )
                })
        
            :
            <p>No members</p>
            }
        </div>
    </div>
  )
}

export default Participants