export function Message(id, sender, content, createdAt) {
  return {id, sender, content, createdAt};
}

export function MessageLog(message, chatRoomId) {
  console.log(
    `[Room ${chatRoomId} : Id ${message.id}] ${message.sender} sent `,
    `\"${message.content}\" on ${message.createdAt}`
  );
}
