import { useState } from "react";

export default function Message({ role, content, pending, avatar }) {
  const isUser = role === "user";
  const [avatarBroken, setAvatarBroken] = useState(false);
  const showAvatar = avatar && !avatarBroken;

  return (
    <div className={`row ${isUser ? "row-user" : "row-bot"}`}>
      {!isUser &&
        (showAvatar ? (
          <img
            className="avatar avatar-img"
            src={avatar}
            alt=""
            onError={() => setAvatarBroken(true)}
          />
        ) : (
          <div className="avatar">AI</div>
        ))}
      <div className={`bubble ${isUser ? "bubble-user" : "bubble-bot"}`}>
        {pending ? (
          <span className="typing">
            <i /><i /><i />
          </span>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
