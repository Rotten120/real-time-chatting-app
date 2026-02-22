export function Message(sender, content, createdAt) {
  return {sender, content, createdAt};
}

export function MessageLog(message, chatRoomId) {
  console.log(
    `[Room ${chatRoomId}] ${message.sender} sent `,
    `\"${message.content}\" on ${message.createdAt}`
  );
}
