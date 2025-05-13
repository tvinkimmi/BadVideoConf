import Rooms from '../models/Rooms.js';
import User from '../models/User.js';


const roomHandler = ( socket) => {
    socket.on('get-room-host', async ({ roomId })=>{
        const room = await Rooms.findOne({_id: roomId});
        await socket.emit("room-host", { host: room.host });
    });

    socket.on('mute-user', async ({ userId, targetUserId, roomId }) => {
        const room = await Rooms.findOne({_id: roomId});

        if (room && room.host === userId) {
            socket.broadcast.to(roomId).emit("force-mute", { targetUserId })
        }
    });

    socket.on('create-room', async ({userId, roomName, newMeetType, newMeetDate, newMeetTime})=>{
        const newRoom = new Rooms({
            roomName: roomName,
            host: userId,
            meetType: newMeetType,
            meetDate: newMeetDate,
            meetTime: newMeetTime,
            participants: [],
            currentParticipants: []
        });
        const room = await newRoom.save();
        await socket.emit("room-created", {roomId: room._id, meetType: newMeetType});
    });

    socket.on('user-code-join', async ({roomId})=>{
        const room = await Rooms.findOne({_id: roomId});
        if(room){
            socket.join(roomId);
            await socket.emit("room-exists", {roomId});
        }else{
            socket.emit("room-not-exist");
        }
    });

    socket.on('join-room', async ({roomId, userId})=>{
        await Rooms.updateOne({_id: roomId}, {$addToSet: {participants: userId}});
        await Rooms.updateOne({_id: roomId}, {$addToSet: {currentParticipants: userId}});
        await socket.join(roomId);
        socket.broadcast.to(roomId).emit("user-joined", {userId});
    });

    socket.on("update-username", async ({updateText, userId})=>{
        await User.updateOne({ _id: userId }, { $set: {username: updateText} });
    })

    socket.on("get-participants", async ({roomId})=>{
        const room = await Rooms.findOne({ _id: roomId });
        const roomName = room.roomName;
        const participants = room.currentParticipants;
        const usernames = {};

        const users = await User.find(
            { _id: { $in: participants } },
        ).exec();

        users.forEach(user => {
            const { _id, username } = user;
            usernames[ _id.valueOf().toString()] = username;
        });

        socket.emit("participants-list", {usernames, roomName});
    })


    socket.on("fetch-my-meets", async({userId}) =>{
        const meets = await Rooms.find({ host: userId }, { _id: 1, roomName: 1, meetType: 1, meetDate: 1,meetTime: 1, createdAt: 1 }).exec();
        await socket.emit("meets-fetched", {myMeets: meets});
    })

    socket.on("delete-meet", async({roomId}) =>{
        await Rooms.deleteOne({ _id: roomId })
        socket.emit("room-deleted");
    })

    socket.on("update-meet-details", async({roomId, roomName, newMeetDate, newMeetTime}) =>{
        await Rooms.updateOne({ _id: roomId }, { $set: {roomName:roomName, newMeetDate:newMeetDate, newMeetTime:newMeetTime} });
        socket.emit("meet-details-updated");
    })



    socket.on("user-left-room", async({userId, roomId})=>{
        await Rooms.updateOne({_id: roomId}, {$pull: {currentParticipants: userId}});

        socket.broadcast.to(roomId).emit('user-left');

        await socket.leave(roomId);
    })

    socket.on("new-chat", async ({msg, roomId})=>{
        socket.broadcast.to(roomId).emit("new-chat-arrived", {msg, room: roomId});
    })
}

export default roomHandler;