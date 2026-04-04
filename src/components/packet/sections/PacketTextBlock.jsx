import React from "react";

export default function PacketTextBlock({ title, body }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>
      {body?.trim() && (
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{body}</p>
      )}
    </div>
  );
}