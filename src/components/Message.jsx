export default function Message({ role, content, pending }) {
  const isUser = role === "user";
  return (
    <div className={`row ${isUser ? "row-user" : "row-bot"}`}>
      {!isUser && <div className="avatar">AI</div>}
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
