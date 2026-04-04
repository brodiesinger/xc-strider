import React, { useState } from "react";

export default function PacketImage({ url, caption }) {
  const [error, setError] = useState(false);

  if (error) return null; // hide broken images silently

  return (
    <div className="text-center">
      <img
        src={url}
        alt={caption || "Packet image"}
        onError={() => setError(true)}
        className="max-w-full max-h-96 mx-auto rounded-lg object-contain"
      />
      {caption?.trim() && (
        <p className="text-xs text-gray-400 mt-2 italic">{caption}</p>
      )}
    </div>
  );
}